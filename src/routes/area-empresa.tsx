import { createFileRoute, redirect } from "@tanstack/react-router";

// A antiga prévia foi removida: quem chega por links antigos vai direto para a publicação
// (que pede login quando necessário).
export const Route = createFileRoute("/area-empresa")({
  beforeLoad: () => {
    throw redirect({ to: "/publicar", replace: true });
  },
});
