import type { CareerEvent } from "@/types";

// DADOS DEMONSTRATIVOS — eventos fictícios. Datas e locais são apenas exemplos.
export const events: CareerEvent[] = [
  {
    id: "workshop-de-curriculo",
    title: "Workshop de Currículo",
    date: "2026-10-20T19:00:00",
    endTime: "21:00",
    location: "Auditório Unis — São Lourenço",
    mode: "Presencial",
    category: "Workshop",
    summary: "Aprenda a montar um currículo objetivo e alinhado às vagas da região.",
    description:
      "Encontro prático para revisar a estrutura do currículo, destacar experiências acadêmicas e adaptar o documento a cada oportunidade. Traga seu currículo impresso ou no celular.",
  },
  {
    id: "feira-de-estagios-unis",
    title: "Feira de Estágios Unis",
    date: "2026-11-05T14:00:00",
    endTime: "18:00",
    location: "Pátio central — Campus São Lourenço",
    mode: "Presencial",
    category: "Feira",
    summary: "Conheça empresas da região e converse sobre oportunidades de estágio.",
    description:
      "Espaço de encontro entre estudantes e empresas, com estandes, conversas rápidas com recrutadores e orientação do Núcleo de Carreira e Empregabilidade.",
  },
  {
    id: "palestra-mercado-regional",
    title: "Palestra: Mercado Regional",
    date: "2026-11-12T19:30:00",
    endTime: "21:00",
    location: "Transmissão on-line",
    mode: "Online",
    category: "Palestra",
    summary: "Tendências de emprego no Circuito das Águas e áreas em crescimento.",
    description:
      "Conversa sobre os setores que mais contratam na região, como turismo, saúde, comércio e tecnologia, e como se preparar para essas oportunidades.",
  },
  {
    id: "oficina-de-entrevistas",
    title: "Oficina de Entrevistas",
    date: "2026-11-26T19:00:00",
    endTime: "21:30",
    location: "Laboratório 3 — Campus São Lourenço",
    mode: "Presencial",
    category: "Oficina",
    summary: "Simulações de entrevista com dicas de postura e comunicação.",
    description:
      "Oficina com simulações em duplas, dinâmicas de grupo e feedback sobre comunicação, linguagem corporal e respostas a perguntas frequentes.",
  },
];
