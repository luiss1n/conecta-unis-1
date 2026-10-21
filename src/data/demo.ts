import type { CandidateProfile } from "@/types";

// DADOS DEMONSTRATIVOS — perfil fictício. A autenticação real será integrada futuramente.
export const demoCandidate: CandidateProfile = {
  name: "Mariana Alves",
  course: "Sistemas de Informação",
  period: "5º período",
  skills: ["React", "TypeScript", "HTML e CSS", "Git", "Comunicação"],
};

// Indicadores ilustrativos — NÃO são estatísticas oficiais da instituição.
export const demoStats = [
  { label: "Alunos cadastrados", value: "1.240" },
  { label: "Vagas disponíveis", value: "86" },
  { label: "Empresas parceiras", value: "32" },
  { label: "Oportunidades gratuitas", value: "18" },
];

export const demoNotifications = [
  { id: "n1", title: "Nova vaga em Tecnologia", body: "Estágio em Desenvolvimento Front-End foi publicada.", to: "/vagas" },
  { id: "n2", title: "Evento próximo", body: "Workshop de Currículo acontece em 20/10.", to: "/eventos" },
  { id: "n3", title: "Perfil", body: "Complete seu perfil para melhorar a simulação de compatibilidade.", to: "/perfil" },
] as const;
