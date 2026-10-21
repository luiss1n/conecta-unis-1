import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./Header";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-footer-border bg-footer text-footer-foreground">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[2fr_1fr_1fr_1.2fr]">
        <div className="space-y-3">
          <Logo dark />
          <p className="max-w-sm text-sm text-footer-muted">
            Plataforma de carreiras e empregabilidade da Faculdade Unis São Lourenço, em apoio ao
            Núcleo de Carreira e Empregabilidade.
          </p>
        </div>
        <nav aria-label="Navegação do rodapé">
          <p className="mb-3 text-sm font-semibold">Navegação</p>
          <ul className="space-y-2 text-sm text-footer-muted">
            <li><Link to="/" className="hover:text-footer-accent">Início</Link></li>
            <li><Link to="/vagas" className="hover:text-footer-accent">Vagas</Link></li>
            <li><Link to="/empresas" className="hover:text-footer-accent">Empresas</Link></li>
            <li><Link to="/eventos" className="hover:text-footer-accent">Eventos</Link></li>
            <li><Link to="/sobre" className="hover:text-footer-accent">Sobre nós</Link></li>
          </ul>
        </nav>
        <nav aria-label="Institucional">
          <p className="mb-3 text-sm font-semibold">Institucional</p>
          <ul className="space-y-2 text-sm text-footer-muted">
            <li><Link to="/area-empresa" className="hover:text-footer-accent">Área para empresas</Link></li>
            <li><Link to="/privacidade" className="hover:text-footer-accent">Política de privacidade</Link></li>
            <li><Link to="/auth" className="hover:text-footer-accent">Criar conta</Link></li>
          </ul>
        </nav>
        <div>
          <p className="mb-3 text-sm font-semibold">Contato</p>
          <ul className="space-y-2 text-sm text-footer-muted">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Faculdade Unis São Lourenço — São Lourenço, MG</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" />
              <a href="mailto:carreiras@unis.edu.br" className="hover:text-footer-accent">carreiras@unis.edu.br</a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              <a href="tel:+553533301000" className="hover:text-footer-accent">(35) 3330-1000</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-footer-border">
        <div className="container-page flex flex-col gap-2 py-4 text-xs text-footer-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Faculdade Unis São Lourenço — Conecta Unis. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Link to="/privacidade" className="hover:text-footer-accent">Privacidade</Link>
            <Link to="/sobre" className="hover:text-footer-accent">Sobre</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
