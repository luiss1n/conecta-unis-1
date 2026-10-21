import type { Company } from "@/types";

// DADOS DEMONSTRATIVOS — empresas fictícias. Não representam parceiros reais da instituição.
export const companies: Company[] = [
  {
    slug: "vale-verde-contabilidade",
    name: "Vale Verde Contabilidade",
    sector: "Serviços contábeis",
    city: "São Lourenço",
    initials: "VV",
    tone: "green",
    summary: "Escritório contábil que atende pequenas e médias empresas do Circuito das Águas.",
    about:
      "A Vale Verde Contabilidade (empresa fictícia) presta serviços de contabilidade, folha de pagamento e consultoria fiscal para negócios locais, com foco em atendimento próximo e processos digitais.",
  },
  {
    slug: "aguas-tech",
    name: "Águas Tech Soluções",
    sector: "Tecnologia e software",
    city: "São Lourenço",
    initials: "AT",
    tone: "blue",
    summary: "Software house que desenvolve sistemas web para comércio e turismo regional.",
    about:
      "A Águas Tech Soluções (empresa fictícia) cria aplicações web e mobile para hotéis, comércios e prestadores de serviço, trabalhando com React, TypeScript e Node.js.",
  },
  {
    slug: "farmacia-bem-estar",
    name: "Farmácia Bem-Estar",
    sector: "Saúde e varejo farmacêutico",
    city: "Caxambu",
    initials: "FB",
    tone: "purple",
    summary: "Rede local de farmácias com atendimento humanizado e manipulação.",
    about:
      "A Farmácia Bem-Estar (empresa fictícia) possui unidades em Caxambu e região, oferecendo medicamentos, manipulação e orientação farmacêutica.",
  },
  {
    slug: "hotel-serra-das-aguas",
    name: "Hotel Serra das Águas",
    sector: "Hotelaria e turismo",
    city: "Caxambu",
    initials: "SA",
    tone: "amber",
    summary: "Hotel de médio porte voltado ao turismo de lazer e eventos.",
    about:
      "O Hotel Serra das Águas (empresa fictícia) recebe turistas e grupos corporativos durante todo o ano, com equipe de recepção, eventos e governança.",
  },
  {
    slug: "souza-advogados",
    name: "Souza & Ribeiro Advogados",
    sector: "Serviços jurídicos",
    city: "São Lourenço",
    initials: "SR",
    tone: "blue",
    summary: "Escritório de advocacia com atuação cível, trabalhista e empresarial.",
    about:
      "O escritório Souza & Ribeiro Advogados (empresa fictícia) atende pessoas físicas e empresas da região, com foco em direito cível, trabalhista e consultoria empresarial.",
  },
  {
    slug: "supermercado-circuito",
    name: "Supermercado Circuito",
    sector: "Comércio varejista",
    city: "Pouso Alto",
    initials: "SC",
    tone: "green",
    summary: "Supermercado de bairro com mais de 15 anos de presença na região.",
    about:
      "O Supermercado Circuito (empresa fictícia) atende famílias de Pouso Alto e cidades vizinhas, oferecendo oportunidades de primeiro emprego e crescimento interno.",
  },
];
