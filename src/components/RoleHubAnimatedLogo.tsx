"use client";

import { motion, useReducedMotion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function RoleHubAnimatedLogo({ className }: { className?: string }) {
  const [isMounted, setIsMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const text = "RoleHub";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.5,
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", damping: 12, stiffness: 100 },
    },
  };

  const zapPathVariants = {
    hidden: { pathLength: 0, fill: "rgba(0, 255, 163, 0)" },
    visible: {
      pathLength: 1,
      fill: "rgba(0, 255, 163, 1)",
      transition: {
        pathLength: { type: "spring", duration: 1.5, bounce: 0, delay: 0.8 },
        fill: { duration: 0.5, delay: 1.2 },
      },
    },
  };

  const glowVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay: 1,
        duration: 0.5
      }
    }
  }

  // Durante SSR e primeira renderização, mostra versão estática simples
  if (!isMounted || shouldReduceMotion) {
    return (
      <div className={className}>
        <svg viewBox="0 0 240 70" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <text
            x="50%"
            y="50%"
            dy=".3em"
            fontFamily="Poppins, sans-serif"
            fontWeight="bold"
            fontSize="40"
            fill="hsl(var(--foreground))"
            textAnchor="middle"
          >
            RoleHub
          </text>
          <path
            d="M33.36 3.75L21.21 21.26H31.1L20.36 43.77L42.66 21.26H32.77L44.92 3.75H33.36Z"
            transform="translate(190, 5) scale(0.7) rotate(15)"
            fill="hsl(var(--primary))"
          />
        </svg>
      </div>
    )
  }

  return (
    <div className={className}>
      <motion.svg
        viewBox="0 0 240 70"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        aria-label="RoleHub Logo"
      >
        <defs>
          <motion.filter
            id="zap-glow"
            x="-50%" y="-50%" width="200%" height="200%"
            variants={glowVariants}
          >
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </motion.filter>
        </defs>

        <g>
          <motion.path
            d="M33.36 3.75L21.21 21.26H31.1L20.36 43.77L42.66 21.26H32.77L44.92 3.75H33.36Z"
            transform="translate(190, 5) scale(0.7) rotate(15)"
            variants={zapPathVariants}
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#zap-glow)"
          />

          <motion.text
            x="50%"
            y="50%"
            dy=".3em"
            fontFamily="Poppins, sans-serif"
            fontWeight="bold"
            fontSize="40"
            fill="hsl(var(--foreground))"
            textAnchor="middle"
            variants={containerVariants}
          >
            {text.split("").map((letter, index) => (
              <motion.tspan
                key={index}
                variants={letterVariants}
              >
                {letter}
              </motion.tspan>
            ))}
          </motion.text>
        </g>
      </motion.svg>
    </div>
  );
}
