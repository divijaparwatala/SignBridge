import React from 'react';
import { Button } from '@mui/material';

const SignButton = ({ char, imgSrc, onClick }) => {
  return (
    <Button
      variant="contained"
      onClick={onClick}
      sx={{
        width: '100px',
        height: '100px',
        minWidth: '100px',
        minHeight: '100px',
        p: 0,
        backgroundColor: '#1976d2',
        '&:hover': { backgroundColor: '#1565c0' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={imgSrc}
        alt={char}
        style={{ width: '90px', height: '90px', objectFit: 'contain' }}
        onError={e => { e.target.onerror = null; e.target.src = ''; }}
      />
    </Button>
  );
};

export default SignButton; 