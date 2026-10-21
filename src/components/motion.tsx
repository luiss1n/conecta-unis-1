import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/*  <FadeUp>: conteúdo aparece de baixo para cima ao entrar na tela            */
/*  - inicial: opacity 0, y 30px                                               */
/*  - ao entrar no viewport: opacity 1, y 0 (dispara uma vez só)               */
/*  - duração 0.6s com easeOut                                                 */
/*  - prefers-reduced-motion: apenas fade simples, sem deslocamento            */
/* -------------------------------------------------------------------------- */
export function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  /** atraso em segundos */
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  <Stagger> + <StaggerItem>: cards surgem em cascata (0.1s entre itens)      */
/* -------------------------------------------------------------------------- */
const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}
