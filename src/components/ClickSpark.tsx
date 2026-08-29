import { useEffect, useRef, type ReactNode } from "react";

type SparkEasing = "linear" | "ease-in" | "ease-out" | "ease-in-out";

interface ClickSparkProps {
  children: ReactNode;
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  easing?: SparkEasing;
  extraScale?: number;
}

interface SparkParticle {
  x: number;
  y: number;
  angle: number;
  startTime: number;
}

const applyEasing = (progress: number, easing: SparkEasing) => {
  switch (easing) {
    case "linear": return progress;
    case "ease-in": return progress * progress;
    case "ease-in-out": return progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
    default: return progress * (2 - progress);
  }
};

export function ClickSpark({
  children,
  sparkColor = "#18b981",
  sparkSize = 9,
  sparkRadius = 18,
  sparkCount = 8,
  duration = 420,
  easing = "ease-out",
  extraScale = 1,
}: ClickSparkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const particles: SparkParticle[] = [];
    let animationFrame: number | null = null;
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      canvas.width = Math.round(viewportWidth * pixelRatio);
      canvas.height = Math.round(viewportHeight * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const draw = (timestamp: number) => {
      context.clearRect(0, 0, viewportWidth, viewportHeight);

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        const elapsed = timestamp - particle.startTime;
        if (elapsed >= duration) {
          particles.splice(index, 1);
          continue;
        }

        const eased = applyEasing(elapsed / duration, easing);
        const distance = eased * sparkRadius * extraScale;
        const lineLength = sparkSize * (1 - eased);
        const cosine = Math.cos(particle.angle);
        const sine = Math.sin(particle.angle);

        context.strokeStyle = sparkColor;
        context.lineWidth = 2;
        context.lineCap = "round";
        context.globalAlpha = 1 - eased;
        context.beginPath();
        context.moveTo(particle.x + distance * cosine, particle.y + distance * sine);
        context.lineTo(particle.x + (distance + lineLength) * cosine, particle.y + (distance + lineLength) * sine);
        context.stroke();
      }

      context.globalAlpha = 1;
      if (particles.length > 0) animationFrame = window.requestAnimationFrame(draw);
      else animationFrame = null;
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0 || reducedMotion.matches) return;

      const now = performance.now();
      const totalParticles = Math.max(1, Math.round(sparkCount));
      for (let index = 0; index < totalParticles; index += 1) {
        particles.push({
          x: event.clientX,
          y: event.clientY,
          angle: (2 * Math.PI * index) / totalParticles,
          startTime: now,
        });
      }

      if (animationFrame === null) animationFrame = window.requestAnimationFrame(draw);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("pointerdown", handlePointerDown);
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
    };
  }, [duration, easing, extraScale, sparkColor, sparkCount, sparkRadius, sparkSize]);

  return (
    <>
      {children}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="no-print pointer-events-none fixed inset-0 z-[100] h-screen w-screen select-none"
      />
    </>
  );
}
