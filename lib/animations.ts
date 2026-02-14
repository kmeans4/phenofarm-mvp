import { Variants } from 'framer-motion';

// Standard scroll-triggered animation variants
export const scrollAnimationConfig = {
  fadeUp: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  },
  
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.5 }
  },
  
  scaleUp: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  },
  
  slideLeft: {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  },
  
  slideRight: {
    initial: { opacity: 0, x: -40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 40 },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  },
} as const;

// Container stagger variants
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  },
};

// Hover variants
export const hoverVariants = {
  lift: {
    scale: 1.02,
    y: -4,
    transition: { duration: 0.2 },
  },
  glow: {
    boxShadow: '0 0 30px rgba(34, 197, 94, 0.3)',
    transition: { duration: 0.2 },
  },
};
