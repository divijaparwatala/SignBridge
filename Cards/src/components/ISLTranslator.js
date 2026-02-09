import React, { useState } from 'react';
import { Box, Typography, TextField, Paper, Grid } from '@mui/material';
import SignButton from './SignButton';
import ControlButtons from './ControlButtons';

const languages = {
  "Hindi": { code: 'hi', ttsCode: 'hi-IN', hasGoogleTTS: true },
  "Tamil": { code: 'ta', ttsCode: 'ta-IN', hasGoogleTTS: true },
  "Telugu": { code: 'te', ttsCode: 'te-IN', hasGoogleTTS: true },
  "Marathi": { code: 'mr', ttsCode: 'mr-IN', hasGoogleTTS: true },
  "Bengali": { code: 'bn', ttsCode: 'bn-IN', hasGoogleTTS: true },
  "Gujarati": { code: 'gu', ttsCode: 'gu-IN', hasGoogleTTS: true },
  "Kannada": { code: 'kn', ttsCode: 'kn-IN', hasGoogleTTS: true },
  "Malayalam": { code: 'ml', ttsCode: 'ml-IN', hasGoogleTTS: true },
  "Odia": { code: 'or', ttsCode: 'hi-IN', hasGoogleTTS: false },
  "Punjabi": { code: 'pa', ttsCode: 'pa-IN', hasGoogleTTS: true },
  "Assamese": { code: 'as', ttsCode: 'hi-IN', hasGoogleTTS: false },
  "Nepali": { code: 'ne', ttsCode: 'ne-NP', hasGoogleTTS: true },
  "Konkani": { code: 'gom', ttsCode: 'hi-IN', hasGoogleTTS: false }
};

const ISLTranslator = () => {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('Hindi');

  const handleAddToSentence = (char) => {
    setInputText(prev => prev + char);
  };

  const handleClear = () => {
    setInputText('');
    setTranslatedText('');
  };

  const handleBackspace = () => {
    setInputText(prev => prev.slice(0, -1));
  };

  // Function to handle English speech (using browser's native API)
  const speakEnglish = (text) => {
    if ('speechSynthesis' in window && text.trim()) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  // Function to get audio from backend for translated text
  const speakTranslated = async (text, lang) => {
    if (!text) return;
    
    const languageConfig = languages[selectedLanguage];
    
    // For languages without Google TTS support, use browser TTS directly
    if (!languageConfig.hasGoogleTTS) {
      console.log(`Using browser TTS for ${selectedLanguage} (not supported by Google TTS)`);
      speakWithBrowserTTS(text, languageConfig.code);
      return;
    }
    
    // Try Google TTS first for supported languages
    try {
      console.log(`Attempting Google TTS for ${selectedLanguage} with code: ${lang}`);
      const response = await fetch('http://localhost:5001/speak-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        const audio = new Audio(audioUrl);
        audio.play().catch(e => {
          console.error("Audio play failed:", e);
          // Fallback to browser TTS if audio fails to play
          speakWithBrowserTTS(text, languageConfig.code);
        });
        console.log(`Successfully playing Google TTS audio for ${selectedLanguage}: "${text}"`);

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };

      } else {
        const errorData = await response.json();
        console.error('Google TTS API error:', errorData.error || response.statusText);
        console.log(`Falling back to browser TTS for ${selectedLanguage}`);
        speakWithBrowserTTS(text, languageConfig.code);
      }
    } catch (error) {
      console.error('Network error with Google TTS:', error);
      console.log(`Falling back to browser TTS for ${selectedLanguage}`);
      speakWithBrowserTTS(text, languageConfig.code);
    }
  };

  // Helper function for browser TTS
  const speakWithBrowserTTS = (text, langCode) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Wait for voices to load if they haven't already
      const speakWithVoices = () => {
        const voices = speechSynthesis.getVoices();
        console.log(`Available voices for ${langCode}:`, voices.filter(v => v.lang.includes(langCode)).map(v => v.name));
        
        // Try to find the best voice for the language
        let targetVoice = voices.find(voice => voice.lang === `${langCode}-IN`);
        if (!targetVoice) {
          targetVoice = voices.find(voice => voice.lang.startsWith(langCode));
        }
        if (!targetVoice) {
          targetVoice = voices.find(voice => voice.lang.includes('hi')); // Fallback to Hindi
        }
        
        if (targetVoice) {
          utterance.voice = targetVoice;
          console.log(`Using voice: ${targetVoice.name} (${targetVoice.lang}) for ${selectedLanguage}`);
        } else {
          console.log(`No specific voice found for ${langCode}, using default`);
        }
        
        utterance.lang = targetVoice ? targetVoice.lang : 'hi-IN';
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        utterance.onstart = () => console.log(`Browser TTS started for ${selectedLanguage}`);
        utterance.onend = () => console.log(`Browser TTS ended for ${selectedLanguage}`);
        utterance.onerror = (e) => console.error(`Browser TTS error:`, e);
        
        speechSynthesis.speak(utterance);
      };
      
      // If voices are already loaded, use them immediately
      if (speechSynthesis.getVoices().length > 0) {
        speakWithVoices();
      } else {
        // Wait for voices to load
        speechSynthesis.onvoiceschanged = speakWithVoices;
      }
    } else {
      console.error('Browser does not support Speech Synthesis API');
      alert(`Voice synthesis not available for ${selectedLanguage}`);
    }
  };

  const handleTranslate = async () => {
    if (!inputText) return;

    try {
      const response = await fetch('http://localhost:5001/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          target: languages[selectedLanguage].code,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        const translated = data.translatedText;
        setTranslatedText(translated);
        speakTranslated(translated, languages[selectedLanguage].ttsCode);
      } else {
        console.error('Translation error from backend:', data.error);
        setTranslatedText(`Translation Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Network or server error:', error);
      setTranslatedText('Translation Error: Could not connect to backend.');
    }
  };

  // Define alphabets and numbers separately
  const alphabets = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
  const numbers = [...'123456789'];

  return (
    <Box sx={{ my: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Build Your Sentence</Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              variant="outlined"
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Translation</Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={translatedText}
              variant="outlined"
              InputProps={{ readOnly: true }}
            />
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <ControlButtons
            onAddSpace={() => handleAddToSentence(' ')}
            onClear={handleClear}
            onBackspace={handleBackspace}
            onSpeak={() => speakEnglish(inputText)}
            selectedLanguage={selectedLanguage}
            onLanguageChange={(e) => setSelectedLanguage(e.target.value)}
            languages={Object.keys(languages)}
            onTranslate={handleTranslate}
          />
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            {/* Alphabets Section */}
            <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
              Alphabets
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {alphabets.map((char) => {
                const imgSrc = `/train1/${char}/${char}.jpg`;
                return (
                  <SignButton
                    key={char}
                    char={char}
                    imgSrc={imgSrc}
                    onClick={() => handleAddToSentence(char)}
                  />
                );
              })}
            </Box>

            {/* Numbers Section */}
            <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
              Numbers
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {numbers.map((char) => {
                const imgSrc = `/train1/${char}/${char}.jpg`;
                return (
                  <SignButton
                    key={char}
                    char={char}
                    imgSrc={imgSrc}
                    onClick={() => handleAddToSentence(char)}
                  />
                );
              })}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ISLTranslator;