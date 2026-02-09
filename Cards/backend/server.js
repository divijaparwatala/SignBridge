const express = require('express');
const translate = require('google-translate-api-browser').translate;
const getAudioUrl = require('google-tts-api').getAudioUrl;
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = 5001; // Changed from 5000 to 5001

app.use(cors());
app.use(express.json());

// Translation endpoint
app.post('/translate', async (req, res) => {
  const { text, target } = req.body;

  if (!text || !target) {
    return res.status(400).json({ error: 'Missing text or target language.' });
  }

  try {
    const result = await translate(text, { to: target });
    res.json({ translatedText: result.text });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Translation failed.' });
  }
});

// Text-to-Speech endpoint
app.post('/speak-text', async (req, res) => {
  const { text, lang } = req.body;

  if (!text || !lang) {
    console.log('TTS request missing text or language:', { text, lang });
    return res.status(400).json({ error: 'Missing text or language for speech.' });
  }

  console.log(`TTS request - Text: "${text}", Language: ${lang}`);

  try {
    const audioUrl = getAudioUrl(text, { lang: lang, slow: false, host: 'https://translate.google.com' });
    console.log(`Generated TTS URL for ${lang}:`, audioUrl);
    
    const audioResponse = await fetch(audioUrl);

    if (!audioResponse.ok) {
      console.error(`Google TTS API returned ${audioResponse.status}: ${audioResponse.statusText} for language ${lang}`);
      throw new Error(`Failed to fetch audio from Google TTS: ${audioResponse.status} ${audioResponse.statusText}`);
    }

    console.log(`Successfully fetched audio for ${lang}, streaming to client`);
    res.writeHead(200, { 'Content-Type': 'audio/mpeg' });
    audioResponse.body.pipe(res);

  } catch (error) {
    console.error(`TTS error for language ${lang}:`, error.message);
    res.status(500).json({ 
      error: 'Failed to generate or stream speech audio.',
      details: error.message,
      language: lang 
    });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
