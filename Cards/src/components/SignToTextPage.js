import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import './SignToTextPage.css';

function SignToTextPage() {
  const webcamRef = useRef(null);
  const [currentSymbol, setCurrentSymbol] = useState('C');
  const [sentence, setSentence] = useState('');
  const [suggestions, setSuggestions] = useState(['', '', '', '']);
  const [wordSuggestions, setWordSuggestions] = useState(['', '', '', '']);
  const [skeletalImage, setSkeletalImage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    let interval;
    
    if (isStreaming) {
      interval = setInterval(() => {
        captureAndPredict();
      }, 500);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming]);

  const captureAndPredict = async () => {
    if (!webcamRef.current || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      const response = await axios.post('http://localhost:5000/predict', {
        image: imageSrc
      });

      if (response.data.success) {
        setCurrentSymbol(response.data.current_symbol || 'C');
        setSuggestions(response.data.suggestions || ['', '', '', '']);
        setWordSuggestions(response.data.word_suggestions || ['', '', '', '']);
        setSentence(response.data.sentence || '');
        
        if (response.data.skeletal_image) {
          setSkeletalImage(response.data.skeletal_image);
        }
      }
    } catch (error) {
      console.error('Error predicting:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    if (suggestion && suggestion.trim() !== '' && suggestion.trim() !== ' ') {
      try {
        const response = await axios.post('http://localhost:5000/add_suggestion', {
          suggestion: suggestion
        });
        
        if (response.data.success) {
          setSentence(response.data.sentence);
        }
      } catch (error) {
        console.error('Error adding suggestion:', error);
        // Fallback: update locally if API fails
        setSentence(prev => prev + suggestion);
      }
    }
  };

  const handleWordSuggestionClick = async (word) => {
    if (word && word.trim() !== '' && word.trim() !== ' ') {
      try {
        const response = await axios.post('http://localhost:5000/add_word_suggestion', {
          word: word
        });
        
        if (response.data.success) {
          setSentence(response.data.sentence);
        }
      } catch (error) {
        console.error('Error adding word suggestion:', error);
        // Fallback: update locally if API fails
        const words = sentence.trim().split(' ');
        if (words.length > 0) {
          words[words.length - 1] = word.toUpperCase();
          setSentence(words.join(' ') + ' ');
        } else {
          setSentence(word.toUpperCase() + ' ');
        }
      }
    }
  };

  const handleClear = async () => {
    try {
      const response = await axios.post('http://localhost:5000/clear_sentence');
      
      if (response.data.success) {
        setSentence(response.data.sentence);
        setCurrentSymbol('C');
        setSuggestions(['', '', '', '']);
        setWordSuggestions(['', '', '', '']);
      }
    } catch (error) {
      console.error('Error clearing sentence:', error);
      // Fallback: update locally if API fails
      setSentence('');
      setCurrentSymbol('C');
      setSuggestions(['', '', '', '']);
      setWordSuggestions(['', '', '', '']);
    }
  };

  const handleBackspace = async () => {
    try {
      const response = await axios.post('http://localhost:5000/delete_last_char');
      
      if (response.data.success) {
        setSentence(response.data.sentence);
      }
    } catch (error) {
      console.error('Error deleting character:', error);
      // Fallback: update locally if API fails
      setSentence(prev => prev.slice(0, -1));
    }
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window && sentence.trim()) {
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const toggleStreaming = () => {
    setIsStreaming(!isStreaming);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>SIGNABET</h1>
      </header>
      
      <div className="main-content">
        <div className="video-section">
          <div className="video-container">
            <div className="camera-feed">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  width: 1280,
                  height: 720,
                  facingMode: "user"
                }}
                style={{
                  transform: 'scaleX(-1)'
                }}
              />
            </div>
            
            <div className="hand-detection">
              {skeletalImage ? (
                <img src={skeletalImage} alt="Hand Detection" />
              ) : (
                <div className="no-detection">No hand detected</div>
              )}
            </div>
          </div>
          
          <div className="camera-controls">
            <button 
              onClick={toggleStreaming}
              className={`btn ${isStreaming ? 'btn-danger' : 'btn-primary'}`}
            >
              {isStreaming ? '⏹️ Stop Detection' : '▶️ Start Detection'}
            </button>
          </div>
        </div>
        
        <div className="prediction-section">
          <div className="current-symbol">
            <div className="symbol-display">{currentSymbol || 'C'}</div>
          </div>
          
          <div className="sentence-display">
            <h3>Sentence:</h3>
            <div className="sentence-box">
              {sentence || 'Start signing to build your sentence...'}
            </div>
          </div>
          
          <div className="suggestions">
            <h3>Letter Suggestions:</h3>
            <div className="suggestion-buttons">
              {suggestions.map((suggestion, index) => (
                <button 
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="suggestion-btn"
                  disabled={!suggestion || suggestion.trim() === '' || suggestion.trim() === ' '}
                >
                  {suggestion && suggestion.trim() !== ' ' ? suggestion : '-'}
                </button>
              ))}
            </div>
          </div>
          
          <div className="word-suggestions">
            <h3>Word Suggestions:</h3>
            <div className="suggestion-buttons">
              {wordSuggestions.map((word, index) => (
                <button 
                  key={index}
                  onClick={() => handleWordSuggestionClick(word)}
                  className="suggestion-btn word-btn"
                  disabled={!word || word.trim() === '' || word.trim() === ' '}
                >
                  {word && word.trim() !== ' ' ? word : '-'}
                </button>
              ))}
            </div>
          </div>
          
          <div className="controls">
            <button onClick={handleSpeak} className="btn btn-success">
              🔊 Speak
            </button>
            <button onClick={handleBackspace} className="btn btn-warning">
              ⌫ Backspace
            </button>
            <button onClick={handleClear} className="btn btn-secondary">
              🗑️ Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignToTextPage;