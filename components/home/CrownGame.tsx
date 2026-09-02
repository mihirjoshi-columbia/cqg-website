"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

type CardId = "spade-A" | "heart-Q" | "club-10" | "diamond-K" | "club-J" | "crown";

interface CardMeta {
  id: CardId;
  suit?: "spade" | "heart" | "diamond" | "club";
  rank?: string;
  cls: string;
  isCrown?: boolean;
}

const CARDS: CardMeta[] = [
  { id: "spade-A", suit: "spade", rank: "A", cls: "spade" },
  { id: "heart-Q", suit: "heart", rank: "Q", cls: "heart" },
  { id: "club-10", suit: "club", rank: "10", cls: "club" },
  { id: "diamond-K", suit: "diamond", rank: "K", cls: "diamond" },
  { id: "club-J", suit: "club", rank: "J", cls: "club" },
  { id: "crown", cls: "crown-card", isCrown: true },
];

const SUIT_GLYPH: Record<string, string> = {
  spade: "♠",
  heart: "♥",
  diamond: "♦",
  club: "♣",
};

const CARD_POS = [
  { top: "4%", left: "6%", rot: -6 },
  { top: "0%", left: "42%", rot: 4 },
  { top: "32%", left: "24%", rot: -3 },
  { top: "28%", left: "62%", rot: 5 },
  { top: "58%", left: "4%", rot: 3 },
  { top: "60%", left: "46%", rot: -4 },
];

type Phase = "preview" | "shuffling" | "guessing" | "won";

interface CardState {
  slot: number;
  flipped: boolean;
  revealed: boolean;
  winner: boolean;
}

function initialCardStates(): Record<CardId, CardState> {
  const state = {} as Record<CardId, CardState>;
  CARDS.forEach((c, i) => {
    state[c.id] = { slot: i, flipped: false, revealed: false, winner: false };
  });
  return state;
}

function shuffledSlots(): number[] {
  const slots = [0, 1, 2, 3, 4, 5];
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  return slots;
}

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.5 17.5L2 8l5.5 4L12 5l4.5 7L22 8l-1.5 9.5H3.5z" fill="currentColor" />
      <rect x="3.2" y="17.5" width="17.6" height="2.3" rx="0.5" fill="currentColor" />
    </svg>
  );
}

export default function CrownGame() {
  const [phase, setPhase] = useState<Phase>("preview");
  const [cards, setCards] = useState<Record<CardId, CardState>>(initialCardStates);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    return () => {
      timeouts.current.forEach(clearTimeout);
    };
  }, []);

  const reset = useCallback(() => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    setPhase("preview");
    setCards(initialCardStates());
  }, []);

  const play = useCallback(() => {
    if (phase !== "preview") return;
    setPhase("shuffling");
    setCards((prev) => {
      const next = { ...prev };
      (Object.keys(next) as CardId[]).forEach((id) => {
        next[id] = { ...next[id], flipped: true };
      });
      return next;
    });

    const rounds = reducedMotion ? 1 : 5;
    const roundDelay = reducedMotion ? 0 : 430;

    const runRound = (round: number) => {
      const slots = shuffledSlots();
      setCards((prev) => {
        const next = { ...prev };
        CARDS.forEach((c, i) => {
          next[c.id] = { ...next[c.id], slot: slots[i] };
        });
        return next;
      });
      if (round < rounds) {
        timeouts.current.push(setTimeout(() => runRound(round + 1), roundDelay));
      } else {
        timeouts.current.push(
          setTimeout(() => {
            setPhase("guessing");
          }, roundDelay)
        );
      }
    };

    timeouts.current.push(setTimeout(() => runRound(1), 520));
  }, [phase, reducedMotion]);

  const guess = useCallback(
    (id: CardId) => {
      if (phase !== "guessing") return;
      setCards((prev) => {
        const card = prev[id];
        if (card.revealed) return prev;
        const next = { ...prev, [id]: { ...card, flipped: false } };
        if (id === "crown") {
          next[id] = { ...next[id], winner: true };
          setPhase("won");
        } else {
          next[id] = { ...next[id], revealed: true };
        }
        return next;
      });
    },
    [phase]
  );

  const revealedCount = CARDS.filter((c) => !c.isCrown && cards[c.id].revealed).length;
  const remainingCount = CARDS.filter((c) => !c.isCrown && !cards[c.id].revealed).length;

  let status = "Spot the crown, then shuffle.";
  if (phase === "shuffling") status = "Shuffling…";
  else if (phase === "guessing") {
    status = revealedCount > 0 ? `Not this one — ${remainingCount} left. Try again.` : "Pick a card.";
  } else if (phase === "won") status = "Found it! 👑";

  return (
    <div>
      <div className="game-bar">
        <span className="game-status game-status-dark" aria-live="polite">{status}</span>
        <button
          type="button"
          className="btn-cqg btn-gray btn-sm"
          style={{ visibility: phase === "guessing" || phase === "shuffling" ? "hidden" : "visible" }}
          disabled={phase === "shuffling"}
          onClick={() => (phase === "won" ? reset() : play())}
        >
          {phase === "won" ? "Play Again" : "Shuffle & Play"}
        </button>
      </div>
      <div className="relative" style={{ height: "min(420px, 68vw)" }}>
        {CARDS.map((card, idx) => {
          const state = cards[card.id];
          const pos = CARD_POS[state.slot];
          const guessable = phase === "guessing" && !state.revealed;
          return (
            <div
              key={card.id}
              className={[
                "card-float",
                reducedMotion || phase === "shuffling" ? "no-float" : "",
                guessable ? "guessable" : "",
                state.revealed ? "revealed" : "",
                state.winner ? "winner" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={
                {
                  top: pos.top,
                  left: pos.left,
                  "--bob-dur": `${6 + (idx % 3)}s`,
                  "--bob-delay": `${idx * 0.4}s`,
                  "--bob-rot": `${pos.rot}deg`,
                } as React.CSSProperties
              }
              onClick={() => guess(card.id)}
            >
              <div className="flip-outer">
                <div className={`flip-inner ${state.flipped ? "flipped" : ""}`}>
                  <div className={`flip-face front suit-card ${card.cls}`}>
                    {card.isCrown ? (
                      <CrownIcon className="crown-icon" />
                    ) : (
                      <>
                        <span className="pip">{card.rank}</span>
                        <span className="glyph">{SUIT_GLYPH[card.suit!]}</span>
                        <span className="pip" style={{ alignSelf: "flex-end", transform: "rotate(180deg)" }}>
                          {card.rank}
                        </span>
                      </>
                    )}
                  </div>
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
