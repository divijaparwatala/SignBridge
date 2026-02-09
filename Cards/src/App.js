import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

import HomePage from './components/HomePage';
import ISLCardsPage from './components/ISLCardsPage';
import LearnPage from './components/LearnPage';
import SignToTextPage from './components/SignToTextPage';
import TextToSignPage from './components/TextToSignPage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function Navbar() {
  const location = useLocation();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" className="menu-signbridge" sx={{ flexGrow: 1 }}>
          SignBridge
        </Typography>
        <Button 
          color="inherit" 
          component={Link} 
          to="/" 
          sx={{ 
            fontWeight: location.pathname === '/' ? 'bold' : 'normal',
            backgroundColor: location.pathname === '/' ? '#2196f3' : 'transparent'
          }}
        >
          Home
        </Button>
        <Button 
          color="inherit" 
          component={Link} 
          to="/isl-cards" 
          sx={{ 
            fontWeight: location.pathname === '/isl-cards' ? 'bold' : 'normal',
            backgroundColor: location.pathname === '/isl-cards' ? '#2196f3' : 'transparent'
          }}
        >
          ISL Cards
        </Button>
        <Button 
          color="inherit" 
          component={Link} 
          to="/sign-to-text" 
          sx={{ 
            fontWeight: location.pathname === '/sign-to-text' ? 'bold' : 'normal',
            backgroundColor: location.pathname === '/sign-to-text' ? '#2196f3' : 'transparent'
          }}
        >
          Sign to Text
        </Button>
        <Button 
          color="inherit" 
          component={Link} 
          to="/text-to-sign" 
          sx={{ 
            fontWeight: location.pathname === '/text-to-sign' ? 'bold' : 'normal',
            backgroundColor: location.pathname === '/text-to-sign' ? '#2196f3' : 'transparent'
          }}
        >
          Text to Sign
        </Button>
        <Button 
          color="inherit" 
          component={Link} 
          to="/learn" 
          sx={{ 
            fontWeight: location.pathname === '/learn' ? 'bold' : 'normal',
            backgroundColor: location.pathname === '/learn' ? '#2196f3' : 'transparent'
          }}
        >
          Learn
        </Button>
      </Toolbar>
    </AppBar>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navbar />
        <Routes>
          {/* Full-screen pages without Container */}
          <Route path="/sign-to-text" element={<SignToTextPage />} />
          <Route path="/text-to-sign" element={<TextToSignPage />} />
          <Route path="/isl-cards" element={<ISLCardsPage />} />
          <Route path="/learn" element={<LearnPage />} />
          
          {/* Home page with Container */}
          <Route path="/" element={
            <Container maxWidth="lg">
              <HomePage />
            </Container>
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;