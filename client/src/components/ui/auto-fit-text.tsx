import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type AutoFitTextProps = {
  as?: "div" | "span" | "p" | "h1" | "h2" | "h3" | "h4";
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  minFontSize?: number;
  maxFontSize?: number;
  maxLines?: number;
  precision?: number;
};

export function AutoFitText({
  as = "div",
  children,
  className,
  containerClassName,
  minFontSize = 18,
  maxFontSize = 56,
  maxLines = 1,
  precision = 0.5,
}: AutoFitTextProps) {
  const Tag = as;
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLElement>(null);
  const frameRef = useRef<number | null>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;

    if (!container || !content) {
      return;
    }

    const measure = () => {
      const availableWidth = container.clientWidth;
      if (!availableWidth) {
        return;
      }

      const fits = (size: number) => {
        content.style.fontSize = `${size}px`;
        content.style.whiteSpace = maxLines === 1 ? "nowrap" : "normal";

        const computed = window.getComputedStyle(content);
        const lineHeight = Number.parseFloat(computed.lineHeight) || size * 1.08;
        const maxHeight = lineHeight * maxLines + 1;

        return content.scrollWidth <= availableWidth + 1 && content.scrollHeight <= maxHeight;
      };

      let low = minFontSize;
      let high = maxFontSize;
      let best = minFontSize;

      while (high - low > precision) {
        const mid = (low + high) / 2;

        if (fits(mid)) {
          best = mid;
          low = mid;
        } else {
          high = mid;
        }
      }

      content.style.fontSize = `${best}px`;
      content.style.whiteSpace = maxLines === 1 ? "nowrap" : "normal";
      setFontSize((current) => (Math.abs(current - best) >= precision ? best : current));
    };

    const scheduleMeasure = () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = requestAnimationFrame(measure);
    };

    scheduleMeasure();

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(container);
    window.addEventListener("resize", scheduleMeasure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleMeasure);

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [children, maxFontSize, maxLines, minFontSize, precision]);

  return (
    <div ref={containerRef} className={cn("min-w-0 w-full", containerClassName)}>
      <Tag
        ref={contentRef as never}
        className={cn("min-w-0 w-full", maxLines > 1 && "[text-wrap:balance]", className)}
        style={{ fontSize }}
      >
        {children}
      </Tag>
    </div>
  );
}
