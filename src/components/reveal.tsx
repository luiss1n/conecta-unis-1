import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

/* -------------------------------------------------------------------------- */
/*  useInView: detecta quando o elemento entra na tela (IntersectionObserver)  */
/* -------------------------------------------------------------------------- */
export function useInView<T extends Element = HTMLElement>({
  threshold = 0.15,
  rootMargin = "0px 0px -8% 0px",
  once = true,
}: { threshold?: number; rootMargin?: string; once?: boolean } = {}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Navegadores sem suporte: mostra tudo de uma vez
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, inView };
}

/* -------------------------------------------------------------------------- */
/*  <Reveal>: faz o conteúdo aparecer suavemente ao rolar a página             */
/* -------------------------------------------------------------------------- */
export type RevealVariant = "up" | "down" | "left" | "right" | "scale" | "fade";

type RevealProps = {
  children: ReactNode;
  variant?: RevealVariant;
  /** atraso em ms (use para escalonar itens de uma lista) */
  delay?: number;
  /** duração em ms */
  duration?: number;
  /** tag HTML a renderizar (div, section, li, h2...) */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  once?: boolean;
};

export function Reveal({
  children,
  variant = "up",
  delay = 0,
  duration,
  as,
  className = "",
  style,
  once = true,
}: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const { ref, inView } = useInView<HTMLElement>({ once });

  return (
    <Tag
      ref={ref}
      data-reveal={variant}
      data-visible={inView}
      className={`reveal ${className}`}
      style={
        {
          "--reveal-delay": `${delay}ms`,
          ...(duration ? { "--reveal-duration": `${duration}ms` } : {}),
          ...style,
        } as CSSProperties
      }
    >
      {children}
    </Tag>
  );
}

/* -------------------------------------------------------------------------- */
/*  <RevealList>: aplica atraso progressivo (stagger) em cada filho            */
/* -------------------------------------------------------------------------- */
export function RevealList({
  items,
  render,
  step = 80,
  maxDelay = 480,
  variant = "up",
}: {
  items: unknown[];
  render: (item: any, index: number) => ReactNode;
  step?: number;
  maxDelay?: number;
  variant?: RevealVariant;
}) {
  return (
    <>
      {items.map((item, i) => (
        <Reveal key={i} variant={variant} delay={Math.min(i * step, maxDelay)}>
          {render(item, i)}
        </Reveal>
      ))}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  <CountUp>: número que "sobe" até o valor final (ótimo p/ estatísticas)     */
/* -------------------------------------------------------------------------- */
export function CountUp({
  to,
  duration = 1600,
  locale = "pt-BR",
  prefix = "",
  suffix = "",
  className,
}: {
  to: number;
  duration?: number;
  locale?: string;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>({ threshold: 0.4 });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(to);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(to * easeOutCubic(progress)));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toLocaleString(locale)}
      {suffix}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  <ScrollProgress>: barra fina no topo mostrando o quanto da página rolou    */
/* -------------------------------------------------------------------------- */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${pct / 100})`;
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="scroll-progress" aria-hidden="true">
      <div ref={barRef} className="scroll-progress__bar" />
    </div>
  );
}
