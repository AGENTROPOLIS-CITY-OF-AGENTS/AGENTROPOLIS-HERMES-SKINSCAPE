"use client";

import {
  motion, useMotionValue, useReducedMotion, useScroll, useSpring,
  useTransform, type MotionValue,
} from "motion/react";
import { useEffect, useRef } from "react";

export type StackSpreadCard = {
  src: string;
  alt?: string;
  stack?: { x: number; y: number; rotate?: number };
  target: { x: number; y: number; rotate?: number; scale?: number; w: number; h: number };
  z?: number;
};

export type StackSpreadProps = {
  cards: StackSpreadCard[];
  title: string;
  subtitle?: string;
  scrollLength?: number;
  shell?: "world" | "region" | "district" | "building" | "office";
};

const START = 0.12;
const END = 0.9;

function usePointer(enabled: boolean) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const x = useSpring(rx, { stiffness: 90, damping: 22, mass: 0.6 });
  const y = useSpring(ry, { stiffness: 90, damping: 22, mass: 0.6 });
  useEffect(() => {
    if (!enabled) return;
    const move = (e: PointerEvent) => {
      rx.set((e.clientX / innerWidth) * 2 - 1);
      ry.set((e.clientY / innerHeight) * 2 - 1);
    };
    addEventListener("pointermove", move, { passive: true });
    return () => removeEventListener("pointermove", move);
  }, [enabled, rx, ry]);
  return { x, y };
}

function Card({ card, progress, pointer, depth, reduce }: {
  card: StackSpreadCard;
  progress: MotionValue<number>;
  pointer: { x: MotionValue<number>; y: MotionValue<number> };
  depth: number;
  reduce: boolean;
}) {
  const stack = card.stack ?? { x: 0, y: 0, rotate: 0 };
  const end = card.target;
  const translate = useTransform([progress, pointer.x, pointer.y], ([p, px, py]) => {
    const x = stack.x + (end.x - stack.x) * p - px * depth * 2.6 * p;
    const y = stack.y + (end.y - stack.y) * p - py * depth * 2.2 * p;
    return `calc(-50% + ${x}vw) calc(-50% + ${y}vh)`;
  });
  const rotate = useTransform(progress, [0, 1], [reduce ? 0 : stack.rotate ?? 0, reduce ? 0 : end.rotate ?? 0]);
  const scale = useTransform(progress, [0, 1], [0.82, end.scale ?? 1]);
  return <motion.figure className="agt-stack-card" style={{
    width: `${end.w}vw`, height: `${end.h}vh`, zIndex: card.z ?? 1,
    translate, rotate, scale,
  }}><img src={card.src} alt={card.alt ?? ""} draggable={false} loading="lazy" /></motion.figure>;
}

export default function StackSpread({
  cards, title, subtitle, scrollLength = 350, shell = "district",
}: StackSpreadProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion() === true;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const progress = useTransform(scrollYProgress, [0, START, END, 1], [0, 0, 1, 1]);
  const pointer = usePointer(!reduce);
  const copyOpacity = useTransform(progress, [0.3, 0.65], [0, 1]);
  return (
    <section ref={ref} data-agt-shell={shell} className="agt-stack-spread"
      style={{ height: `${scrollLength}vh` }}>
      <div className="agt-stack-sticky">
        <motion.div className="agt-stack-copy" style={{ opacity: copyOpacity }}>
          <p className="agt-eyebrow">AGENTROPOLIS / {shell.toUpperCase()}</p>
          <h2>{title}</h2>{subtitle && <p>{subtitle}</p>}
        </motion.div>
        <div className="agt-stack-stage">
          {cards.map((card, i) => <Card key={i} card={card} progress={progress}
            pointer={pointer} reduce={reduce} depth={0.55 + (i / Math.max(cards.length - 1, 1)) * 0.75} />)}
        </div>
      </div>
    </section>
  );
}
