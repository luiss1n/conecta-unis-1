import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { useRouter } from "@tanstack/react-router";

/**
 * SmoothScroll: rolagem suave global com Lenis.
 *
 * - lerp 0.1: sensação moderna e natural.
 * - Âncoras internas (#secao) rolam suavemente via lenis.scrollTo.
 * - Touch nativo preservado (sem input lag em mobile).
 * - prefers-reduced-motion: Lenis não é ativado.
 * - Cleanup completo do rAF e da instância no unmount.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      // Touch segue o comportamento nativo do dispositivo (sem lag)
      syncTouch: false,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Âncoras internas: rola suavemente até a seção de destino
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

    // Troca de rota: volta ao topo suavemente
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
