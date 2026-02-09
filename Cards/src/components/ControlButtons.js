import React from 'react';
import { Box, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import BackspaceIcon from '@mui/icons-material/Backspace';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import TranslateIcon from '@mui/icons-material/Translate';

const ControlButtons = ({
  onAddSpace,
  onClear,
  onBackspace,
  onSpeak,
  selectedLanguage,
  onLanguageChange,
  languages,
  onTranslate,
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
      <Button
        variant="contained"
        onClick={onAddSpace}
        sx={{ minWidth: '100px' }}
      >
        Space
      </Button>

      <Button
        variant="contained"
        onClick={onClear}
        color="secondary"
        sx={{ minWidth: '100px' }}
      >
        Clear
      </Button>

      <Button
        variant="contained"
        onClick={onBackspace}
        startIcon={<BackspaceIcon />}
        sx={{ minWidth: '100px' }}
      >
        Backspace
      </Button>

      <Button
        variant="contained"
        onClick={onSpeak}
        startIcon={<VolumeUpIcon />}
        sx={{ minWidth: '150px' }}
      >
        Speak (English)
      </Button>

      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel>Translate to</InputLabel>
        <Select
          value={selectedLanguage}
          onChange={onLanguageChange}
          label="Translate to"
        >
          {languages.map((lang) => (
            <MenuItem key={lang} value={lang}>
              {lang}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="contained"
        onClick={onTranslate}
        startIcon={<TranslateIcon />}
        color="success"
        sx={{ minWidth: '200px' }}
      >
        Translate & Speak
      </Button>
    </Box>
  );
};

export default ControlButtons; 