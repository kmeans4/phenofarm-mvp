# PhenoFarm MVP Landing Page — Design Specification

**Version:** 1.0  
**Created:** Feb 14, 2026  
**Author:** Design System Architecture  
**Status:** Ready for Implementation

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Design System](#2-design-system)
3. [Landing Page Sections](#3-landing-page-sections)
4. [Interactions & Animations](#4-interactions--animations)
5. [Technical Requirements](#5-technical-requirements)
6. [Component Architecture](#6-component-architecture)
7. [Performance Guidelines](#7-performance-guidelines)
8. [Implementation Roadmap](#8-implementation-roadmap)

---

## 1. Design Philosophy

### Vision
Create a **premium, state-of-the-art B2B cannabis marketplace landing page** that rivals Linear, Vercel, and Stripe in design quality. The design should feel custom-built, not templated, with purposeful animations and micro-interactions that delight users while maintaining professional credibility.

### Core Principles

| Principle | Application |
|-----------|-------------|
| **Elevated Minimalism** | Clean layouts with purposeful whitespace, not sparse |
| **Motion with Meaning** | Animations guide attention, not distract |
| **Premium Feel** | Subtle gradients, glass effects, refined shadows |
| **Trust First** | Professional aesthetics for B2B credibility |
| **Performance** | Smooth 60fps animations, fast initial load |

### Design Inspiration Analysis

**Linear.app:**
- Dark/light theme with sophisticated gradients
- Animated UI mockups in hero
- Smooth scroll-triggered reveals
- Technical but approachable

**Vercel.com:**
- Clean typography hierarchy
- Gradient backgrounds with mesh effects
- Card-based content with hover states
- Product-focused messaging

**Stripe.com:**
- Big statistics with social proof
- Customer stories integration
- Gradient accent colors
- Trust-building through data

---

## 2. Design System

### 2.1 Color Palette

#### Primary Colors (Elevated Green)

```css
/* Core Brand Colors */
--green-50:    #f0fdf4;   /* Lightest tint */
--green-100:   #dcfce7;   /* Subtle backgrounds */
--green-200:   #bbf7d0;   /* Card backgrounds */
--green-300:   #86efac;   /* Accent borders */
--green-400:   #4ade80;   /* Interactive elements */
--green-500:   #22c55e;   /* Primary brand */
--green-600:   #16a34a;   /* Primary action */
--green-700:   #15803d;   /* Hover states */
--green-800:   #166534;   /* Pressed states */
--green-900:   #14532d;   /* Dark accents */
--green-950:   #052e16;   /* Darkest (hero bg elements) */
```

#### Secondary Colors

```css
/* Cannabis/Earth Tones */
--emerald-400:   #34d399;   /* Accent gradients */
--emerald-500:   #10b981;   /* Secondary accent */
--teal-400:      #2dd4bf;   /* Gradient endpoint */
--teal-500:      #14b8a6;   /* Tertiary accent */

/* Premium Gold Accent (for pricing/highlights) */
--amber-400:     #fbbf24;   /* Gold highlight */
--amber-500:     #f59e0b;   /* Premium badge */
```

#### Neutral Colors (Dark Mode Ready)

```css
/* True Neutrals */
--gray-50:      #fafafa;   /* Light bg alt */
--gray-100:     #f4f4f5;   /* Section bg */
--gray-200:     #e4e4e7;   /* Borders */
--gray-300:     #d4d4d8;   /* Muted text */
--gray-400:     #a1a1aa;   /* Placeholder */
--gray-500:     #71717a;   /* Secondary text */
--gray-600:     #52525b;   /* Body text */
--gray-700:     #3f3f46;   /* Primary text */
--gray-800:     #27272a;   /* Headings */
--gray-900:     #18181b;   /* Dark sections */
--gray-950:     #09090b;   /* Darkest */
```

#### Semantic Colors

```css
/* Status Colors */
--success:      #22c55e;   /* Green-500 */
--warning:      #f59e0b;   /* Amber-500 */
--error:        #ef4444;   /* Red-500 */
--info:         #3b82f6;   /* Blue-500 */
```

#### Gradient Presets

```css
/* Hero Background Gradient */
--gradient-hero: linear-gradient(
  135deg,
  #052e16 0%,
  #14532d 25%,
  #166534 50%,
  #15803d 75%,
  #16a34a 100%
);

/* Accent Gradient (CTAs, Highlights) */
--gradient-accent: linear-gradient(
  135deg,
  #16a34a 0%,
  #22c55e 50%,
  #4ade80 100%
);

/* Mesh Gradient (Hero Background Effect) */
--gradient-mesh: 
  radial-gradient(at 40% 20%, rgba(34, 197, 94, 0.3) 0px, transparent 50%),
  radial-gradient(at 80% 0%, rgba(16, 185, 129, 0.2) 0px, transparent 50%),
  radial-gradient(at 0% 50%, rgba(20, 184, 166, 0.2) 0px, transparent 50%),
  radial-gradient(at 80% 50%, rgba(34, 197, 94, 0.15) 0px, transparent 50%),
  radial-gradient(at 0% 100%, rgba(16, 185, 129, 0.2) 0px, transparent 50%);

/* Glass Gradient */
--gradient-glass: linear-gradient(
  135deg,
  rgba(255, 255, 255, 0.1) 0%,
  rgba(255, 255, 255, 0.05) 100%
);
```

### 2.2 Typography

#### Font Stack

```css
/* Primary Font - Clean UI font */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             'Helvetica Neue', Arial, sans-serif;

/* Display Font - Bold headlines */
--font-display: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Monospace - Code/Data */
--font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace;
```

#### Type Scale

```css
/* Heading Scale */
--text-xs:      0.75rem;     /* 12px */
--text-sm:      0.875rem;    /* 14px */
--text-base:    1rem;        /* 16px */
--text-lg:      1.125rem;    /* 18px */
--text-xl:      1.25rem;     /* 20px */
--text-2xl:     1.5rem;      /* 24px */
--text-3xl:     1.875rem;    /* 30px */
--text-4xl:     2.25rem;     /* 36px */
--text-5xl:     3rem;        /* 48px */
--text-6xl:     3.75rem;     /* 60px */
--text-7xl:     4.5rem;      /* 72px */
--text-8xl:     6rem;        /* 96px */
```

#### Typography Hierarchy

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| **Hero Title** | 72px / 4.5rem | 800 | 1.1 | -0.02em |
| **Hero Subtitle** | 20px / 1.25rem | 400 | 1.6 | 0 |
| **Section Title** | 48px / 3rem | 700 | 1.2 | -0.01em |
| **Section Subtitle** | 18px / 1.125rem | 400 | 1.6 | 0 |
| **Card Title** | 24px / 1.5rem | 600 | 1.3 | 0 |
| **Card Description** | 16px / 1rem | 400 | 1.6 | 0 |
| **Feature Title** | 20px / 1.25rem | 600 | 1.4 | 0 |
| **Feature Description** | 14px / 0.875rem | 400 | 1.6 | 0 |
| **Button Large** | 16px / 1rem | 600 | 1 | 0.01em |
| **Button Small** | 14px / 0.875rem | 500 | 1 | 0.01em |
| **Body Text** | 16px / 1rem | 400 | 1.7 | 0 |
| **Small Text** | 14px / 0.875rem | 400 | 1.6 | 0 |
| **Caption** | 12px / 0.75rem | 500 | 1.5 | 0.02em |

### 2.3 Spacing System

```css
/* Spacing Scale - 4px base unit */
--space-0:    0;
--space-1:    0.25rem;    /* 4px */
--space-2:    0.5rem;     /* 8px */
--space-3:    0.75rem;    /* 12px */
--space-4:    1rem;       /* 16px */
--space-5:    1.25rem;    /* 20px */
--space-6:    1.5rem;     /* 24px */
--space-8:    2rem;       /* 32px */
--space-10:   2.5rem;     /* 40px */
--space-12:   3rem;       /* 48px */
--space-16:   4rem;       /* 64px */
--space-20:   5rem;       /* 80px */
--space-24:   6rem;       /* 96px */
--space-32:   8rem;       /* 128px */
--space-40:   10rem;      /* 160px */
--space-48:   12rem;      /* 192px */
```

#### Section Spacing

| Section | Mobile Padding | Desktop Padding |
|---------|---------------|-----------------|
| Hero | 80px vertical | 160px vertical |
| Features | 64px vertical | 128px vertical |
| How It Works | 64px vertical | 128px vertical |
| Pricing | 64px vertical | 128px vertical |
| CTA | 64px vertical | 96px vertical |
| Footer | 48px vertical | 64px vertical |

### 2.4 Border Radius

```css
--radius-sm:   0.25rem;    /* 4px - small elements */
--radius-md:   0.5rem;     /* 8px - buttons, inputs */
--radius-lg:   0.75rem;    /* 12px - cards */
--radius-xl:   1rem;       /* 16px - larger cards */
--radius-2xl:  1.5rem;     /* 24px - featured elements */
--radius-3xl:  2rem;       /* 32px - hero cards */
--radius-full: 9999px;     /* Pills, avatars */
```

### 2.5 Shadows

```css
--shadow-sm:    0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md:    0 4px 6px -1px rgba(0, 0, 0, 0.1), 
                0 2px 4px -2px rgba(0, 0, 0, 0.1);
--shadow-lg:    0 10px 15px -3px rgba(0, 0, 0, 0.1), 
                0 4px 6px -4px rgba(0, 0, 0, 0.1);
--shadow-xl:    0 20px 25px -5px rgba(0, 0, 0, 0.1), 
                0 8px 10px -6px rgba(0, 0, 0, 0.1);
--shadow-2xl:   0 25px 50px -12px rgba(0, 0, 0, 0.25);

/* Colored Shadows (for buttons/cards) */
--shadow-green: 0 10px 40px -10px rgba(34, 197, 94, 0.4);
--shadow-glow:  0 0 40px rgba(34, 197, 94, 0.3);

/* Glass Shadow */
--shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.12);
```

### 2.6 Animation Timings

```css
/* Easing Curves */
--ease-out-expo:    cubic-bezier(0.16, 1, 0.3, 1);
--ease-out-quart:   cubic-bezier(0.25, 1, 0.5, 1);
--ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1);
--ease-spring:      cubic-bezier(0.175, 0.885, 0.32, 1.275);

/* Duration Scale */
--duration-instant:   0ms;
--duration-fast:      150ms;
--duration-normal:    300ms;
--duration-slow:      500ms;
--duration-slower:    700ms;
--duration-slowest:   1000ms;
```

---

## 3. Landing Page Sections

### 3.1 Hero Section

**Visual Concept:** Full-viewport immersive experience with animated mesh gradient background, floating glass-morphism cards, and dynamic particle effects.

#### Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    NAVIGATION                          │  │
│  │  Logo          Features   Pricing   About    [CTA]     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│      ╭─────────────────────────────────────────────╮        │
│      │  MESH GRADIENT BACKGROUND                   │        │
│      │     (Animated, subtle movement)             │        │
│      │                                             │        │
│      │     ┌─────────────────────────────┐        │        │
│      │     │   Connect. Grow. Thrive.    │        │        │
│      │     │   [Animated gradient text]  │        │        │
│      │     └─────────────────────────────┘        │        │
│      │                                             │        │
│      │     The affordable B2B marketplace...      │        │
│      │                                             │        │
│      │  ┌────────────┐   ┌────────────┐          │        │
│      │  │  Start     │   │  Watch     │          │        │
│      │  │  Free →    │   │  Demo ▶    │          │        │
│      │  └────────────┘   └────────────┘          │        │
│      │                                             │        │
│      │   ┌─────┐  ┌─────┐  ┌─────┐                │        │
│      │   │Card │  │Card │  │Card │  (Floating)    │        │
│      │   └─────┘  └─────┘  └─────┘                │        │
│      ╰─────────────────────────────────────────────╯        │
│                                                              │
│                    ▼ Scroll indicator                        │
└──────────────────────────────────────────────────────────────┘
```

#### Design Specifications

**Background:**
- Base: Dark gradient (`--gradient-hero`)
- Overlay: Animated mesh gradient with subtle movement
- Particles: Small floating dots (cannabis leaf inspired shapes)
- Noise texture overlay for depth

**Typography:**
- Main headline: `text-7xl font-extrabold tracking-tight`
- Animated gradient text on "Thrive"
- Subtitle: `text-xl text-gray-300 max-w-2xl`

**CTA Buttons:**
- Primary: Glass-morphism with green glow on hover
- Secondary: Outlined, ghost style

**Floating Elements:**
- 3 floating glass cards showcasing platform features
- Subtle 3D rotation on hover
- Staggered entrance animation

#### Animation Specifications

```typescript
// Entrance Animation Timeline
const heroTimeline = [
  { element: 'background', delay: 0, duration: 1000, animation: 'fadeIn' },
  { element: 'headline', delay: 200, duration: 800, animation: 'slideUp' },
  { element: 'subtitle', delay: 400, duration: 800, animation: 'slideUp' },
  { element: 'cta-buttons', delay: 600, duration: 800, animation: 'slideUp' },
  { element: 'floating-card-1', delay: 800, duration: 600, animation: 'floatIn' },
  { element: 'floating-card-2', delay: 900, duration: 600, animation: 'floatIn' },
  { element: 'floating-card-3', delay: 1000, duration: 600, animation: 'floatIn' },
  { element: 'scroll-indicator', delay: 1500, duration: 500, animation: 'fadeIn' },
];

// Continuous Animations
const continuousAnimations = {
  meshGradient: { type: 'pan', duration: 20000, easing: 'linear', loop: true },
  particles: { type: 'float', duration: 3000, stagger: 500, loop: true },
  floatingCards: { type: 'hover', amplitude: 10, duration: 4000, loop: true },
};
```

#### Code Reference

```tsx
// app/components/landing/Hero.tsx
export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Animated Mesh Background */}
      <div className="absolute inset-0 bg-gradient-hero">
        <div className="absolute inset-0 mesh-gradient animate-pan" />
        <div className="absolute inset-0 noise-overlay opacity-20" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
          className="text-7xl font-extrabold text-white text-center leading-tight"
        >
          Connect. Grow.{' '}
          <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
            Thrive.
          </span>
        </motion.h1>
        
        {/* ... rest of content */}
      </div>
    </section>
  );
}
```

---

### 3.2 Problem/Solution Section

**Visual Concept:** Split-screen or card-based layout with animated statistics and comparison visualizations.

#### Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│     The Problem                                              │
│     ───────────────                                          │
│     Traditional cannabis wholesale is broken                 │
│                                                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │ 💸 High Fees    │ │ 📉 Limited      │ │ 🔒 Walled       ││
│  │                 │ │ Access          │ │ Gardens         ││
│  │ 60% markup on   │ │ Few options     │ │ Hard to find    ││
│  │ traditional     │ │ for buyers      │ │ new partners    ││
│  │ platforms       │ │                 │ │                 ││
│  │                 │ │                 │ │                 ││
│  │ $600/mo APEX    │ │ Regional limits │ │ No transparency ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
│                                                              │
│                    ────────► Transform                       │
│                                                              │
│     The Solution: PhenoFarm                                  │
│     ─────────────────────────                                │
│                                                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │ 💚 Save 60%     │ │ 🌐 Open         │ │ 🔗 Connected    ││
│  │                 │ │ Marketplace     │ │ Network         ││
│  │ Only $249/month │ │ All verified    │ │ Direct          ││
│  │ for the same    │ │ growers &       │ │ relationships   ││
│  │ powerful tools  │ │ dispensaries    │ │ with partners   ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### Design Specifications

**Layout:**
- Container: `max-w-7xl mx-auto`
- Grid: 3-column responsive
- Gap: `gap-8` between cards

**Problem Cards:**
- Background: `bg-gray-900/50` with red accent border
- Icon: Large, muted color
- Text: Subtle, problem-focused
- Hover: Subtle glow effect with pulse

**Solution Cards:**
- Background: `bg-green-950/50` with green accent border
- Icon: Large, vibrant green
- Text: Positive, benefit-focused
- Hover: Green glow with scale up

**Transform Arrow:**
- Large animated arrow
- Morphing animation
- Gradient stroke

#### Animation Specifications

```typescript
const problemSolutionTimeline = {
  trigger: 'scroll', // IntersectionObserver at 30% visibility
  sequence: [
    { element: 'section-title', animation: 'fadeInUp', duration: 600 },
    { element: 'problem-label', animation: 'fadeIn', delay: 100, duration: 400 },
    { element: 'problem-cards', animation: 'staggerSlideIn', stagger: 150, duration: 500 },
    { element: 'transform-arrow', animation: 'scaleIn', delay: 600, duration: 400 },
    { element: 'solution-label', animation: 'fadeIn', delay: 700, duration: 400 },
    { element: 'solution-cards', animation: 'staggerSlideIn', stagger: 150, duration: 500 },
  ],
};
```

---

### 3.3 Features Showcase

**Visual Concept:** Interactive bento-grid layout with animated icons, hover reveals, and feature emphasis.

#### Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│     Why PhenoFarm?                                          │
│     ─────────────────                                        │
│     Everything you need to thrive in cannabis wholesale     │
│                                                              │
│  ┌───────────────────────────┐ ┌───────────┐ ┌───────────┐ │
│  │                           │ │  📊       │ │  🔒      │ │
│  │     🌱 Verified Network   │ │ Analytics │ │ Security  │ │
│  │                           │ │           │ │           │ │
│  │  Connect with licensed    │ │ Track     │ │ Bank-     │ │
│  │  growers & dispensaries  │ │ performan │ │ level     │ │
│  │  across the region        │ │ ce with   │ │ security  │ │
│  │                           │ │ insights  │ │ standards │ │
│  │  [Preview Animation]      │ │           │ │           │ │
│  │                           │ └───────────┘ └───────────┘ │
│  └───────────────────────────┘                              │
│                                                              │
│  ┌───────────┐ ┌───────────┐ ┌───────────────────────────┐ │
│  │ 💰 60%    │ │ 📱 Mobile │ │                           │ │
│  │ Savings   │ │ First     │ │    📋 Integrated Tools    │ │
│  │           │ │           │ │                           │ │
│  │ $249 vs   │ │ Full      │ │  CSV upload, inventory    │ │
│  │ $600+     │ │ platform  │ │ management, Metrc         │ │
│  │           │ │ on any    │ │ integration, and more     │ │
│  │           │ │ device    │ │                           │ │
│  └───────────┘ └───────────┘ └───────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### Design Specifications

**Bento Grid:**
- CSS Grid with auto-fit and minmax
- Featured cards span 2 columns/rows
- Responsive: 1 → 2 → 3 columns

**Card Design:**
- Glass-morphism effect
- Gradient border on hover
- Icon animates on hover
- Description fades in/out

**Icon Treatment:**
- Custom Lucide icons with gradient fills
- Subtle scale animation (1.0 → 1.1) on hover
- Glow effect matching feature color

**Featured Card:**
- Larger footprint for key feature
- Subtle animation preview (like Linear)
- Background video or Lottie option

#### Animation Specifications

```typescript
const featuresAnimation = {
  cards: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    whileHover: { scale: 1.02, transition: { duration: 0.2 } },
  },
  icons: {
    whileHover: { 
      scale: 1.15, 
      rotate: [0, -5, 5, 0],
      transition: { duration: 0.3 } 
    },
  },
  description: {
    initial: { opacity: 0.7 },
    whileHover: { opacity: 1 },
  },
  container: {
    staggerChildren: 100,
  },
};
```

---

### 3.4 How It Works

**Visual Concept:** Animated step-by-step journey with connected path lines and interactive step reveals.

#### Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│     How It Works                                             │
│     ─────────────                                            │
│     Simple steps to wholesale success                        │
│                                                              │
│     ┌─────── FOR GROWERS ────────┐  ┌─────── FOR DISPENSARIES ───────┐
│     │                            │  │                                │
│     │  ○─────────────○─────────────○─────────────○                 │
│     │  │             │             │             │                 │
│     │  ▼             ▼             ▼             ▼                 │
│     │ ┌───┐       ┌───┐       ┌───┐       ┌───┐                  │
│     │ │ 1 │       │ 2 │       │ 3 │       │ 1 │                  │
│     │ └───┘       └───┘       └───┘       └───┘                  │
│     │ List        Receive     Process     Browse                  │
│     │ Products    Orders      & Ship      Catalog                  │
│     │                            ▲             │                  │
│     └────────────────────────────┼─────────────┼──────────────────┘
│                                  ▼             ▼                 
│                              ┌───┐       ┌───┐                  
│                              │ 2 │       │ 3 │                  
│                              └───┘       └───┘                  
│                              Place       Manage                  
│                              Orders      Inventory               
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

#### Design Specifications

**Tab System:**
- Growers / Dispensaries toggle
- Animated tab indicator
- Content morphs between states

**Step Cards:**
- Circular numbered badge with gradient
- Connecting animated line (dashed)
- Icon + title + description
- Progress indicator as user scrolls

**Interactive Path:**
- SVG animated path line
- Steps activate as they enter viewport
- Glow effect on active step

#### Animation Specifications

```typescript
const howItWorksAnimation = {
  pathLine: {
    type: 'draw',
    from: '0%',
    to: '100%',
    duration: 1500,
    easing: 'easeOutExpo',
    trigger: 'scroll',
  },
  steps: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { stagger: 200, duration: 500, ease: 'easeOut' },
  },
  connector: {
    type: 'progress',
    animated: true,
    activeColor: 'var(--green-500)',
    inactiveColor: 'var(--gray-300)',
  },
};
```

---

### 3.5 Testimonials / Social Proof

**Visual Concept:** Alternating carousel or animated grid with company logos, quotes, and profile images.

#### Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│     Trusted by Industry Leaders                              │
│     ────────────────────────                                 │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                         ││
│  │   "PhenoFarm cut our costs by 60% and the platform    ││
│  │    is incredibly intuitive. Best decision we made."    ││
│  │                                                         ││
│  │   ─ Sarah Chen, Owner                                  ││
│  │     Green Mountain Dispensary                          ││
│  │                     ┌────────┐                          ││
│  │                     │  ●●●   │  ★★★★★                  ││
│  │                     │  👤   │                          ││
│  │                     └────────┘                          ││
│  │                                                         ││
│  │   ◀ ───────────────── [●●○○○] ───────────────── ▶     ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │ Logo│ │ Logo│ │ Logo│ │ Logo│ │ Logo│ │ Logo│          │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘          │
│  (Partner/Client logos in grayscale, color on hover)        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### Design Specifications

**Quote Card:**
- Large quote marks (styled, gradient)
- Quote text: `text-xl md:text-2xl`
- Author info with avatar
- Star rating

**Carousel:**
- Auto-advance every 5 seconds
- Pause on hover
- Smooth slide transition
- Navigation dots + arrows

**Logo Strip:**
- Grayscale by default
- Color on hover
- Infinite scroll animation (subtle)
- Logo opacity: 0.5 → 1.0 on hover

#### Animation Specifications

```typescript
const testimonialsAnimation = {
  carousel: {
    type: 'slide',
    duration: 600,
    easing: 'easeOutExpo',
    autoPlay: true,
    interval: 5000,
  },
  quote: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  },
  logos: {
    type: 'marquee',
    speed: 30, // seconds for full rotation
    pauseOnHover: true,
  },
};
```

---

### 3.6 Pricing Section

**Visual Concept:** Clean comparison cards with interactive toggle, feature comparison, and clear CTAs.

#### Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│     Simple, Transparent Pricing                              │
│     ──────────────────────────                               │
│     Save 60% compared to traditional platforms               │
│                                                              │
│        [Monthly / Annually (save 20%)] ◄─ Toggle            │
│                                                              │
│  ┌─────────────────────┐ ┌─────────────────────┐            │
│  │    Free Trial       │ │    Wholesale Pro    │            │
│  │    ───────────      │ │    ─────────────    │            │
│  │                     │ │  ★ MOST POPULAR ★  │            │
│  │    $0               │ │                     │            │
│  │    /month           │ │    $249  $199/mo    │            │
│  │                     │ │    billed annually  │            │
│  │    Test the         │ │                     │            │
│  │    platform         │ │    Full platform    │            │
│  │                     │ │                     │            │
│  │    ✓ 30 days        │ │    ✓ Unlimited      │            │
│  │    ✓ Basic features │ │    ✓ Analytics      │            │
│  │    ✓ Support        │ │    ✓ Priority       │            │
│  │                     │ │    ✓ CSV Import     │            │
│  │  [Get Started]      │ │    ✓ Metrc Ready    │            │
│  │                     │ │                     │            │
│  │                     │ │  [Start Free Trial] │            │
│  └─────────────────────┘ └─────────────────────┘            │
│                                                              │
│  ─────────── Compare all features ───────────────            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### Design Specifications

**Toggle:**
- Pill-style toggle
- Annual shows savings badge
- Smooth transition between states

**Free Card:**
- Subtle border: `border-gray-700`
- Background: `bg-gray-900/50`
- Hover: Subtle glow

**Pro Card:**
- Featured border: `border-green-500`
- Background: Gradient `from-green-950/50 to-gray-900/50`
- "Most Popular" badge
- Glow effect behind card
- Slightly larger/scaled

**Price Display:**
- Large price number
- Crossed-out comparison price
- Savings callout

#### Animation Specifications

```typescript
const pricingAnimation = {
  toggle: {
    type: 'switch',
    duration: 300,
    easing: 'easeOutQuart',
  },
  priceChange: {
    type: 'countUp',
    duration: 500,
    easing: 'easeOutExpo',
  },
  cards: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    whileHover: { scale: featured ? 1.02 : 1 },
    featuredCard: {
      boxShadow: '0 0 60px rgba(34, 197, 94, 0.2)',
    },
  },
  checkmarks: {
    type: 'stagger',
    delay: 50,
    animation: 'draw',
  },
};
```

---

### 3.7 CTA Section

**Visual Concept:** Bold, full-width section with dramatic gradient, animated background, and clear value proposition.

#### Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│╔════════════════════════════════════════════════════════════╗│
│║                                                            ║│
│║    Ready to Transform Your Cannabis Wholesale Business?   ║│
│║                                                            ║│
│║    Join 500+ businesses saving 60% on their platform     ║│
│║    costs with PhenoFarm                                   ║│
│║                                                            ║│
│║    ┌────────────────────┐  ┌────────────────────┐        ║│
│║    │   Start Free       │  │   Talk to Sales    │        ║│
│    │   Trial →           │  │   →                │        ║│
│║    └────────────────────┘  └────────────────────┘        ║│
│║                                                            ║│
│║    No credit card required • 30 days free • Cancel anytime║│
│║                                                            ║│
│╚════════════════════════════════════════════════════════════╝│
└──────────────────────────────────────────────────────────────┘
```

