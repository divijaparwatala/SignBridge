import React from 'react';
import { Box, Typography } from '@mui/material';
import ISLTranslator from './ISLTranslator';

const ISLCardsPage = () => {
  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#333'
    }}>
      {/* Header Section */}
      <Box sx={{ 
        textAlign: 'center',
        padding: '30px 20px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(15px)',
        marginBottom: '30px',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
      }}>
        <Typography variant="h3" sx={{
          color: 'white',
          fontWeight: 700,
          margin: 0,
          textShadow: '2px 2px 8px rgba(0, 0, 0, 0.3)',
          letterSpacing: '1px'
        }}>
          ISL CLICKBOARD
        </Typography>
      </Box>

      {/* Content Container */}
      <Box sx={{ padding: '0 20px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <ISLTranslator />
      </Box>
    </Box>
  );
};

export default ISLCardsPage;