import { useCallback, useState } from "react";
import type { Company } from "@/types";
import { initialsOf } from "@/lib/jobs";
import { cn } from "@/lib/utils";

const tones: Record<Company["tone"], string> = {
  blue: "bg-primary-soft text-primary",
  purple: "bg-brand-purple-soft text-brand-purple",
  green: "bg-success-soft text-success",
  amber: "bg-warning-soft text-warning",
};

interface Props {
  company?: Company | undefined;
  label?: string | undefined;
  /** Imagem (logo/foto) da vaga ou da empresa. Sem ela, aparecem as iniciais. */
  imageUrl?: string | undefined;
  size?: "md" | "lg";
}

export function CompanyAvatar({ company, label, imageUrl, size = "md" }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const showImage = !!imageUrl && !failed;
  // Com renderização no servidor, a imagem pode terminar de carregar antes do React assumir a página;
  // nesse caso o onLoad nunca dispara e ela ficaria invisível. Aqui conferimos se já está pronta.
  const imgRef = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-lg font-display font-bold",
        size === "lg" ? "h-16 w-16 text-xl" : "h-11 w-11 text-sm",
        tones[company?.tone ?? "blue"],
      )}
    >
      {/* As iniciais ficam por baixo: a imagem entra com fade quando termina de carregar (sem pulo de layout). */}
      {company?.initials ?? (label ? initialsOf(label) : "?")}
      {showImage && (
        <img
          ref={imgRef}
          src={imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            "absolute inset-0 h-full w-full bg-white object-cover transition-opacity duration-300 motion-reduce:transition-none",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </span>
  );
}