#### Design Specifications

**Background:**
- Full-bleed gradient
- Animated mesh gradient (slower than hero)
- Subtle particle effects
- Optional floating elements

**Typography:**
- Large, bold headline
- White text on dark gradient
- Subtitle in lighter shade

**CTA Buttons:**
- Primary: White/green gradient with strong shadow
- Secondary: Ghost style with border
- Both have hover scale + glow

**Trust Elements:**
- Small text with benefits
- Icons for each point

#### Animation Specifications

```typescript
const ctaAnimation = {
  background: {
    type: 'pan',
    duration: 30000,
    easing: 'linear',
    loop: true,
  },
  headline: {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 600 },
  },
  buttons: {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { delay: 200, duration: 500 },
  },
  trustItems: {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    transition: { delay: 400, stagger: 100 },
  },
};
```

---

### 3.8 Footer

**Visual Concept:** Clean, organized footer with gradient background and comprehensive links.

#### Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  PhenoFarm                    Quick Links    Resources   ││
│  │                              │              │            ││
│  │  The affordable B2B          │ For Growers  │ Blog       ││
│  │  marketplace for cannabis    │ For Dispens. │ Help Center││
│  │  wholesale.                  │ Pricing      │ API Docs   ││
│  │                              │ Contact      │ Status     ││
│  │  [Logo]                                        [Social]  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  © 2026 PhenoFarm. All rights reserved.  Privacy • Terms    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### Design Specifications

