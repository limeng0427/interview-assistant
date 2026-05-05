// Material UI custom theme — matches the design system:
// Inter font, indigo accent, warm neutral backgrounds, soft cards.

import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#5C6BC0',      // indigo
      dark: '#3949AB',
      light: '#7986CB',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#546E7A',
    },
    background: {
      default: '#F8F8FB',
      paper: '#ffffff',
    },
    divider: 'rgba(92, 107, 192, 0.12)',
    text: {
      primary: '#1C1B2E',
      secondary: '#4A4869',
    },
    success: { main: '#43A047', light: '#E8F5E9' },
    warning: { main: '#F9A825', light: '#FFFDE7' },
    error:   { main: '#E53935', light: '#FFEBEE' },
    info:    { main: '#7E57C2', light: '#EDE7F6' },
  },
  typography: {
    fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
    h1: { fontFamily: '"Inter Tight", "Inter", sans-serif', fontWeight: 700, letterSpacing: '-0.025em' },
    h2: { fontFamily: '"Inter Tight", "Inter", sans-serif', fontWeight: 600, letterSpacing: '-0.02em' },
    h3: { fontFamily: '"Inter Tight", "Inter", sans-serif', fontWeight: 600, letterSpacing: '-0.015em' },
    h4: { fontFamily: '"Inter Tight", "Inter", sans-serif', fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontFamily: '"Inter Tight", "Inter", sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Inter Tight", "Inter", sans-serif', fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500, color: '#4A4869' },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.55, color: '#4A4869' },
    caption: { fontSize: '0.75rem', letterSpacing: '0.03em' },
    button: { fontWeight: 600, letterSpacing: '0.01em', textTransform: 'none' },
    overline: { fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em' },
  },
  shape: { borderRadius: 10 },
  shadows: [
    'none',
    '0 1px 2px rgba(15, 23, 42, 0.04)',
    '0 1px 3px rgba(15, 23, 42, 0.06), 0 4px 12px rgba(15, 23, 42, 0.04)',
    '0 4px 6px rgba(15, 23, 42, 0.05), 0 10px 15px rgba(15, 23, 42, 0.04)',
    '0 8px 28px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(15, 23, 42, 0.04)',
    '0 12px 40px rgba(15, 23, 42, 0.10), 0 4px 8px rgba(15, 23, 42, 0.05)',
    ...Array(19).fill('none') as string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ] as any,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': { boxSizing: 'border-box' },
        body: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 1 },
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: '1px solid rgba(92, 107, 192, 0.10)',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '7px 16px',
          fontWeight: 600,
        },
        contained: {
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        },
        outlined: {
          borderColor: 'rgba(92, 107, 192, 0.25)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 500, fontSize: '0.75rem' },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#5C6BC0',
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { border: 'none', boxShadow: 'none' },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: 'rgba(92, 107, 192, 0.08)',
            color: '#3949AB',
          },
        },
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
    },
  },
});
