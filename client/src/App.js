import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

// Components
import Navbar from './components/Navbar';
import StudentList from './components/StudentList';
import StudentProfile from './components/StudentProfile';
import AddStudent from './components/AddStudent';

// Create theme
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1890ff', // Bright blue (inspired by LeetCode)
      light: '#69c0ff',
      dark: '#096dd9',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#722ed1', // Purple (for difficulty levels)
      light: '#9254de',
      dark: '#531dab',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f0f2f5', // Light gray background
      paper: '#ffffff',
    },
    text: {
      primary: '#262626', // Dark gray
      secondary: '#595959', // Medium gray
    },
    success: {
      main: '#52c41a', // Green
      light: '#73d13d',
      dark: '#389e0d',
    },
    error: {
      main: '#f5222d', // Red
      light: '#ff4d4f',
      dark: '#cf1322',
    },
    warning: {
      main: '#faad14', // Gold
      light: '#ffc53d',
      dark: '#d48806',
    },
    info: {
      main: '#1890ff', // Blue
      light: '#69c0ff',
      dark: '#096dd9',
    },
    // Custom colors for problem difficulty
    difficulty: {
      easy: '#00b8a3', // LeetCode Easy green
      medium: '#ffc01e', // LeetCode Medium yellow
      hard: '#ff375f', // LeetCode Hard red
      expert: '#ff2d55', // Expert red
    },
    rating: {
      newbie: '#808080',
      pupil: '#008000',
      specialist: '#03a89e',
      expert: '#0000ff',
      candidateMaster: '#aa00aa',
      master: '#ff8c00',
      grandmaster: '#ff0000',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      letterSpacing: '0.00938em',
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      letterSpacing: '0.00714em',
    },
    body1: {
      fontSize: '1rem',
      letterSpacing: '0.00938em',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      letterSpacing: '0.01071em',
      lineHeight: 1.43,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          padding: '6px 16px',
          fontWeight: 500,
          textTransform: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
        contained: {
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '20px',
          '&:last-child': {
            paddingBottom: '20px',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 500,
          '&.MuiChip-filled': {
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
          },
        },
        label: {
          padding: '0 12px',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: 'rgba(0, 0, 0, 0.08)',
        },
        bar: {
          borderRadius: 4,
        },
      },
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1890ff',
      light: '#69c0ff',
      dark: '#096dd9',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#722ed1',
      light: '#9254de',
      dark: '#531dab',
      contrastText: '#ffffff',
    },
    background: {
      default: '#141414', // Dark background
      paper: '#1f1f1f', // Slightly lighter dark
    },
    text: {
      primary: '#ffffff',
      secondary: '#8c8c8c',
    },
    success: {
      main: '#52c41a',
      light: '#73d13d',
      dark: '#389e0d',
    },
    error: {
      main: '#f5222d',
      light: '#ff4d4f',
      dark: '#cf1322',
    },
    warning: {
      main: '#faad14',
      light: '#ffc53d',
      dark: '#d48806',
    },
    info: {
      main: '#1890ff',
      light: '#69c0ff',
      dark: '#096dd9',
    },
    // Custom colors for problem difficulty
    difficulty: {
      easy: '#00b8a3',
      medium: '#ffc01e',
      hard: '#ff375f',
      expert: '#ff2d55',
    },
    rating: {
      newbie: '#808080',
      pupil: '#008000',
      specialist: '#03a89e',
      expert: '#0000ff',
      candidateMaster: '#aa00aa',
      master: '#ff8c00',
      grandmaster: '#ff0000',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      letterSpacing: '0.00938em',
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      letterSpacing: '0.00714em',
    },
    body1: {
      fontSize: '1rem',
      letterSpacing: '0.00938em',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      letterSpacing: '0.01071em',
      lineHeight: 1.43,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          padding: '6px 16px',
          fontWeight: 500,
          textTransform: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          },
        },
        contained: {
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '20px',
          '&:last-child': {
            paddingBottom: '20px',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontWeight: 500,
          '&.MuiChip-filled': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
        },
        label: {
          padding: '0 12px',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        },
        bar: {
          borderRadius: 4,
        },
      },
    },
  },
});

function App() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1, 
              p: { xs: 2, sm: 3 },
              maxWidth: '1400px',
              width: '100%',
              mx: 'auto',
              mt: { xs: 2, sm: 3 }
            }}
          >
            <Routes>
              <Route path="/" element={<StudentList />} />
              <Route path="/student/:id" element={<StudentProfile />} />
              <Route path="/add-student" element={<AddStudent />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;