**Layout:**
- 4-column grid (responsive)
- Logo + tagline left
- Links right
- Social icons bottom

**Background:**
- Dark: `bg-gray-950`
- Subtle top border: `border-t border-gray-800`

**Links:**
- Organized by category
- Hover color: green-400
- Smooth transition

**Social Icons:**
- X/Twitter, LinkedIn, Instagram, Email
- Hover: Scale + brand color

---

## 4. Interactions & Animations

### 4.1 Scroll-Triggered Animations

**Implementation: Framer Motion with IntersectionObserver**

```typescript
// lib/animations/scroll-animations.ts
import { useInView } from 'framer-motion';

export const scrollAnimationConfig = {
  // Fade up (most common)
  fadeUp: {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  },
  
  // Fade in
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5 }
  },
  
  // Scale up
  scaleUp: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  },
  
  // Slide from left
  slideLeft: {
    initial: { opacity: 0, x: -40 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  },
  
  // Slide from right
  slideRight: {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  },
};

// Custom hook for scroll-triggered animations
export function useScrollAnimation(threshold = 0.3) {
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    once: true, 
    amount: threshold,
    margin: '-50px'
  });
  
  return { ref, isInView };
}
```

### 4.2 Hover Effects

**Button Hover States:**

```typescript
// components/ui/Button.tsx hover variants
const buttonVariants = {
  // Primary CTA button
  primary: {
    initial: { scale: 1 },
    hover: { 
      scale: 1.02,
      boxShadow: '0 10px 40px rgba(34, 197, 94, 0.4)',
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.98 }
  },
  
  // Secondary/Ghost button
  secondary: {
    initial: { scale: 1, borderColor: 'rgba(255,255,255,0.2)' },
    hover: { 
      scale: 1.02,
      borderColor: 'rgba(34, 197, 94, 0.5)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.98 }
  },
};

// Card hover states
const cardVariants = {
  default: {
    initial: { scale: 1, y: 0 },
    hover: { 
      scale: 1.02, 
      y: -4,
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
      transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
    }
  },
  
  featured: {
    initial: { scale: 1, y: 0, borderColor: 'rgba(34, 197, 94, 0.3)' },
    hover: { 
      scale: 1.03, 
      y: -8,
      borderColor: 'rgba(34, 197, 94, 0.6)',
      boxShadow: '0 25px 50px rgba(34, 197, 94, 0.2)',
      transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
    }
  }
};
```

