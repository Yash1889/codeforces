import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Avatar,
  LinearProgress,
  useTheme,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Code as CodeIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  OpenInNew as OpenInNewIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from 'axios';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/students');
        setStudents(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching students:', error);
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const getRatingColor = (rating) => {
    if (!rating || rating === 0) return theme.palette.grey[500];
    if (rating < 1200) return '#808080'; // Gray
    if (rating < 1400) return '#008000'; // Green
    if (rating < 1600) return '#03A89E'; // Cyan
    if (rating < 1900) return '#0000FF'; // Blue
    if (rating < 2200) return '#AA00AA'; // Purple
    if (rating < 2400) return '#FF8C00'; // Orange
    return '#FF0000'; // Red
  };

  const getRatingLabel = (rating) => {
    if (!rating || rating === 0) return 'Unrated';
    if (rating < 1200) return 'Newbie';
    if (rating < 1400) return 'Pupil';
    if (rating < 1600) return 'Specialist';
    if (rating < 1900) return 'Expert';
    if (rating < 2200) return 'Candidate Master';
    if (rating < 2400) return 'Master';
    if (rating < 2600) return 'International Master';
    if (rating < 3000) return 'Grandmaster';
    return 'International Grandmaster';
  };

  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;
    try {
      await axios.delete(`http://localhost:5000/api/students/${studentToDelete._id}`);
      setStudents(students.filter(s => s._id !== studentToDelete._id));
    } catch (error) {
      console.error('Error deleting student:', error);
      // Optionally show an error message
    } finally {
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setStudentToDelete(null);
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4,
        mt: 2
      }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Student Progress Dashboard
        </Typography>
        <Button
          component={RouterLink}
          to="/add-student"
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            px: 3,
          }}
        >
          Add Student
        </Button>
      </Box>

      <Grid container spacing={3}>
        {students.map((student) => (
          <Grid item xs={12} sm={6} md={4} key={student._id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: getRatingColor(student.currentRating),
                      width: 48,
                      height: 48,
                      mr: 2
                    }}
                  >
                    {student.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                      {student.name}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      <CodeIcon fontSize="small" />
                      {student.codeforcesHandle}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUpIcon 
                      sx={{ 
                        color: getRatingColor(student.currentRating),
                        mr: 1
                      }} 
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {student.currentRating || 'Unrated'}
                    </Typography>
                    <Chip
                      label={getRatingLabel(student.currentRating)}
                      size="small"
                      sx={{ 
                        ml: 1,
                        backgroundColor: getRatingColor(student.currentRating),
                        color: 'white',
                        fontWeight: 500,
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleIcon sx={{ color: theme.palette.success.main, mr: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {student.problemsSolved} Problems Solved
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 'auto',
                px: 2,
                pb: 2
              }}>
                <Button
                  component={RouterLink}
                  to={`/student/${student._id}`}
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                  }}
                >
                  View Profile
                </Button>
                <Tooltip title="Open Codeforces Profile">
                  <IconButton
                    component="a"
                    href={`https://codeforces.com/profile/${student.codeforcesHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: theme.palette.primary.main }}
                  >
                    <OpenInNewIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Student">
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteClick(student)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
      {deleteDialogOpen && (
        <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
          <DialogTitle>Delete Student</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete <b>{studentToDelete?.name}</b>?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
};

export default StudentList; 