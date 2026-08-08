/**
 * ObraMZ Official Design Tokens
 * Auxiliary file for UI/UX standardization across all modules.
 */

export const designTokens = {
  colors: {
    primary: {
      DEFAULT: "var(--primary)", // #F97316 (Laranja ObraMZ)
      soft: "var(--primary-soft)",
      dark: "var(--primary-dark)",
    },
    surface: {
      dark: "var(--sidebar)", // #1F2937 (Azul Escuro Institucional)
      card: "var(--card)",
      background: "var(--background)",
    },
    semantic: {
      success: {
        DEFAULT: "var(--success)", // Emerald
        soft: "var(--success-soft)",
      },
      warning: {
        DEFAULT: "var(--warning)", // Amber
        soft: "var(--warning-soft)",
      },
      danger: {
        DEFAULT: "var(--destructive)", // Rose/Red
      },
      info: {
        DEFAULT: "var(--info)", // Blue
      },
      neutral: {
        DEFAULT: "var(--muted-foreground)",
        soft: "var(--muted)",
      },
    },
  },

  typography: {
    fontFamily: 'var(--font-sans, "Inter", sans-serif)',
    h1: "text-2xl font-bold tracking-tight text-foreground sm:text-3xl",
    h2: "text-xl font-bold tracking-tight text-foreground sm:text-2xl",
    h3: "text-lg font-semibold tracking-tight text-foreground",
    sectionTitle: "text-xs font-bold uppercase tracking-wider text-muted-foreground",
    cardTitle: "text-sm font-bold text-foreground",
    body: "text-sm text-foreground",
    bodySecondary: "text-xs text-muted-foreground",
    caption: "text-[11px] text-muted-foreground",
    badge: "text-xs font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5",
    kpiValue: "text-xl sm:text-2xl font-bold tracking-tight text-foreground",
    monetary: "font-mono font-bold text-foreground",
  },

  spacing: {
    containerPadding: "p-4 sm:p-6 space-y-6",
    cardPadding: "p-4 sm:p-5",
    gapGrid: "gap-4 sm:gap-5",
    gapFlex: "gap-2 sm:gap-3",
  },

  radius: {
    sm: "rounded-sm", // calc(var(--radius) - 4px)
    md: "rounded-md", // calc(var(--radius) - 2px)
    lg: "rounded-lg", // 0.625rem
    xl: "rounded-xl",
    full: "rounded-full",
  },

  shadows: {
    sm: "shadow-sm",
    md: "shadow-md",
    hover: "hover:shadow-md transition-all duration-200",
  },

  transitions: {
    fast: "transition-all duration-150 ease-in-out",
    default: "transition-all duration-200 ease-in-out", // 180~220ms
    slow: "transition-all duration-300 ease-in-out",
  },

  iconSizes: {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
  },

  touchTarget: {
    minHeight: "min-h-[40px] sm:min-h-[36px]",
    buttonSm: "h-8 text-xs px-3",
    buttonDefault: "h-9 text-sm px-4",
    buttonLg: "h-10 text-base px-5",
  },
} as const;