### 4.3 Micro-Interactions

**Icon Animations:**

```typescript
// Icon interaction config
const iconAnimations = {
  // Subtle bounce on hover
  bounce: {
    whileHover: { 
      scale: [1, 1.1, 1],
      transition: { duration: 0.3 }
    }
  },
  
  // Rotate on hover
  rotate: {
    whileHover: { 
      rotate: [0, -10, 10, 0],
      transition: { duration: 0.4 }
    }
  },
  
  // Pulse glow
  pulseGlow: {
    whileHover: {
      filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.5))',
      transition: { duration: 0.2 }
    }
  }
};
```

**Number Counter Animation:**

```typescript
// Animated number counter
import { useSpring, useTransform, motion } from 'framer-motion';

function AnimatedNumber({ value, duration = 2 }: { value: number, duration?: number }) {
  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());
  
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);
  
  return <motion.span>{display}</motion.span>;
}
```

### 4.4 Loading States

**Page Load Animation:**

```typescript
// components/landing/PageTransition.tsx
const pageLoadConfig = {
  // Initial page load
  container: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 }
  },
  
  // Stagger children
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  },
  
  // Individual items
  item: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
};
```

**Button Loading State:**

```typescript
// Loading spinner for buttons
const buttonLoadingState = {
  loading: {
    spinner: {
      animate: { rotate: 360 },
      transition: { duration: 1, repeat: Infinity, ease: 'linear' }
    },
    text: { opacity: 0.7 }
  },
  
  success: {
    checkmark: {
      pathLength: 1,
      transition: { duration: 0.3 }
    }
  }
};
```

