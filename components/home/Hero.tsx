```
"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Hero() {
  const text = "Columbia Quant Group";
  const letters = Array.from(text);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
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

  // Math symbols for background
  const mathSymbols = ["∑", "∫", "∂", "π", "∆", "∇", "∞", "≈", "≠", "≤"];

  return (
    <section className="h-screen flex flex-col items-center justify-center bg-white overflow-hidden relative">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Floating Math Symbols */}
      {mathSymbols.map((symbol, i) => (
        <motion.div
          key={i}
          className="absolute text-columbia-blue/20 font-serif font-bold select-none pointer-events-none"
          initial={{ 
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            scale: 0.5 + Math.random() * 1.5,
            rotate: Math.random() * 360
          }}
          animate={{ 
            y: [null, Math.random() * -100],
            rotate: [null, Math.random() * 360],
          }}
          transition={{ 
            duration: 10 + Math.random() * 20, 
            repeat: Infinity, 
            repeatType: "reverse",
            ease: "easeInOut"
          }}
          style={{
            fontSize: `${ 2 + Math.random() * 4 } rem`,
          }}
        >
          {symbol}
        </motion.div>
      ))}

      {/* Interactive Gradient Blob */}
      <motion.div
        className="absolute bg-columbia-blue/30 rounded-full blur-3xl pointer-events-none"
        animate={{
          x: mousePosition.x - 200,
          y: mousePosition.y - 200,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 200 }}
        style={{ width: 400, height: 400, zIndex: 0 }}
      />

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
```
