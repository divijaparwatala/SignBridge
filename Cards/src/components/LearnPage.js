import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, Button, Paper, Grid } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const LearnPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [wordsData, setWordsData] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [currentVideo, setCurrentVideo] = useState('');
  const [currentWord, setCurrentWord] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // Fetch the JSON data from the public folder
    fetch('/isl_words_data.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => setWordsData(data))
      .catch(error => console.error("Could not fetch ISL words data:", error));
  }, []);

  const handleSearch = () => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      setCurrentVideo('');
      setCurrentWord('');
      setHasSearched(false);
      return;
    }
    
    const filtered = wordsData.filter(item =>
      item.word.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchResults(filtered);
    setCurrentVideo(''); // Clear previous video when new search
    setCurrentWord('');
    setHasSearched(true);
  };

  const playVideo = (videoFile, word) => {
    setCurrentVideo(`/isl_videos/${videoFile}`);
    setCurrentWord(word);
    
    // Use setTimeout to ensure the video element is updated before trying to play
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.load();
        videoRef.current.play().catch(error => {
          console.warn('Autoplay blocked:', error);
          // If autoplay is blocked, at least ensure the video is loaded and ready
          videoRef.current.load();
        });
      }
    }, 100); // Small delay to ensure state update
  };

  // Reset hasSearched when searchTerm changes
  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value.trim() === '') {
      setHasSearched(false);
      setSearchResults([]);
      setCurrentVideo('');
      setCurrentWord('');
    }
  };

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
          ISL WORDBANK
        </Typography>
      </Box>

      {/* Content Container */}
      <Box sx={{ padding: '0 20px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={9}>
              <TextField
                fullWidth
                label="Search ISL Word"
                variant="outlined"
                value={searchTerm}
                onChange={handleSearchTermChange}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                sx={{ height: '56px' }}
              >
                Search
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {searchResults.length > 0 && (
          <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                color: '#1976d2', 
                fontWeight: 'bold',
                mb: 2 
              }}
            >
              Search Results:
            </Typography>
            <Grid container spacing={2}>
              {searchResults.map((result, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper 
                    elevation={2} 
                    sx={{ 
                      p: 2, 
                      backgroundColor: '#ffffff',
                      border: '2px solid #e0e0e0',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                        border: '2px solid #1976d2',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }
                    }}
                  >
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => playVideo(result.video_file, result.word)}
                      sx={{
                        backgroundColor: '#1976d2',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        '&:hover': {
                          backgroundColor: '#1565c0'
                        }
                      }}
                    >
                      {result.word}
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {/* Only show "No results found" if a search has been performed AND no results found */}
        {hasSearched && searchResults.length === 0 && searchTerm.trim() !== '' && (
          <Paper elevation={2} sx={{ p: 3, backgroundColor: 'rgba(255, 255, 255, 0.9)', textAlign: 'center' }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#d32f2f',
                fontWeight: 'bold'
              }}
            >
              No results found for "{searchTerm}".
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#666666',
                mt: 1
              }}
            >
              Try searching with different keywords or check your spelling.
            </Typography>
          </Paper>
        )}

        {/* Single Video Player */}
        {currentVideo && ( 
          <Paper elevation={3} sx={{ p: 3, backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography 
                variant="h5" 
                gutterBottom 
                sx={{ 
                  color: '#1976d2',
                  fontWeight: 'bold',
                  mb: 2
                }}
              >
                Playing: {currentWord}
              </Typography>
              <Box sx={{ 
                backgroundColor: '#000000',
                borderRadius: '12px',
                padding: '8px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}>
                <video 
                  ref={videoRef}
                  width="100%" 
                  controls 
                  style={{ 
                    maxWidth: '640px',
                    borderRadius: '8px'
                  }}
                >
                  <source src={currentVideo} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </Box>
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default LearnPage;