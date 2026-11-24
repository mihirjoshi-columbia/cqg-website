// Browser-side judge for the competitive programming set.
//
// Code runs in Web Workers so a slow or infinite solution never freezes the
// page: a time limit is enforced by terminating the worker, the only way to
// stop a program mid-loop.
//
//   Python  public/cp/python-worker.js    Pyodide; one worker, restarted
//                                         (from the browser cache) after a kill.
//   C++     public/cp/cpp-compile-worker.js  clang, kept alive between submits
//           public/cp/cpp-run-worker.js      the compiled program; disposable.
//
// Nothing here is trusted -- a member can make their own browser say
// "Accepted" -- and the activity log the admin board reads from says so.
import { FLOAT_TOLERANCE, type Checker, type CpProblem, type CpTest } from "./problems";
import { testInput } from "./generate";

export type Language = "python" | "cpp";

export type RunOutcome =
    | { kind: "ok"; stdout: string; ms: number }
    | { kind: "error"; message: string; ms: number }
    | { kind: "timeout" };

type RunReply = { type: "result"; id: number; stdout: string; error: string | null; ms: number };

export interface Runner {
    /** Gets the toolchain ready. Safe to call repeatedly. */
    load(onProgress?: (fraction: number) => void): Promise<void>;
    /** Compiles or stores the source; resolves to a compile error, or null. */
    prepare(src: string): Promise<string | null>;
    run(input: string, timeLimitMs: number): Promise<RunOutcome>;
    dispose(): void;
}

/** Waits for one message of a given type, or rejects if the worker fails. */
function once<T extends { type: string }>(worker: Worker, accept: (data: T) => boolean): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const onMessage = (event: MessageEvent<T>) => {
            if (!accept(event.data)) return;
            cleanup();
            resolve(event.data);
        };
        const onError = () => {
            cleanup();
            reject(new Error("The judge failed to start. Check your connection and try again."));
        };
        const cleanup = () => {
            worker.removeEventListener("message", onMessage);
            worker.removeEventListener("error", onError);
        };
        worker.addEventListener("message", onMessage);
        worker.addEventListener("error", onError);
    });
}

/**
 * Posts one run and enforces the limit by calling `kill`. A little slack over
 * the limit covers message passing; the worker's own measurement is what
 * decides a near miss.
 */
function timedRun(
    worker: Worker,
    message: object & { id: number },
    timeLimitMs: number,
    kill: () => void,
): Promise<RunOutcome> {
    return new Promise<RunOutcome>((resolve) => {
        const timer = setTimeout(() => {
            worker.removeEventListener("message", onMessage);
            kill();
            resolve({ kind: "timeout" });
        }, timeLimitMs + 500);
        const onMessage = (event: MessageEvent<RunReply>) => {
            const reply = event.data;
            if (reply.type !== "result" || reply.id !== message.id) return;
            clearTimeout(timer);
            worker.removeEventListener("message", onMessage);
            if (reply.ms > timeLimitMs) resolve({ kind: "timeout" });
            else if (reply.error) resolve({ kind: "error", message: reply.error, ms: reply.ms });
            else resolve({ kind: "ok", stdout: reply.stdout, ms: reply.ms });
        };
        worker.addEventListener("message", onMessage);
        worker.postMessage(message);
    });
}

export class PythonRunner implements Runner {
    private worker: Worker | null = null;
    private ready: Promise<void> | null = null;
    private src = "";
    private nextId = 0;

    load(): Promise<void> {
        if (this.ready) return this.ready;
        const worker = new Worker("/cp/python-worker.js");
        this.worker = worker;
        this.ready = once<{ type: string; message?: string }>(
            worker,
            (d) => d.type === "ready" || d.type === "load-error",
        ).then((d) => {
            if (d.type === "load-error") throw new Error(`Python failed to load: ${d.message}`);
        });
        // A failed load should be retryable rather than cached forever.
        this.ready.catch(() => this.dispose());
        return this.ready;
    }

    async prepare(src: string): Promise<string | null> {
        this.src = src;
        return null;
    }

    async run(input: string, timeLimitMs: number): Promise<RunOutcome> {
        await this.load();
        const message = { id: this.nextId++, src: this.src, input };
        return timedRun(this.worker!, message, timeLimitMs, () => this.dispose());
    }

    dispose() {
        this.worker?.terminate();
        this.worker = null;
        this.ready = null;
    }
}

export class CppRunner implements Runner {
    private compiler: Worker | null = null;
    private compilerReady: Promise<void> | null = null;
    private progressListeners = new Set<(fraction: number) => void>();
    private program: Uint8Array | null = null;
    private executor: Worker | null = null;
    private executorReady: Promise<void> | null = null;
    private nextId = 0;

