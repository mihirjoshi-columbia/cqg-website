"use client";

import { useEffect, useRef, useState } from "react";
import { CP_PROBLEMS, type CpTest } from "@/lib/cp/problems";
import { CppRunner, judge, PythonRunner, type Language, type Runner, type Verdict } from "@/lib/cp/runner";
import Statement from "./Statements";

// ===========================================================================
// The competitive programming page: four problems, a Python or C++ editor,
// and a judge that runs in this browser (lib/cp/runner.ts).
//
// Drafts sit in localStorage so a refresh does not lose code. Opening the
// page and each Submit are reported to /api/cp/activity for the admin board;
// that is fire-and-forget, so a failed report never blocks a verdict.
// ===========================================================================

const LANGUAGES: Record<Language, { label: string; starter: string; hint: string }> = {
    python: {
        label: "Python 3.12",
        starter: `import sys

def main():
    data = sys.stdin.read().split()
    # your solution here

main()
`,
        hint: "Read from standard input and print to standard output.",
    },
    cpp: {
        label: "C++20",
        starter: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    // your solution here
}
`,
        hint: "Clang -O2, gnu++20, <bits/stdc++.h> available. Exceptions are off, and recursion deeper than about 10,000 levels crashes in the browser.",
    },
};

const LANGUAGE_KEY = "cqg-cp-language";

function draftKey(language: Language, id: string) {
    return `cqg-cp-draft:${language}:${id}`;
}

function readStored(key: string): string | null {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeStored(key: string, value: string) {
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // Private mode or blocked storage: it just will not survive a refresh.
    }
}

function readDraft(language: Language, id: string): string {
    return readStored(draftKey(language, id)) ?? LANGUAGES[language].starter;
}

function report(body: object) {
    fetch("/api/cp/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    }).catch(() => {});
}

function clip(text: string, limit = 600): string {
    return text.length > limit ? `${text.slice(0, limit)}\n… (${text.length - limit} more characters)` : text;
}

type Status =
    | { kind: "idle" }
    | { kind: "loading"; percent: number | null }
    | { kind: "compiling" }
    | { kind: "running"; label: string; test: number; total: number }
    | { kind: "done"; label: string; verdict: Verdict }
    | { kind: "failed"; message: string };

const VERDICT_TITLE: Record<Exclude<Verdict["kind"], "accepted" | "compile">, string> = {
    wrong: "Wrong answer",
    runtime: "Runtime error",
    timeout: "Time limit exceeded",
};

export default function CpJudge() {
    const [problemId, setProblemId] = useState(CP_PROBLEMS[0].id);
    const [language, setLanguage] = useState<Language>("python");
    const [code, setCode] = useState(LANGUAGES.python.starter);
    const [status, setStatus] = useState<Status>({ kind: "idle" });
    const [solved, setSolved] = useState<Set<string>>(new Set());
    // C++ download progress, shown before the first submit too.
    const [cppPercent, setCppPercent] = useState<number | null>(null);
    const runners = useRef<Partial<Record<Language, Runner>>>({});
    const testCache = useRef(new Map<string, CpTest[]>());

    const problem = CP_PROBLEMS.find((p) => p.id === problemId)!;
    const busy = status.kind === "loading" || status.kind === "compiling" || status.kind === "running";

    function runnerFor(lang: Language): Runner {
        const existing = runners.current[lang];
        if (existing) return existing;
        const created = lang === "python" ? new PythonRunner() : new CppRunner();
        runners.current[lang] = created;
        return created;
    }

    // Start the toolchain as soon as it is chosen, so the first submit is not
    // a long wait. C++ is ~24 MB, so only once someone picks it.
    function warm(lang: Language) {
        const runner = runnerFor(lang);
        if (lang === "cpp") {
            runner.load((fraction) => setCppPercent(Math.round(fraction * 100))).then(
                () => setCppPercent(null),
                () => setCppPercent(null),
            );
        } else {
            runner.load().catch(() => {});
        }
    }

    useEffect(() => {
        // Language and drafts live in this browser only; read after mount so
        // server and client HTML match. Later switches load theirs in
        // selectProblem / selectLanguage.
        const stored = readStored(LANGUAGE_KEY);
        const lang: Language = stored === "cpp" ? "cpp" : "python";
        setLanguage(lang);
        setCode(readDraft(lang, CP_PROBLEMS[0].id));
        warm(lang);
        report({ kind: "started" });
        const owned = runners.current;
        return () => Object.values(owned).forEach((runner) => runner?.dispose());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function selectProblem(id: string) {
        setProblemId(id);
        setCode(readDraft(language, id));
        setStatus({ kind: "idle" });
    }

    function selectLanguage(lang: Language) {
        setLanguage(lang);
        writeStored(LANGUAGE_KEY, lang);
        setCode(readDraft(lang, problemId));
        setStatus({ kind: "idle" });
        warm(lang);
    }

    function edit(next: string) {
        setCode(next);
        writeStored(draftKey(language, problemId), next);
    }

    // Tab indents instead of leaving the editor, which matters in Python.
    function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key !== "Tab" || event.shiftKey) return;
        event.preventDefault();
        const el = event.currentTarget;
        const { selectionStart, selectionEnd } = el;
        const next = `${code.slice(0, selectionStart)}    ${code.slice(selectionEnd)}`;
        edit(next);
        requestAnimationFrame(() => {
            el.selectionStart = el.selectionEnd = selectionStart + 4;
        });
    }

    async function loadTests(): Promise<CpTest[]> {
        const cached = testCache.current.get(problemId);
        if (cached) return cached;
        const response = await fetch(`/api/cp/tests/${problemId}`);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.error ?? "Could not load the tests.");
        testCache.current.set(problemId, payload.tests);
        return payload.tests;
    }

    async function go(mode: "samples" | "submit") {
        const runner = runnerFor(language);
        const label = mode === "samples" ? "Samples" : "Submission";
        setStatus({ kind: "loading", percent: null });
        try {
            const tests = mode === "samples" ? problem.samples : await loadTests();
            await runner.load((fraction) => setStatus({ kind: "loading", percent: Math.round(fraction * 100) }));
            setStatus(language === "cpp" ? { kind: "compiling" } : { kind: "loading", percent: null });
            const verdict = await judge(runner, problem, tests, code, (test) =>
                setStatus({ kind: "running", label, test, total: tests.length }),
            );
            setStatus({ kind: "done", label, verdict });
            if (mode === "submit") {
                report({
                    kind: verdict.kind,
                    problemId: problem.id,
                    language,
                    failedTest: "test" in verdict ? verdict.test : null,
                });
                if (verdict.kind === "accepted") setSolved((prev) => new Set(prev).add(problem.id));
            }
        } catch (error) {
            setStatus({
                kind: "failed",
                message: error instanceof Error ? error.message : "Something went wrong.",
            });
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <nav className="portal-tabs" style={{ marginBottom: 0 }}>
                {CP_PROBLEMS.map((p) => (
                    <button
                        key={p.id}
                        type="button"
                        disabled={busy}
                        onClick={() => selectProblem(p.id)}
                        className={`portal-tab ${p.id === problemId ? "active" : ""}`}
                    >
                        {p.letter}. {p.title}
                        {solved.has(p.id) && <span className="text-lime-deep"> ✓</span>}
                    </button>
                ))}
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="event-card">
                    <div className="event-card-body">
                        <Statement problem={problem} />
                    </div>
                </div>

                <div className="event-card lg:sticky lg:top-6">
                    <div className="event-card-body">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex gap-2" role="radiogroup" aria-label="Language">
                                {(Object.keys(LANGUAGES) as Language[]).map((lang) => (
                                    <button
                                        key={lang}
                                        type="button"
                                        role="radio"
                                        aria-checked={lang === language}
                                        disabled={busy}
                                        onClick={() => selectLanguage(lang)}
                                        className={`tag ${lang === language ? "tag-sky" : "tag-outline"}`}
                                    >
                                        {LANGUAGES[lang].label}
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => edit(LANGUAGES[language].starter)}
                                className="text-ink-faint text-xs font-mono underline"
                            >
                                Reset code
                            </button>
                        </div>
                        <textarea
                            className="field-textarea cp-editor"
                            value={code}
                            onChange={(e) => edit(e.target.value)}
                            onKeyDown={onKeyDown}
                            spellCheck={false}
                            autoCapitalize="off"
                            autoCorrect="off"
                            aria-label="Your solution"
                        />
                        <p className="field-hint">
                            {LANGUAGES[language].hint} Your draft is saved in this browser.
                        </p>
                        {language === "cpp" && cppPercent !== null && !busy && (
                            <p className="text-ink-faint text-xs font-mono">
                                Downloading the C++ compiler (about 24 MB, first time only)… {cppPercent}%
                            </p>
                        )}
                        <div className="flex gap-2 flex-wrap">
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => go("samples")}
                                className="btn-cqg btn-outline-navy btn-sm"
                            >
                                Run samples
                            </button>
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => go("submit")}
                                className="btn-cqg btn-lime btn-sm"
                            >
                                Submit
                            </button>
                        </div>
                        <StatusPanel status={status} language={language} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusPanel({ status, language }: { status: Status; language: Language }) {
    if (status.kind === "idle") return null;
    if (status.kind === "loading") {
        const what = language === "cpp" ? "the C++ compiler" : "Python";
        return (
            <p className="text-ink-faint text-sm font-mono">
                Loading {what}…{status.percent !== null && status.percent < 100 ? ` ${status.percent}%` : ""}
            </p>
        );
    }
    if (status.kind === "compiling") {
        return <p className="text-ink-faint text-sm font-mono">Compiling…</p>;
    }
    if (status.kind === "running") {
        return (
            <p className="text-ink-faint text-sm font-mono">
                Running test {status.test} of {status.total}…
            </p>
        );
    }
    if (status.kind === "failed") {
        return <div className="form-banner form-banner-error">{status.message}</div>;
    }

    const { verdict, label } = status;
    if (verdict.kind === "accepted") {
        return (
            <div className="flex flex-col gap-2">
                <span className="tag tag-lime w-fit">Accepted</span>
                <p className="text-ink-soft text-sm">
                    {label === "Samples"
                        ? `All ${verdict.tests} samples pass. Submit to run the full tests.`
                        : `All ${verdict.tests} tests pass. Slowest took ${Math.round(verdict.maxMs)} ms.`}
                </p>
            </div>
        );
    }

    if (verdict.kind === "compile") {
        return (
            <div className="flex flex-col gap-3">
                <span className="tag tag-pink w-fit">Compilation error</span>
                <pre className="cp-pre cp-pre-error">{clip(verdict.message, 4000)}</pre>
            </div>
        );
    }

    const where = label === "Samples" ? `sample ${verdict.test}` : `test ${verdict.test}`;
    return (
        <div className="flex flex-col gap-3">
            <span className="tag tag-pink w-fit">
                {VERDICT_TITLE[verdict.kind]} on {where}
            </span>
            {verdict.message && <pre className="cp-pre cp-pre-error">{clip(verdict.message, 2000)}</pre>}
            <div className="flex flex-col gap-1">
                <span className="field-label">Input</span>
                <pre className="cp-pre">{clip(verdict.input)}</pre>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                    <span className="field-label">Expected</span>
                    <pre className="cp-pre">{clip(verdict.expected)}</pre>
                </div>
                {verdict.got !== undefined && (
                    <div className="flex flex-col gap-1">
                        <span className="field-label">Your output</span>
                        <pre className="cp-pre">{clip(verdict.got) || "(nothing)"}</pre>
                    </div>
                )}
            </div>
        </div>
    );
}
