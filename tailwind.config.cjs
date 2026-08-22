/** Design tokens sourced from redesign/DesignSystem.dc.html — treat as source of truth. */
module.exports = {
  content: [
    './layout/**/*.liquid',
    './sections/**/*.liquid',
    './snippets/**/*.liquid',
    './templates/**/*.liquid',
  ],
  corePlugins: {
    preflight: true,
  },
  theme: {
    screens: {
      sm: '390px',
      md: '768px',
      lg: '1024px',
      xl: '1560px',
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      ink: '#30271D',
      secondary: '#755F45',
      muted: '#9C8A74',
      bg: '#FFFAF0',
      surface: '#FFFFFF',
      elevated: '#E7E3DB',
      border: '#E0D9CC',
      divider: '#EFE9DE',
      gold: '#DBB281',
      hover: '#5B4933',
      focus: '#755F45',
      error: '#A03B2A',
      success: '#6E7F5B',
      disabled: '#B8A891',
    },
    fontFamily: {
      display: ["'Syne'", 'system-ui', 'sans-serif'],
      body: ["'Jost'", 'system-ui', 'sans-serif'],
      mono: ["'IBM Plex Mono'", 'monospace'],
    },
    fontSize: {
      display: ['96px', { lineHeight: '1', letterSpacing: '0.01em' }],
      'page-title': ['58px', { lineHeight: '1.1', letterSpacing: '0.005em' }],
      h1: ['46px', { lineHeight: '1.06', letterSpacing: '0.005em' }],
      h2: ['40px', { lineHeight: '1.2' }],
      h3: ['26px', { lineHeight: '1.5' }],
      h4: ['16px', { lineHeight: '1.5', letterSpacing: '0.06em' }],
      'body-lg': ['15px', { lineHeight: '1.85', letterSpacing: '0.03em' }],
      body: ['13px', { lineHeight: '1.9', letterSpacing: '0.02em' }],
      'body-sm': ['12px', { lineHeight: '1.7', letterSpacing: '0.04em' }],
      caption: ['10px', { lineHeight: '1.6', letterSpacing: '0.14em' }],
      label: ['10px', { lineHeight: '1', letterSpacing: '0.22em' }],
      nav: ['11px', { lineHeight: '1', letterSpacing: '0.16em' }],
      price: ['15px', { lineHeight: '1', letterSpacing: '0.04em' }],
      accordion: ['12px', { lineHeight: '1.5', letterSpacing: '0.14em' }],
    },
    borderRadius: {
      none: '0px',
      sm: '0px',
      md: '0px',
      lg: '0px',
      pill: '999px',
      full: '9999px',
    },
    boxShadow: {
      none: 'none',
      1: '0 1px 2px rgba(48,39,29,0.05)',
      2: '0 12px 40px rgba(48,39,29,0.10)',
    },
    extend: {
      // Design-token spacing scale (redesign/DesignSystem.dc.html). Extends
      // (not replaces) Tailwind's default numeric scale — keys 1-8 override
      // to the design tokens, everything else (gap-10, px-12, etc.) keeps
      // working with Tailwind's normal rem-based values.
      spacing: {
        1: '4px',
        2: '8px',
        3: '14px',
        4: '22px',
        5: '40px',
        6: '70px',
        7: '120px',
        8: '200px',
      },
      maxWidth: {
        page: '1560px',
      },
      transitionDuration: {
        fast: '160ms',
        normal: '320ms',
        slow: '520ms',
        editorial: '900ms',
      },
      transitionTimingFunction: {
        fast: 'cubic-bezier(0.4, 0, 0.2, 1)',
        normal: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
        slow: 'cubic-bezier(0.16, 1, 0.3, 1)',
        editorial: 'cubic-bezier(0.19, 1, 0.22, 1)',
        luxury: 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
      backgroundColor: {
        scrim: 'rgba(48,39,29,0.45)',
      },
    },
  },
  plugins: [],
}
