---
name: Luxe-Tech Mobile
colors:
  surface: '#111415'
  surface-dim: '#111415'
  surface-bright: '#373a3a'
  surface-container-lowest: '#0c0f0f'
  surface-container-low: '#191c1d'
  surface-container: '#1d2021'
  surface-container-high: '#282a2b'
  surface-container-highest: '#323536'
  on-surface: '#e1e3e3'
  on-surface-variant: '#bfc8ca'
  inverse-surface: '#e1e3e3'
  inverse-on-surface: '#2e3132'
  outline: '#8a9294'
  outline-variant: '#40484a'
  surface-tint: '#97d0dc'
  primary: '#ffffff'
  on-primary: '#00363e'
  primary-container: '#b3ecf9'
  on-primary-container: '#336c77'
  inverse-primary: '#2c6671'
  secondary: '#b0c6ff'
  on-secondary: '#002c6f'
  secondary-container: '#004cb4'
  on-secondary-container: '#b0c5ff'
  tertiary: '#ffffff'
  on-tertiary: '#003919'
  tertiary-container: '#83fba5'
  on-tertiary-container: '#00743a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#b3ecf9'
  primary-fixed-dim: '#97d0dc'
  on-primary-fixed: '#001f25'
  on-primary-fixed-variant: '#0b4e59'
  secondary-fixed: '#d9e2ff'
  secondary-fixed-dim: '#b0c6ff'
  on-secondary-fixed: '#001945'
  on-secondary-fixed-variant: '#00419c'
  tertiary-fixed: '#83fba5'
  tertiary-fixed-dim: '#66dd8b'
  on-tertiary-fixed: '#00210c'
  on-tertiary-fixed-variant: '#005227'
  background: '#111415'
  on-background: '#e1e3e3'
  surface-variant: '#323536'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-base:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 20px
  gutter: 12px
---

## Brand & Style

The design system is built on a "Luxe-Tech" philosophy, blending the exclusivity of high-end jewelry with the precision of cutting-edge technology. The target audience is discerning mobile users who value discovery, status, and seamless digital experiences. 

The visual style is a sophisticated evolution of **Glassmorphism**, utilizing deep layers and prismatic light refraction to create a sense of physical depth. It evokes an emotional response of being "in the know"—rewarding the user with high-contrast visual payoffs and energetic lighting effects that highlight rare "gems" of information within the dark interface.

## Colors

The palette is anchored in an "Obsidian" depth, using a true black (#050505) for the base layer and deep charcoal (#121212) for primary surfaces. This ensures that the high-contrast accent colors behave like light sources.

- **Diamond / Ice (#B9F2FF):** The primary light source. Used for core interactions, high-level accents, and "shimmer" effects.
- **Sapphire Blue (#0F52BA):** The secondary color, providing a deep, royal resonance for active states and secondary branding elements.
- **Emerald Green (#50C878):** Reserved for success states and high-value rewards, mimicking the glow of a rare gemstone.
- **Prismatic Accents:** Use subtle gradients between Diamond and Sapphire to create "refracted" light edges on containers.

## Typography

This design system utilizes a dual-font strategy to balance technical precision with modern refinement. 

**Space Grotesk** is used for headlines and labels to provide a geometric, futuristic edge. Its distinctive glyphs contribute to the "tech" aspect of the Luxe-Tech aesthetic. **Manrope** is used for body copy and UI labels where readability and a balanced, high-end feel are paramount. Headlines should utilize tighter letter spacing to feel impactful, while uppercase labels should be tracked out for a premium, editorial look.

## Layout & Spacing

The design system employs a strict 4px baseline grid to ensure mathematical precision. The mobile layout follows a dynamic fluid model with a standard **20px side margin** to allow content to breathe against the dark background.

Vertical rhythm is maintained through 8px increments. Components should utilize generous internal padding (16px to 24px) to reinforce the premium, "un-crowded" feel. Use white space intentionally as a separator, rather than relying on heavy borders or dividers.

## Elevation & Depth

Hierarchy is established through **Luminous Layering** rather than traditional shadows.

1.  **Base Layer:** True black (#050505).
2.  **Surface Layer:** Deep Charcoal (#121212) with a 1px inner stroke of 10% Diamond White to simulate a light-catching edge.
3.  **Floating Elements:** Use **Glassmorphism**. Apply a `backdrop-blur` of 20px-40px and a fill of 5% White.
4.  **Glows:** High-priority elements use a soft `0px 8px 24px` outer glow matching the element's accent color (Emerald, Sapphire, or Diamond) at 15-20% opacity. This creates the "high-contrast lighting" effect against the dark background.

## Shapes

The design system uses a **Rounded** shape language to soften the high-tech aesthetic and make it feel more approachable and organic. 

Standard components (Cards, Inputs) use an 8px (0.5rem) radius. High-interaction elements like Buttons and Chips use a `rounded-xl` or pill-shaped (1.5rem+) radius to feel more tactile and "gem-like." All glassmorphic containers must maintain consistent corner radii to ensure the refraction effects align across the UI.

## Components

- **Buttons:** Primary buttons feature a "Prismatic Gradient" (Sapphire to Diamond) with a subtle outer glow. Text is centered and bold.
- **Glass Cards:** Used for feed items. These feature a 1px border with a linear gradient (top-left to bottom-right) from 20% Diamond White to 0% Transparent.
- **Input Fields:** Minimalist design with a 1px bottom border in Charcoal. On focus, the border transitions to Diamond White with a soft 4px glow.
- **Status Chips:** Small, pill-shaped indicators using the Emerald, Sapphire, or Diamond colors. They include a small circular "inner light" dot of a higher intensity than the background fill.
- **Progress Bars:** Ultra-thin (2px-4px) lines using the Diamond Ice color, featuring a trailing glow effect as they fill.
- **Bottom Navigation:** A high-blur glassmorphic bar that appears to float above the content, using Sapphire Blue for the active icon state with a tiny "gem" dot indicator beneath it.