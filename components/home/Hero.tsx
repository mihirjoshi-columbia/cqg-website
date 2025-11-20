"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Hero() {
    const text = "Columbia Quant Group";
    const letters = Array.from(text);

    // Math symbols for background
    const mathSymbols = ["∑", "∫", "∂", "π", "∆", "∇", "∞", "≈", "≠", "≤"];
    const [symbolStyles, setSymbolStyles] = useState<Array<{ x: number, y: number, scale: number, rotate: number, duration: number, fontSize: number }>>([]);

    useEffect(() => {
        const styles = mathSymbols.map(() => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            scale: 0.5 + Math.random() * 1.5,
            rotate: Math.random() * 360,
            duration: 10 + Math.random() * 20,
            fontSize: 2 + Math.random() * 4
        }));
        setSymbolStyles(styles);
    }, []);

    const container = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: 0.05, delayChildren: 0.5 },
        }),
    };

    const child = {
        visible: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 100,
            } as any,
        },
        hidden: {
            opacity: 0,
            y: 20,
            filter: "blur(10px)",
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 100,
            } as any,
        },
    };

    return (
        <section className="h-screen flex flex-col items-center justify-center bg-white overflow-hidden relative">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            {/* Floating Math Symbols */}
            {symbolStyles.map((style, i) => (
                <motion.div
                    key={i}
                    className="absolute text-columbia-blue/20 font-serif font-bold select-none pointer-events-none"
                    initial={{
                        x: style.x,
                        y: style.y,
                        scale: style.scale,
                        rotate: style.rotate
                    }}
                    animate={{
                        y: [null, style.y - 100],
                        rotate: [null, style.rotate + 360],
                    }}
                    transition={{
                        duration: style.duration,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                    }}
                    style={{
                        fontSize: `${style.fontSize}rem`,
                    }}
                >
                    {mathSymbols[i]}
                </motion.div>
            ))}

            <motion.div
                className="z-10 flex overflow-hidden relative"
                variants={container}
                initial="hidden"
                animate="visible"
            >
                {letters.map((letter, index) => (
                    <motion.span
                        key={index}
                        variants={child}
                        className="text-4xl md:text-6xl lg:text-8xl font-bold text-columbia-dark tracking-tight"
                    >
                        {letter === " " ? "\u00A0" : letter}
                    </motion.span>
                ))}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2, duration: 0.8 }}
                className="absolute bottom-10 flex flex-col items-center z-10"
            >
                <span className="text-gray-500 text-sm mb-2">Scroll to explore</span>
                <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center p-1">
                    <motion.div
                        animate={{ y: [0, 12, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        className="w-1 h-2 bg-gray-400 rounded-full"
                    />
                </div>
            </motion.div>
        </section>
    );
}
