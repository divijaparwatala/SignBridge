import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './TextToSignPage.css';
import { Typography } from '@mui/material';

const languages = {
  "English": { code: 'en', ttsCode: 'en' },
  "Hindi": { code: 'hi', ttsCode: 'hi' },
  "Tamil": { code: 'ta', ttsCode: 'ta' },
  "Telugu": { code: 'te', ttsCode: 'te' },
  "Marathi": { code: 'mr', ttsCode: 'mr' },
  "Bengali": { code: 'bn', ttsCode: 'bn' },
  "Gujarati": { code: 'gu', ttsCode: 'gu' },
  "Kannada": { code: 'kn', ttsCode: 'kn' },
  "Malayalam": { code: 'ml', ttsCode: 'ml' },
  "Odia": { code: 'or', ttsCode: 'or' },
  "Punjabi": { code: 'pa', ttsCode: 'pa' },
  "Assamese": { code: 'as', ttsCode: 'as' },
  "Nepali": { code: 'ne', ttsCode: 'ne' },
  "Sindhi": { code: 'sd', ttsCode: 'sd' },
  "Konkani": { code: 'gom', ttsCode: 'gom' }
};

const TextToSignPage = () => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [videoPaths, setVideoPaths] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [processedText, setProcessedText] = useState('');
  const [keywords, setKeywords] = useState([]);
  const recognitionRef = useRef(null);
  const signVideoRef = useRef(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allVideosPlayed, setAllVideosPlayed] = useState(false);

  const API_BASE_URL = 'http://127.0.0.1:5002';

  useEffect(() => {
    console.log('Initializing speech recognition...');
    console.log('webkitSpeechRecognition available:', 'webkitSpeechRecognition' in window);
    console.log('SpeechRecognition available:', 'SpeechRecognition' in window);
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event) => {
        console.log('Speech recognition result:', event.results);
        const speechResult = event.results[0][0].transcript;
        console.log('Transcribed text:', speechResult);
        setInputText(speechResult);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        console.error('Error details:', event);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access and try again.');
        } else if (event.error === 'no-speech') {
          alert('No speech detected. Please try speaking again.');
        } else {
          alert(`Speech recognition error: ${event.error}`);
        }
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };

      console.log('Speech recognition initialized successfully');
    } else {
      console.warn('Web Speech API not supported in this browser.');
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
    }
  }, []);

  useEffect(() => {
    if (signVideoRef.current) {
      signVideoRef.current.src = '/videos/hello.mp4';
      signVideoRef.current.load();
      signVideoRef.current.play().catch(error => {
        console.warn('Autoplay of initial video blocked:', error);
      });
    }
  }, []);

  const handleTranslate = async () => {
    setIsLoading(true);
    setError(null);
    if (!inputText.trim()) {
      setError('Please enter text to translate.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/translate_text`, {
        text: inputText,
        target_language: 'en', // Always translate to English
      });
      const translatedText = response.data.translated_text;
      setTranslatedText(translatedText); // Update the translated box
    } catch (err) {
      console.error('Error translating text:', err);
      setError('Failed to translate text. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextToSign = async (event) => {
    event.preventDefault(); // Prevent default form submission if wrapped in a form
    setIsLoading(true);
    setError(null);

    if (!inputText.trim()) {
      setError('Please enter some text to convert.');
      setIsLoading(false);
      return;
    }

    try {
      // Step 1: Translate the input text to English
      const translateResponse = await axios.post(`${API_BASE_URL}/translate_text`, {
        text: inputText,
        target_language: 'en', // Always translate to English
      });
      const translatedText = translateResponse.data.translated_text;
      setTranslatedText(translatedText); // Update the translated box

      // Step 2: Convert the translated text to ISL videos
      const islResponse = await axios.post(`${API_BASE_URL}/convert_text_to_sign`, {
        text: translatedText,
      });
      console.log('Frontend Debug: Response Data from /convert_text_to_sign', islResponse.data);
      const { video_urls, text, words } = islResponse.data;

      setProcessedText(translatedText); // Update 'The text that you entered is:' section
      setKeywords(words);

      if (video_urls && video_urls.length > 0) {
        const absoluteUrls = video_urls.map(url => {
          if (url.startsWith('/')) {
            return `http://127.0.0.1:5002${url}`;
          }
          return url;
        });
        setVideoPaths(absoluteUrls);
        setCurrentVideoIndex(0); // Reset to first video
      } else {
        setError('No sign language videos found for the entered text.');
        setVideoPaths([]); // Clear any previous videos
      }
    } catch (err) {
      console.error('Error processing text to sign:', err);
      setError('Failed to process text. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoEnded = () => {
    console.log('Video ended! Current index:', currentVideoIndex); // Debug log
    if (currentVideoIndex < videoPaths.length - 1) {
      setCurrentVideoIndex(prevIndex => prevIndex + 1);
    } else {
      console.log('All videos played. Displaying message.');
      setAllVideosPlayed(true);
    }
  };

  useEffect(() => {
    if (videoPaths.length > 0) {
      setAllVideosPlayed(false);
    }
  }, [videoPaths]);

  useEffect(() => {
    console.log('useEffect triggered. currentVideoIndex:', currentVideoIndex, 'videoPaths.length:', videoPaths.length); // Debug log
    if (videoPaths.length > 0 && signVideoRef.current) {
      const videoElement = signVideoRef.current;
      const videoUrl = videoPaths[currentVideoIndex];
      
      console.log('Setting video source:', videoUrl);
      
      // Remove any existing event listeners to prevent duplicates
      videoElement.removeEventListener('loadstart', () => {});
      videoElement.removeEventListener('loadedmetadata', () => {});
      videoElement.removeEventListener('loadeddata', () => {});
      videoElement.removeEventListener('canplay', () => {});
      videoElement.removeEventListener('error', () => {});
      
      // Add event listeners for debugging
      const handleLoadStart = () => console.log('Video loadstart');
      const handleLoadedMetadata = () => console.log('Video loadedmetadata');
      const handleLoadedData = () => console.log('Video loadeddata');
      const handleCanPlay = () => {
        console.log('Video canplay - attempting to play');
        videoElement.play().catch(error => {
          console.error('Error playing video after canplay:', error);
        });
      };
      const handleError = (e) => {
        console.error('Video error:', e);
        console.error('Video error details:', videoElement.error);
      };
      
      videoElement.addEventListener('loadstart', handleLoadStart);
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('loadeddata', handleLoadedData);
      videoElement.addEventListener('canplay', handleCanPlay);
      videoElement.addEventListener('error', handleError);
      
      // Set the source and load
      videoElement.src = videoUrl;
      videoElement.load();
      
      console.log('Video loading initiated for:', videoUrl); // Debug log
    }
  }, [currentVideoIndex, videoPaths]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSpeechToText = () => {
    console.log('Speech button clicked. isListening:', isListening);
    console.log('recognitionRef.current:', recognitionRef.current);

    if (!selectedLanguage || selectedLanguage === 'en') {
      alert('Please select a language other than English first.');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.lang = selectedLanguage; // Use the selected language for speech recognition

      if (isListening) {
        console.log('Stopping speech recognition...');
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        console.log('Starting speech recognition...');
        setInputText('');
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (error) {
          console.error('Error starting speech recognition:', error);
          alert('Error starting speech recognition. Please check microphone permissions.');
          setIsListening(false);
        }
      }
    } else {
      console.error('Speech recognition not supported or initialized.');
      alert('Speech recognition not supported in this browser. Please use Chrome or Edge.');
    }
  };

  const playPause = () => {
    if (signVideoRef.current) {
      if (signVideoRef.current.paused) {
        signVideoRef.current.play();
      } else {
        signVideoRef.current.pause();
      }
    }
  };

  return (
    <div className="text-to-sign-page">
      <div className="top-header">
        <h1>VoiceText2Sign</h1>
      </div>
      <div className="content-container">
        <div className="left-panel">
          <h2 align="center">Enter Text or Use Mic</h2>
          <form onSubmit={handleTextToSign}>
            <input
              type="text"
              className="mytext"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message here or use speech input..."
            />
            <input type="submit" value="Submit" className="submit-button" />
          </form>

          <div className="translation-section">
            <div className="language-selector" style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
              <button 
                type="button" 
                className={`mic-button ${isListening ? 'listening' : ''}`} 
                onClick={handleSpeechToText}
                title={isListening ? 'Click to stop listening' : 'Click to start speech input'}
                style={{ marginRight: '10px' }}
              >
                {isListening ? '🔴' : '🎙️'}
              </button>
              <label htmlFor="language-select">Language</label>
              <select
                id="language-select"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                style={{ minWidth: '150px', marginLeft: '10px' }}
              >
                {Object.keys(languages).map((langName) => (
                  <option key={languages[langName].code} value={languages[langName].code}>
                    {langName}
                  </option>
                ))}
              </select>
            </div>
            <div className="language-message" style={{ marginTop: '10px' }}>
              <p>Select required language and then click mic to speak.</p>
            </div>
          </div>

          <div className="text-display-section">
            <div className="text-row">
              <div className="text-label">The text that you entered is:</div>
              <div className="text-content">{processedText}</div>
            </div>
            <div className="text-row">
              <div className="text-label">Key words in sentence:</div>
              <div className="text-content">
                <ul className="keywords-list">
                  {keywords.map((word, index) => (
                    <li key={index} className={index === currentVideoIndex ? 'highlight' : ''}>{word}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {isLoading && <Typography>Loading...</Typography>}
          {error && <Typography color="error">Error: {error}</Typography>}
        </div>

        <div className="right-panel">
          <h2 align="center">ISL Gestures</h2>
          <div className="video-player-container">
            {allVideosPlayed && (
              <div className="all-videos-played-message">
                <p>All videos played! Click submit to replay from the beginning.</p>
              </div>
            )}
            {videoPaths.length === 0 && (
              <div className="welcome-message">
                <p>Enter text or use speech input to see Indian Sign Language (ISL) gestures.</p>
                <p>Simply type your message and click Submit to get started.</p>
              </div>
            )}
            {videoPaths.length > 0 && (
              <>
                <button className="play-pause-button" onClick={playPause}>Play/Pause</button>
                <video
                  id="videoPlayer"
                  ref={signVideoRef}
                  width="600"
                  height="350"
                  preload="auto"
                  onEnded={handleVideoEnded}
                  controls
                  crossOrigin="anonymous"
                >
                  <source src="" type="video/mp4" />
                  <source src="" type="video/webm" />
                  <source src="" type="video/ogg" />
                  Your browser does not support HTML5 video.
                </video>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToSignPage;