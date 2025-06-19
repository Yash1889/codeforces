import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  useTheme,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Code as CodeIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const steps = ['Basic Information', 'Codeforces Handle', 'Confirmation'];

const AddStudent = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    codeforcesHandle: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [handleStatus, setHandleStatus] = useState(null);
  const theme = useTheme();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (name === 'codeforcesHandle') {
      setHandleStatus(null);
    }
  };

  const checkHandle = async () => {
    if (!formData.codeforcesHandle) return;
    
    setLoading(true);
    setHandleStatus(null);
    try {
      const response = await axios.get(`https://codeforces.com/api/user.info?handles=${formData.codeforcesHandle}`);
      if (response.data.status === 'OK') {
        setHandleStatus('valid');
        setError('');
      } else {
        setHandleStatus('invalid');
        setError('Invalid Codeforces handle');
      }
    } catch (error) {
      setHandleStatus('invalid');
      setError('Invalid Codeforces handle');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_BASE_URL}/students`, formData);
      if (formData.codeforcesHandle) {
        await axios.post(`${API_BASE_URL}/students/sync/handle/${formData.codeforcesHandle}`);
      }
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Error adding student');
    }
    setLoading(false);
  };

  const handleNext = () => {
    if (activeStep === 1 && handleStatus !== 'valid') {
      setError('Please verify your Codeforces handle first');
      return;
    }
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              type="email"
              sx={{ mb: 3 }}
            />
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!formData.name || !formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)}
              sx={{ textTransform: 'none' }}
            >
              Next
            </Button>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              label="Codeforces Handle"
              name="codeforcesHandle"
              value={formData.codeforcesHandle}
              onChange={handleChange}
              required
              error={handleStatus === 'invalid'}
              helperText={handleStatus === 'invalid' ? 'Invalid handle' : ''}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CodeIcon color="primary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {loading ? (
                      <CircularProgress size={20} />
                    ) : handleStatus === 'valid' ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <IconButton
                        onClick={checkHandle}
                        disabled={!formData.codeforcesHandle}
                        size="small"
                      >
                        <InfoIcon />
                      </IconButton>
                    )}
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleBack}
                sx={{ textTransform: 'none' }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={handleStatus !== 'valid'}
                sx={{ textTransform: 'none' }}
              >
                Next
              </Button>
            </Box>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.02)',
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" gutterBottom>
                Confirm Details
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <PersonIcon color="primary" />
                <Typography>
                  <strong>Name:</strong> {formData.name}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <CodeIcon color="primary" />
                <Typography>
                  <strong>Codeforces Handle:</strong> {formData.codeforcesHandle}
                </Typography>
              </Box>
            </Paper>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleBack}
                sx={{ textTransform: 'none' }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                sx={{ textTransform: 'none' }}
              >
                {loading ? <CircularProgress size={24} /> : 'Add Student'}
              </Button>
            </Box>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 2, mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 3, textTransform: 'none' }}
        >
          Back to Dashboard
        </Button>

        <Paper 
          elevation={0}
          sx={{ 
            p: 4,
            borderRadius: 2,
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(45deg, rgba(15,23,42,0.8) 30%, rgba(30,41,59,0.8) 90%)'
              : 'linear-gradient(45deg, rgba(255,255,255,0.8) 30%, rgba(248,250,252,0.8) 90%)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${
              theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(0, 0, 0, 0.1)'
            }`,
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Add New Student
          </Typography>

          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
              icon={<ErrorIcon />}
            >
              {error}
            </Alert>
          )}

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {getStepContent(activeStep)}
        </Paper>
      </Box>
    </Container>
  );
};

export default AddStudent; 