    /** Downloads clang and warms it up with an empty program. */
    load(onProgress?: (fraction: number) => void): Promise<void> {
        if (onProgress) this.progressListeners.add(onProgress);
        if (this.compilerReady) return this.compilerReady;
        const worker = new Worker("/cp/cpp-compile-worker.js", { type: "module" });
        this.compiler = worker;
        worker.addEventListener("message", (event: MessageEvent<{ type: string; done: number; total: number }>) => {
            if (event.data.type !== "progress" || !event.data.total) return;
            const fraction = event.data.done / event.data.total;
            this.progressListeners.forEach((listener) => listener(fraction));
        });
        this.compilerReady = this.compile("int main() {}").then((error) => {
            if (error !== null) throw new Error(`The C++ compiler failed to start: ${error}`);
        });
        this.compilerReady.then(
            () => this.progressListeners.clear(),
            () => {
                this.progressListeners.clear();
                this.disposeCompiler();
            },
        );
        return this.compilerReady;
    }

    private async compile(src: string): Promise<string | null> {
        const worker = this.compiler!;
        const id = this.nextId++;
        const reply = once<{ type: string; id: number; bytes?: Uint8Array; message?: string }>(
            worker,
            (d) => (d.type === "compiled" || d.type === "compile-error") && d.id === id,
        );
        worker.postMessage({ id, src });
        const result = await reply;
        if (result.type === "compile-error") return result.message ?? "Compilation failed.";
        this.program = result.bytes!;
        return null;
    }

    async prepare(src: string): Promise<string | null> {
        await this.load();
        const error = await this.compile(src);
        // A new program means the old executor is holding the wrong one.
        this.disposeExecutor();
        return error;
    }

    private startExecutor(): Promise<void> {
        if (this.executorReady) return this.executorReady;
        const worker = new Worker("/cp/cpp-run-worker.js");
        this.executor = worker;
        this.executorReady = once<{ type: string }>(worker, (d) => d.type === "loaded").then(() => {});
        // Not transferred: a killed executor needs the program again.
        worker.postMessage({ type: "load", bytes: this.program });
        return this.executorReady;
    }

    async run(input: string, timeLimitMs: number): Promise<RunOutcome> {
        await this.startExecutor();
        const message = { type: "run", id: this.nextId++, input };
        return timedRun(this.executor!, message, timeLimitMs, () => this.disposeExecutor());
    }

    private disposeExecutor() {
        this.executor?.terminate();
        this.executor = null;
        this.executorReady = null;
    }

    private disposeCompiler() {
        this.compiler?.terminate();
        this.compiler = null;
        this.compilerReady = null;
    }

    dispose() {
        this.disposeExecutor();
        this.disposeCompiler();
    }
}

/** Whitespace-insensitive; "float" allows absolute or relative error. */
export function check(checker: Checker, got: string, want: string): boolean {
    const a = got.trim().split(/\s+/).filter(Boolean);
    const b = want.trim().split(/\s+/).filter(Boolean);
    if (a.length !== b.length) return false;
    return a.every((token, i) => {
        if (checker === "exact") return token === b[i];
        const x = Number(token);
        const y = Number(b[i]);
        return Number.isFinite(x) && Math.abs(x - y) <= FLOAT_TOLERANCE * Math.max(1, Math.abs(y));
    });
}

export type Verdict =
    | { kind: "accepted"; tests: number; maxMs: number }
    | { kind: "compile"; message: string }
    | {
          kind: "wrong" | "runtime" | "timeout";
          test: number;
          input: string;
          expected: string;
          got?: string;
          message?: string;
      };

/**
 * Compiles, then judges in order and stops at the first failure, as
 * Codeforces does. `onProgress` gets the 1-based number of the test about to run.
 */
export async function judge(
    runner: Runner,
    problem: CpProblem,
    tests: CpTest[],
    src: string,
    onProgress: (test: number) => void,
): Promise<Verdict> {
    const compileError = await runner.prepare(src);
    if (compileError !== null) return { kind: "compile", message: compileError };

    let maxMs = 0;
    for (let i = 0; i < tests.length; i++) {
        onProgress(i + 1);
        const input = testInput(tests[i]);
        const expected = tests[i].output;
        const outcome = await runner.run(input, problem.timeLimitMs);
        const failure = { test: i + 1, input, expected };
        if (outcome.kind === "timeout") return { kind: "timeout", ...failure };
        if (outcome.kind === "error") return { kind: "runtime", ...failure, message: outcome.message };
        if (!check(problem.checker, outcome.stdout, expected)) {
            return { kind: "wrong", ...failure, got: outcome.stdout };
        }
        maxMs = Math.max(maxMs, outcome.ms);
    }
    return { kind: "accepted", tests: tests.length, maxMs };
}