### 4.5 Parallax Effects

**Background Parallax:**

```typescript
// components/landing/ParallaxBackground.tsx
import { useScroll, useTransform } from 'framer-motion';

function ParallaxBackground() {
  const { scrollY } = useScroll();
  
  // Layer speeds (slower = more distant)
  const layer1Y = useTransform(scrollY, [0, 1000], [0, 100]);
  const layer2Y = useTransform(scrollY, [0, 1000], [0, 200]);
  const layer3Y = useTransform(scrollY, [0, 1000], [0, 300]);
  
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <motion.div style={{ y: layer1Y }} className="absolute inset-0 bg-gradient-mesh" />
      <motion.div style={{ y: layer2Y }} className="absolute inset-0 bg-particles" />
      <motion.div style={{ y: layer3Y }} className="absolute inset-0 bg-glow" />
    </div>
  );
}
```

**Scroll-Linked Animations:**

```typescript
// Scroll progress indicator
const scrollProgressConfig = {
  progressBar: {
    scaleX: useTransform(scrollYProgress, [0, 1], [0, 1])
  },
  
  // Fade sections as they scroll past
  fadeOnScroll: {
    opacity: useTransform(scrollYProgress, [0, 0.3], [1, 0])
  }
};
```

---

## 5. Technical Requirements

### 5.1 Tech Stack

**Core Framework:**
- Next.js 16+ (App Router) - Already in use ✅
- React 19 - Already in use ✅
- TypeScript - Already in use ✅

**Styling:**
- Tailwind CSS v4 - Already in use ✅
- CSS Variables for theming
- PostCSS for processing

**Animation Libraries:**
```json
{
  "dependencies": {
    "framer-motion": "^11.x",
    "@react-spring/web": "^9.x" // Optional: for physics-based animations
  }
}
```

**UI Components:**
- Radix UI (already using @radix-ui/react-slot)
- Lucide React for icons (already in use) ✅
- Class Variance Authority (already in use) ✅

**Additional Packages:**
```json
{
  "dependencies": {
    "clsx": "^2.x",           // Already in use ✅
    "tailwind-merge": "^3.x", // Already in use ✅
    "lucide-react": "^0.x"    // Already in use ✅
  }
}
```

### 5.2 Component Structure

```
app/
├── (landing)/
│   ├── page.tsx                    # Landing page entry
│   └── layout.tsx                  # Landing layout
│
├── components/
│   ├── landing/
│   │   ├── Hero/
│   │   │   ├── Hero.tsx            # Main hero component
│   │   │   ├── HeroBackground.tsx  # Animated background
│   │   │   ├── HeroCards.tsx       # Floating cards
│   │   │   ├── HeroParticles.tsx   # Particle effects
│   │   │   └── index.ts            # Exports
│   │   │
│   │   ├── ProblemSolution/
│   │   │   ├── ProblemSolution.tsx
│   │   │   ├── ProblemCard.tsx
│   │   │   ├── SolutionCard.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── Features/
│   │   │   ├── Features.tsx
│   │   │   ├── FeatureCard.tsx
│   │   │   ├── FeaturedCard.tsx     # Larger featured cards
│   │   │   └── index.ts
│   │   │
│   │   ├── HowItWorks/
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── StepCard.tsx
│   │   │   ├── StepPath.tsx         # Animated SVG path
│   │   │   └── index.ts
│   │   │
│   │   ├── Testimonials/
│   │   │   ├── Testimonials.tsx
│   │   │   ├── TestimonialCard.tsx
│   │   │   ├── LogoStrip.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── Pricing/
│   │   │   ├── Pricing.tsx
│   │   │   ├── PricingCard.tsx
│   │   │   ├── PricingToggle.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── CTA/
│   │   │   ├── CTA.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── Footer/
│   │   │   ├── Footer.tsx
│   │   │   ├── FooterLinks.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── Navigation/
│   │       ├── Navigation.tsx
│   │       ├── MobileNav.tsx
│   │       └── index.ts
│   │
│   ├── ui/
│   │   ├── Button.tsx              # Enhanced button
│   │   ├── Card.tsx                # Base card
│   │   ├── Badge.tsx               # Already exists
│   │   ├── Container.tsx           # Max-width container
│   │   ├── Section.tsx             # Section wrapper with anim
│   │   ├── Heading.tsx             # Typography helper
│   │   ├── Icon.tsx                # Enhanced icon wrapper
│   │   └── index.ts
│   │
│   └── shared/
│       ├── AnimatedSection.tsx     # Scroll-triggered wrapper
│       ├── GradientText.tsx        # Animated gradient text
│       ├── GlassCard.tsx           # Glass-morphism card
│       └── index.ts
│
├── lib/
│   ├── animations/
│   │   ├── variants.ts             # Framer Motion variants
│   │   ├── presets.ts              # Animation presets
│   │   └── useScrollAnimation.ts   # Custom hook
│   │
│   └── utils/
│       ├── cn.ts                   # Class name utility
│       └── constants.ts            # Design tokens
│
└── styles/
    ├── globals.css
    ├── animations.css              # Keyframe animations
    └── variables.css               # CSS custom properties
```

