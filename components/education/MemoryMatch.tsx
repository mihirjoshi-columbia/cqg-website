"use client";

import { useEffect, useState } from "react";

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

export default function MemoryMatch() {
    const [deck, setDeck] = useState<Tile[]>(naturalDeck);
    const [phase, setPhase] = useState<Phase>("preview");
    const [picked, setPicked] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);
    const matchedPairs = new Set(deck.filter((t) => t.matched).map((t) => t.key)).size;

    useEffect(() => {
        // Deck order must be random per page load, but random content can't be part of the
        // server-rendered HTML (it would mismatch on hydration) — shuffle once, client-side, after mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDeck(shuffledDeck());
    }, []);

    const restart = () => {
        setDeck(shuffledDeck());
        setPhase("preview");
        setPicked([]);
        setBusy(false);
    };

    const start = () => {
        if (phase !== "preview") return;
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
        status = "All matched! 🎉";
    }

    return (
        <div>
            <div className="game-bar" style={{ maxWidth: "640px" }}>
                <span className="game-status" aria-live="polite">{status}</span>
                <div className="flex gap-2.5 items-center">
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
