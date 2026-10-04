"use client";

import { useEffect, useRef, useState } from "react";

interface MatchItem {
    key: string;
    name: string;
    type: "exec" | "firm";
    img: string;
    color?: string;
    size?: string;
}

const MATCH_ITEMS: MatchItem[] = [
    { key: "aurora", name: "Aurora Wang", type: "exec", img: "/team/aurora.jpeg" },
    { key: "nicole", name: "Nicole Pi", type: "exec", img: "/team/nicole.jpg" },
    { key: "victor", name: "Victor Robila", type: "exec", img: "/team/victor.jpeg" },
    { key: "mihir", name: "Mihir Joshi", type: "exec", img: "/team/mihir.jpeg" },
    { key: "nikhil", name: "Nikhil Mudumbi", type: "exec", img: "/team/nikhil.jpeg" },
    { key: "ivy", name: "Ivy Hu", type: "exec", img: "/team/ivy.jpg" },
    { key: "jane-street", name: "Jane Street", type: "firm", img: "/logos/jane-street-icon-white.png", color: "#1B459A", size: "48%" },
    { key: "walleye", name: "Walleye", type: "firm", img: "/logos/walleye-icon-white.png", color: "#061E3B", size: "46%" },
    { key: "five-rings", name: "Five Rings", type: "firm", img: "/logos/five-rings-icon-white.png", color: "#455675", size: "46%" },
    { key: "hrt", name: "HRT", type: "firm", img: "/logos/hrt-h-white.png", color: "#FF8200", size: "48%" },
    { key: "drw", name: "DRW", type: "firm", img: "/logos/drw-white.png", color: "#233B57", size: "74%" },
    { key: "sig", name: "SIG", type: "firm", img: "/logos/sig-icon-white.png", color: "#005DB9", size: "54%" },
];

const ITEM_BY_KEY = Object.fromEntries(MATCH_ITEMS.map((i) => [i.key, i]));

interface Tile {
    uid: string;
    key: string;
    matched: boolean;
    flipped: boolean; // true = face up (revealed)
}

function naturalDeck(): Tile[] {
    return MATCH_ITEMS.flatMap((item) => [
        { uid: `${item.key}-a`, key: item.key, matched: false, flipped: false },
        { uid: `${item.key}-b`, key: item.key, matched: false, flipped: false },
    ]);
}

