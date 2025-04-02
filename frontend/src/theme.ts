import { createTheme } from '@mui/material/styles';

// Create a modern, attractive theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1a73e8', // Google blue
      light: '#4285f4',
      dark: '#0d47a1',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6c5ce7', // Soft purple
      light: '#a29bfe',
      dark: '#4834d4',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f8fa', // Light blue-gray background
      paper: '#ffffff',
    },
    error: {
      main: '#ea4335', // Google red
    },
    warning: {
      main: '#fbbc05', // Google yellow
    },
    success: {
      main: '#34a853', // Google green
    },
    text: {
      primary: '#202124', // Dark gray
      secondary: '#5f6368', // Medium gray
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Arial',
      'sans-serif',
    ].join(','),
    h6: {
      fontWeight: 500,
      fontSize: '1.25rem',
      letterSpacing: '0.0075em',
    },
    body1: {
      fontSize: '0.975rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none', // Don't capitalize button text
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12, // More rounded corners
  },
  components: {
    MuiAppBar: {
      defaultProps: {
        color: 'default',
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e6e8ec',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0px 1px 3px rgba(0,0,0,0.05), 0px 1px 2px rgba(0,0,0,0.07)',
        },
        elevation2: {
          boxShadow: '0px 2px 4px rgba(0,0,0,0.05), 0px 3px 6px rgba(0,0,0,0.07)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
        },
        containedPrimary: {
          boxShadow: '0px 3px 6px rgba(26, 115, 232, 0.25)',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(26, 115, 232, 0.35)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 12px rgba(26, 115, 232, 0.35)',
        },
      },
    },
  },
});

export default theme; 