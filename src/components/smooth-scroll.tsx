import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { useRouter } from "@tanstack/react-router";


export function SmoothScroll({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest?.(
        'a[href^="#"]',
      ) as HTMLAnchorElement | null;
      if (!anchor) return;
      const hash = anchor.getAttribute("href");
      if (!hash || hash === "#") return;
      const target = document.querySelector(hash);
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -80 });
    };
    document.addEventListener("click", onClick);
    const unsubscribe = router.subscribe("onResolved", () => {
      lenis.scrollTo(0, { immediate: true });
    });

    return () => {
      document.removeEventListener("click", onClick);
      unsubscribe();
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [router]);

  return <>{children}</>;
}
