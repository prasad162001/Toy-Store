import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6C5CE7', // Elegant Iris Violet
      light: '#A29BFE',
      dark: '#4834D4',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FF7675', // Warm Coral Pink
      light: '#FAB1A0',
      dark: '#D63031',
    },
    background: {
      default: '#FAF9FF', // Gentle Warm Lavender Mist
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2D3436',
      secondary: '#636E72',
    },
    warning: {
      main: '#FDCB6E',
    },
    success: {
      main: '#00B894',
    },
  },
  typography: {
    fontFamily: '"Outfit", "Plus Jakarta Sans", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 8px 20px rgba(108, 92, 231, 0.25)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 10px 30px rgba(108, 92, 231, 0.05)',
          border: '1px solid rgba(226, 224, 240, 0.6)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 15px 35px rgba(108, 92, 231, 0.12)',
          },
        },
      },
    },
  },
});