function shuffledDeck(): Tile[] {
    const deck = naturalDeck();
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

type Phase = "preview" | "playing" | "won";

const BEST_TIME_KEY = "cqg-memory-match-best-ms";

const nowMs = () => Date.now();

function formatTime(ms: number): string {
    const tenths = Math.floor(ms / 100);
    const minutes = Math.floor(tenths / 600);
    const seconds = Math.floor(tenths / 10) % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths % 10}`;
}

export default function MemoryMatch() {
    const [deck, setDeck] = useState<Tile[]>(naturalDeck);
    const [phase, setPhase] = useState<Phase>("preview");
    const [picked, setPicked] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [bestMs, setBestMs] = useState<number | null>(null);
    const [newBest, setNewBest] = useState(false);
    const startedAt = useRef(0);
    const matchedPairs = new Set(deck.filter((t) => t.matched).map((t) => t.key)).size;

    useEffect(() => {
        // Deck order must be random per page load, but random content can't be part of the
        // server-rendered HTML (it would mismatch on hydration) — shuffle once, client-side, after mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDeck(shuffledDeck());
    }, []);

    useEffect(() => {
        // Best time lives in this browser only; read after mount so server and client HTML match.
        try {
            const saved = Number(localStorage.getItem(BEST_TIME_KEY));
            // eslint-disable-next-line react-hooks/set-state-in-effect
            if (saved > 0) setBestMs(saved);
        } catch {
            // storage unavailable (private mode etc.) -- the game just won't remember a best
        }
    }, []);

    useEffect(() => {
        if (phase !== "playing") return;
        const id = setInterval(() => setElapsed(nowMs() - startedAt.current), 100);
        return () => clearInterval(id);
    }, [phase]);

    const restart = () => {
        setDeck(shuffledDeck());
        setElapsed(0);
        setNewBest(false);
        setPhase("preview");
        setPicked([]);
        setBusy(false);
    };

    const start = () => {
        if (phase !== "preview") return;
        startedAt.current = nowMs();
        setElapsed(0);
        setPhase("playing");
    };

    const clickTile = (uid: string) => {
        if (phase !== "playing" || busy) return;
        const tile = deck.find((t) => t.uid === uid);
        if (!tile || tile.matched || tile.flipped) return;

        const newPicked = [...picked, uid];
        setDeck((d) => d.map((t) => (t.uid === uid ? { ...t, flipped: true } : t)));

        if (newPicked.length < 2) {
            setPicked(newPicked);
            return;
        }

        const [aUid, bUid] = newPicked;
        const a = deck.find((t) => t.uid === aUid)!;
        setBusy(true);

        if (a.key === tile.key) {
            setDeck((d) => d.map((t) => (t.uid === aUid || t.uid === bUid ? { ...t, matched: true } : t)));
            setPicked([]);
            setBusy(false);
            const newMatchedCount = matchedPairs + 1;
            if (newMatchedCount === MATCH_ITEMS.length) {
                const finalMs = nowMs() - startedAt.current;
                setElapsed(finalMs);
                if (bestMs === null || finalMs < bestMs) {
                    setBestMs(finalMs);
                    setNewBest(true);
                    try {
                        localStorage.setItem(BEST_TIME_KEY, String(finalMs));
                    } catch {
                        // see above
                    }
                }
                setPhase("won");
            }
        } else {
            setTimeout(() => {
                setDeck((d) => d.map((t) => (t.uid === aUid || t.uid === bUid ? { ...t, flipped: false } : t)));
                setPicked([]);
                setBusy(false);
            }, 800);
        }
    };

    let status = "Memorize the board, then start matching.";
    if (phase === "playing") {
        status = matchedPairs > 0 || picked.length > 0 ? `${matchedPairs} of ${MATCH_ITEMS.length} found.` : "Find every pair.";
    } else if (phase === "won") {
        status = `All matched in ${formatTime(elapsed)}! ${newBest ? "New best! " : ""}🎉`;
    }

    return (
        <div>
            <div className="game-bar" style={{ maxWidth: "640px" }}>
                <span className="game-status" aria-live="polite">{status}</span>
                <div className="flex gap-2.5 items-center">
                    <span className="font-mono text-sm tabular-nums text-ink-soft" aria-label="Elapsed time">
                        {formatTime(elapsed)}
                        {bestMs !== null && <span className="text-ink-faint"> · Best {formatTime(bestMs)}</span>}
                    </span>
                    {phase !== "preview" && (
                        <button type="button" className="restart-link" onClick={restart}>
                            ↺ Restart
                        </button>
                    )}
                    <button
                        type="button"
                        className="btn-cqg btn-gray btn-sm"
                        style={{ visibility: phase === "playing" ? "hidden" : "visible" }}
                        onClick={() => (phase === "won" ? restart() : start())}
                    >
                        {phase === "won" ? "Play Again" : "Start Matching"}
                    </button>
                </div>
            </div>

            <div className="match-grid mt-8">
                {deck.map((tile, i) => {
                    const item = ITEM_BY_KEY[tile.key];
                    const showFace = phase === "preview" ? true : tile.flipped;
                    return (
                        <div
                            key={tile.uid}
                            className={`match-tile ${item.type === "firm" ? "is-logo" : ""} ${tile.matched ? "matched" : ""}`}
                            style={
                                {
                                    "--bob-dur": `${6 + (i % 3)}s`,
                                    "--bob-delay": `${(i % 8) * 0.35}s`,
                                    "--bob-rot": `${(i % 2 === 0 ? 1 : -1) * (2 + (i % 3))}deg`,
                                } as React.CSSProperties
                            }
                            onClick={() => clickTile(tile.uid)}
                        >
                            <div className="flip-outer">
                                <div className={`flip-inner ${showFace ? "" : "flipped"}`}>
                                    <div
                                        className="flip-face front"
                                        style={{
                                            backgroundImage: `url('${item.img}')`,
                                            backgroundColor: item.type === "firm" ? item.color : undefined,
                                            backgroundSize: item.type === "firm" ? item.size : undefined,
                                        }}
                                        title={item.name}
                                    />
                                    <div className="flip-face back" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
