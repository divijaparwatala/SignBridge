import React from 'react';
import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import TranslateIcon from '@mui/icons-material/Translate';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';

const HomePage = () => {
  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#333'
    }}>
      {/* Header Section */}
      <Box sx={{ 
        textAlign: 'center',
        padding: '60px 20px 80px 20px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(15px)',
        marginBottom: '50px',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
      }}>
        <Typography variant="h1" className="signbridge-heading" sx={{
          color: 'white',
          fontWeight: 700,
          margin: 0,
          textShadow: '3px 3px 12px rgba(0, 0, 0, 0.4)',
          letterSpacing: '3px',
          mb: 3,
          fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' }
        }}>
          SignBridge
        </Typography>
        <Typography variant="h4" sx={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontWeight: 300,
          textShadow: '2px 2px 6px rgba(0, 0, 0, 0.3)',
          letterSpacing: '2px',
          fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2rem' },
          maxWidth: '800px', // Increased width to keep text on single line
          margin: '0 auto',
          lineHeight: 1.3,
          whiteSpace: 'nowrap', // Prevent line breaking
          overflow: 'hidden', // Hide overflow if needed
          textOverflow: 'ellipsis' // Add ellipsis if text is too long
        }}>
          Bridging Communication Through Sign Language
        </Typography>
      </Box>

      {/* Content Container */}
      <Box sx={{ padding: '0 20px 40px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Welcome Section */}
        <Paper elevation={3} sx={{ 
          p: 5,
          mb: 5,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '25px',
          textAlign: 'center'
        }}>
          <Typography variant="h3" sx={{
            color: '#1976d2',
            fontWeight: 'bold',
            mb: 3,
            fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' }
          }}>
            Welcome to Inclusive and Interactive Sign Language Communication
          </Typography>
          <Typography variant="body1" sx={{
            color: '#666',
            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.3rem' },
            lineHeight: 1.7,
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            Experience Indian Sign Language (ISL) technology  with features like alphabet recognition, 
            text-to-sign conversion,interactive cards and an ISL dictionary—all in one platform.
          </Typography>
        </Paper>

        {/* Features Grid - Now with 5 features */}
        <Grid container spacing={4}>
          
          {/* ISL Cards Feature */}
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Paper elevation={4} sx={{
              p: 4,
              height: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 12px 35px rgba(0,0,0,0.25)'
              }
            }}>
              <SignalCellularAltIcon sx={{ 
                fontSize: '4rem',
                color: '#1976d2', 
                mb: 3 
              }} />
              <Typography variant="h5" sx={{
                fontWeight: 'bold', 
                mb: 2,
                color: '#1976d2'
              }}>
                ISL Clickboard
              </Typography>
              <Typography variant="body1" sx={{
                color: '#666', 
                mb: 3,
                lineHeight: 1.6
              }}>
                Build sentences using interactive alphabet and number cards with instant translation.
              </Typography>
              <Button 
                component={Link} 
                to="/isl-cards"
                variant="contained"
                size="large"
                sx={{ 
                  backgroundColor: '#1976d2',
                  padding: '12px 24px',
                  fontSize: '1rem',
                  '&:hover': { backgroundColor: '#1565c0' }
                }}
              >
                Try ISL Cards
              </Button>
            </Paper>
          </Grid>

          {/* Sign to Text Feature */}
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Paper elevation={4} sx={{
              p: 4,
              height: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 12px 35px rgba(0,0,0,0.25)'
              }
            }}>
              <SmartToyIcon sx={{ 
                fontSize: '4rem', 
                color: '#28a745', 
                mb: 3 
              }} />
              <Typography variant="h5" sx={{
                fontWeight: 'bold', 
                mb: 2,
                color: '#28a745'
              }}>
                Signabet
              </Typography>
              <Typography variant="body1" sx={{
                color: '#666', 
                mb: 3,
                lineHeight: 1.6
              }}>
                Real-time sign language recognition using AI. Convert hand gestures to text instantly.
              </Typography>
              <Button 
                component={Link} 
                to="/sign-to-text"
                variant="contained"
                size="large"
                sx={{ 
                  backgroundColor: '#28a745',
                  padding: '12px 24px',
                  fontSize: '1rem',
                  '&:hover': { backgroundColor: '#218838' }
                }}
              >
                Start Recognition
              </Button>
            </Paper>
          </Grid>

          {/* Text to Sign Feature - Updated name */}
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Paper elevation={4} sx={{
              p: 4,
              height: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 12px 35px rgba(0,0,0,0.25)'
              }
            }}>
              <RecordVoiceOverIcon sx={{ 
                fontSize: '4rem', 
                color: '#6f42c1', 
                mb: 3 
              }} />
              <Typography variant="h5" sx={{
                fontWeight: 'bold', 
                mb: 3,
                color: '#6f42c1'
              }}>
                VoiceText
                2
                Sign
              </Typography>
              <Typography variant="body1" sx={{
                color: '#666', 
                mb: 3,
                lineHeight: 1.6
              }}>
                Convert text or speech input into sign language videos for easy learning and communication.
              </Typography>
              <Button 
                component={Link} 
                to="/text-to-sign"
                variant="contained"
                size="large"
                sx={{ 
                  backgroundColor: '#6f42c1',
                  padding: '12px 24px',
                  fontSize: '1rem',
                  '&:hover': { backgroundColor: '#5a2d91' }
                }}
              >
                Convert Text
              </Button>
            </Paper>
          </Grid>

          {/* Learn ISL Feature */}
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Paper elevation={4} sx={{
              p: 4,
              height: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 12px 35px rgba(0,0,0,0.25)'
              }
            }}>
              <PlayCircleOutlineIcon sx={{ 
                fontSize: '4rem', 
                color: '#dc3545', 
                mb: 3 
              }} />
              <Typography variant="h5" sx={{
                fontWeight: 'bold', 
                mb: 2,
                color: '#dc3545'
              }}>
                ISL Wordbank
              </Typography>
              <Typography variant="body1" sx={{
                color: '#666', 
                mb: 3,
                lineHeight: 1.6
              }}>
                Search and learn from thousands of ISL words with video demonstrations.
              </Typography>
              <Button 
                component={Link} 
                to="/learn"
                variant="contained"
                size="large"
                sx={{ 
                  backgroundColor: '#dc3545',
                  padding: '12px 24px',
                  fontSize: '1rem',
                  '&:hover': { backgroundColor: '#c82333' }
                }}
              >
                Explore Videos
              </Button>
            </Paper>
          </Grid>

          {/* Translation Feature */}
          <Grid item xs={12} sm={6} md={4} lg={2.4}>
            <Paper elevation={4} sx={{
              p: 4,
              height: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 12px 35px rgba(0,0,0,0.25)'
              }
            }}>
              <TranslateIcon sx={{ 
                fontSize: '4rem', 
                color: '#fd7e14', 
                mb: 3 
              }} />
              <Typography variant="h5" sx={{
                fontWeight: 'bold', 
                mb: 2,
                color: '#fd7e14'
              }}>
                Multi-Language
              </Typography>
              <Typography variant="body1" sx={{
                color: '#666', 
                mb: 3,
                lineHeight: 1.6
              }}>
                Translate sentences to 14+ Indian languages including Hindi, Tamil, Telugu, Bengali.
              </Typography>
              <Button 
                component={Link} 
                to="/isl-cards"
                variant="contained"
                size="large"
                sx={{ 
                  backgroundColor: '#fd7e14',
                  padding: '12px 24px',
                  fontSize: '1rem',
                  '&:hover': { backgroundColor: '#e8590c' }
                }}
              >
                Start Translating
              </Button>
            </Paper>
          </Grid>

        </Grid>

        {/* Getting Started Section */}
        <Paper elevation={4} sx={{ 
          p: 5, 
          mt: 5, 
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '25px'
        }}>
          <Typography variant="h4" sx={{
            color: '#1976d2',
            fontWeight: 'bold',
            mb: 4,
            textAlign: 'center'
          }}>
            Get Started in 3 Easy Steps
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" sx={{ 
                  color: '#1976d2', 
                  fontWeight: 'bold',
                  mb: 2
                }}>
                  1
                </Typography>
                <Typography variant="h5" sx={{ 
                  fontWeight: 'bold', 
                  mb: 2 
                }}>
                  Choose Your Tool
                </Typography>
                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>
                  Select from ISL Cards, Signabet recognition, Text2Sign conversion, or ISL Wordbank learning
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" sx={{ 
                  color: '#28a745', 
                  fontWeight: 'bold',
                  mb: 2
                }}>
                  2
                </Typography>
                <Typography variant="h5" sx={{ 
                  fontWeight: 'bold', 
                  mb: 2 
                }}>
                  Create or Learn
                </Typography>
                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>
                  Build sentences, recognize signs, convert text to videos, or watch educational content
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h2" sx={{ 
                  color: '#dc3545', 
                  fontWeight: 'bold',
                  mb: 2
                }}>
                  3
                </Typography>
                <Typography variant="h5" sx={{ 
                  fontWeight: 'bold', 
                  mb: 2 
                }}>
                  Communicate
                </Typography>
                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>
                  Listen to translations and enhance your sign language communication skills
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

      </Box>
    </Box>
  );
};

export default HomePage;