### 5.3 Performance Considerations

**1. Animation Performance:**
```typescript
// Use GPU-accelerated transforms only
// ✅ Good
transform: 'translateX(100px) scale(1.1)'
opacity: 1

// ❌ Avoid
left: '100px'
width: '200px'
margin: '10px'
```

**2. Lazy Loading:**
```typescript
// Lazy load below-the-fold sections
const Testimonials = lazy(() => import('./Testimonials'));
const Pricing = lazy(() => import('./Pricing'));
const Footer = lazy(() => import('./Footer'));
```

**3. Image Optimization:**
```typescript
// Use Next.js Image component everywhere
import Image from 'next/image';

// Specify sizes for responsive images
<Image
  src="/hero-bg.jpg"
  alt="Hero background"
  fill
  priority // For above-fold images
  sizes="100vw"
  className="object-cover"
/>
```

**4. Bundle Size:**
- Tree-shake Framer Motion: `import { motion } from 'framer-motion'`
- Use dynamic imports for heavy animations
- Consider `framer-motion/m` for minimal bundle

**5. CSS Optimization:**
```css
/* Use will-change sparingly */
.animated-element {
  will-change: transform;
}

/* Reduce paint complexity */
.complex-animation {
  contain: layout style;
}
```

**6. Core Web Vitals Targets:**
| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| TTFB | < 200ms |
| SI | < 3.0s |

---

## 6. Component Architecture

### 6.1 Reusable Animation Wrapper

```tsx
// components/shared/AnimatedSection.tsx
import { motion, useInView, Variants } from 'framer-motion';
import { useRef, ReactNode } from 'react';
import { scrollAnimationConfig } from '@/lib/animations/variants';

interface AnimatedSectionProps {
  children: ReactNode;
  animation?: keyof typeof scrollAnimationConfig;
  delay?: number;
  className?: string;
  threshold?: number;
}

export function AnimatedSection({ 
  children, 
  animation = 'fadeUp',
  delay = 0,
  className = '',
  threshold = 0.3
}: AnimatedSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: threshold });
  
  const variants = scrollAnimationConfig[animation];
  
  return (
    <motion.div
      ref={ref}
      initial={variants.initial}
      animate={isInView ? variants.animate : variants.initial}
      transition={{ ...variants.transition, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

### 6.2 Glass Card Component

```tsx
// components/shared/GlassCard.tsx
import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  glow?: boolean;
  glowColor?: string;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, glow = false, glowColor = 'green', ...props }, ref) => {
    const glowColors = {
      green: 'rgba(34, 197, 94, 0.2)',
      blue: 'rgba(59, 130, 246, 0.2)',
      purple: 'rgba(139, 92, 246, 0.2)',
    };
    
    return (
      <motion.div
        ref={ref}
        whileHover={{ 
          scale: 1.02, 
          y: -4,
          transition: { duration: 0.2 } 
        }}
        className={cn(
          'relative rounded-2xl border border-white/10',
          'bg-gradient-to-br from-white/10 to-white/5',
          'backdrop-blur-xl backdrop-saturate-150',
          'shadow-lg shadow-black/10',
          'overflow-hidden',
          className
        )}
        style={glow ? { boxShadow: `0 0 40px ${glowColors[glowColor]}` } : {}}
        {...props}
      >
        {/* Subtle inner glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        
        {/* Content */}
        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }
);
```

### 6.3 Animated Gradient Text

```tsx
// components/shared/GradientText.tsx
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  from?: string;
  via?: string;
  to?: string;
  animate?: boolean;
}

export function GradientText({ 
  children, 
  className,
  from = 'from-green-400',
  via = 'via-emerald-300',
  to = 'to-teal-400',
  animate = true
}: GradientTextProps) {
  return (
    <motion.span
      className={cn(
        'bg-gradient-to-r bg-clip-text text-transparent',
        from, via, to,
        animate && 'bg-[length:200%_auto]',
        className
      )}
      animate={animate ? {
        backgroundPosition: ['0% center', '200% center'],
      } : {}}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {children}
    </motion.span>
  );
}
```

### 6.4 Enhanced Button Component

```tsx
// components/ui/Button.tsx
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-600/20',
        secondary: 'bg-white/10 text-white hover:bg-white/20 backdrop-blur border border-white/20',
        ghost: 'hover:bg-white/10 text-gray-300 hover:text-white',
        outline: 'border border-white/20 text-white hover:bg-white/5 hover:border-white/40',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-base',
        lg: 'h-14 px-8 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'>,
    VariantProps<typeof buttonVariants> {
  children?: React.ReactNode;
  asChild?: boolean;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : motion.button;
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {loading ? (
          <>
            <motion.span
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            Loading...
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);

export { Button, buttonVariants };
```

---

## 7. Performance Guidelines

### 7.1 Animation Budget

| Animation Type | Max Duration | Notes |
|---------------|--------------|-------|
| Micro-interactions | 150-300ms | Hover, click, focus |
| Page transitions | 300-500ms | Route changes |
| Scroll-triggered | 500-800ms | Section reveals |
| Hero entrance | 800-1200ms | Initial load |
| Complex sequences | < 1500ms | Multi-step animations |

### 7.2 Bundle Size Targets

| Package | Max Size | Notes |
|---------|----------|-------|
| framer-motion | ~45KB | Tree-shake imports |
| lucide-react | ~10KB | Import individual icons |
| Total CSS | ~50KB | Tailwind purged |
| First Load JS | < 150KB | Critical path |

### 7.3 Rendering Optimization

```tsx
// Avoid re-renders from animations
const MemoizedAnimatedCard = memo(function AnimatedCard({ title, description }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} // Prevent re-triggering
    >
      <h3>{title}</h3>
      <p>{description}</p>
    </motion.div>
  );
});

// Use layoutId for shared element transitions
<motion.div layoutId="card-1">...</motion.div>
```

### 7.4 Accessibility

```tsx
// Respect reduced motion preferences
import { useReducedMotion } from 'framer-motion';

function AccessibleAnimation({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
    >
      {children}
    </motion.div>
  );
}
```

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Day 1-2)
- [ ] Set up animation library (Framer Motion)
- [ ] Create CSS variables and design tokens
- [ ] Build base UI components (Button, Card, Container)
- [ ] Create AnimatedSection wrapper
- [ ] Set up component folder structure

### Phase 2: Hero Section (Day 2-3)
- [ ] Build HeroBackground with mesh gradient
- [ ] Create HeroParticles effect
- [ ] Implement HeroCards floating animation
- [ ] Build hero typography and CTAs
- [ ] Scroll indicator animation

### Phase 3: Content Sections (Day 3-5)
- [ ] Problem/Solution section with animations
- [ ] Features bento grid with hover states
- [ ] How It Works with animated path
- [ ] Testimonials carousel
- [ ] Pricing cards with toggle

### Phase 4: Final Polish (Day 5-6)
- [ ] CTA section with background animation
- [ ] Footer with links and social
- [ ] Navigation with scroll effects
- [ ] Page transitions
- [ ] Loading states

### Phase 5: Optimization (Day 6-7)
- [ ] Performance audit (Lighthouse)
- [ ] Accessibility review
- [ ] Bundle size optimization
- [ ] Mobile responsiveness testing
- [ ] Cross-browser testing

---

## Appendix: File Templates

### A. globals.css Extensions

```css
/* Add to app/globals.css */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  /* Design Tokens - See Section 2 */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Animation Durations */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
}

/* Custom Animations */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse-glow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes draw-line {
  from { stroke-dashoffset: 1000; }
  to { stroke-dashoffset: 0; }
}

/* Utility Classes */
.animate-float {
  animation: float 4s ease-in-out infinite;
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient-shift 3s ease infinite;
}

.animate-draw {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: draw-line 2s ease-out forwards;
}

/* Glass Effect */
.glass {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-dark {
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.4) 0%,
    rgba(0, 0, 0, 0.2) 100%
  );
  backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* Text Gradient */
.text-gradient {
  background: linear-gradient(135deg, var(--green-400), var(--emerald-300));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### B. Animation Variants File

```typescript
// lib/animations/variants.ts
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
} as const satisfies Record<string, Variants>;

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
```

---

**End of Design Specification**

*This document provides complete design guidance for the PhenoFarm MVP landing page redesign. For implementation questions, reference the code examples and component architecture sections. All designs prioritize performance, accessibility, and modern aesthetic principles.*
