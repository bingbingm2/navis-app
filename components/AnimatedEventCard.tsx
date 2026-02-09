"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import React from "react";

interface AnimatedEventCardProps {
  children: React.ReactNode;
  delay?: number;
}

export default function AnimatedEventCard({ children, delay = 0 }: AnimatedEventCardProps) {
  const { elementRef, isVisible } = useScrollAnimation();

  return (
    <div
      ref={elementRef}
      className={`transition-all duration-500 ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-8 scale-95"
      }`}
      style={{
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
