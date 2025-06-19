import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Box,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tabs,
  Tab,
  Button,
  Chip,
  Avatar,
  LinearProgress,
  useTheme,
  IconButton,
  Tooltip,
  Card,
  CardContent,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { BarChart, Bar } from 'recharts';
import SubmissionHeatMap from './SubmissionHeatMap';
import StudentComparison from './StudentComparison';
import ProblemRecommendations from './ProblemRecommendations';
import {
  Code as CodeIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  OpenInNew as OpenInNewIcon,
  ArrowBack as ArrowBackIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  Tag as TagIcon,
  Assessment as AssessmentIcon,
  Compare as CompareIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`student-tabpanel-${index}`}
      aria-labelledby={`student-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const StudentProfile = () => {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [contestFilter, setContestFilter] = useState(180);
  const [problemFilter, setProblemFilter] = useState(30);
  const [comparedUsers, setComparedUsers] = useState([]);
  const theme = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/students/${id}`);
        console.log('Fetched student data:', response.data); // Debug log
        setStudent(response.data);
      } catch (err) {
        console.error('Error fetching student:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [id]);

  // Debug log for submissions
  useEffect(() => {
    if (student?.recentSubmissions) {
      console.log('Recent submissions data:', student.recentSubmissions);
    }
  }, [student]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleContestFilterChange = (days) => {
    setContestFilter(days);
  };

  const handleProblemFilterChange = (days) => {
    setProblemFilter(days);
  };

  // Process tag data for the radar chart
  const processTagData = (submissions) => {
    if (!student?.problemSolvingData?.tagStats) {
      return [];
    }

    return student.problemSolvingData.tagStats
      .sort((a, b) => b.solved - a.solved)
      .slice(0, 8); // Show top 8 tags
  };

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

  const handleRemoveComparedUser = (handle) => {
    // Implement the logic to remove a user from the compared users list
    console.log(`Removing user with handle: ${handle}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const filteredContests = student.contestHistory ? student.contestHistory.filter(
    contest => new Date(contest.date) >= new Date(Date.now() - contestFilter * 24 * 60 * 60 * 1000)
  ) : [];

  const filteredSubmissions = student.recentSubmissions ? student.recentSubmissions.filter(
    submission => new Date(submission.date) >= new Date(Date.now() - problemFilter * 24 * 60 * 60 * 1000)
  ) : [];

  const ratingData = filteredContests.map(contest => ({
    date: new Date(contest.date).toLocaleDateString(),
    rating: contest.newRating,
  }));

  const problemsByRatingData = student.problemSolvingData?.problemsByRating || [];
  const totalSolvedProblems = student.problemsSolved || 0;
  
  // Calculate average rating for solved problems, assuming problemRating exists and is a number
  const solvedProblemsWithRating = filteredSubmissions.filter(s => s.verdict === 'OK' && s.problemRating);
  const averageRating = solvedProblemsWithRating.length > 0 
    ? (solvedProblemsWithRating.reduce((sum, s) => sum + s.problemRating, 0) / solvedProblemsWithRating.length).toFixed(0)
    : 'N/A';

  // Use backend's averagePerDay if available
  const avgProblemsPerDay = student.problemSolvingData?.averagePerDay !== undefined
    ? student.problemSolvingData.averagePerDay
    : 'N/A';

  // Find most difficult problem solved
  const mostDifficultProblem = solvedProblemsWithRating.length > 0
    ? solvedProblemsWithRating.reduce((max, s) => (s.problemRating > max.problemRating ? s : max), solvedProblemsWithRating[0])
    : null;

  // Process tag data
  const tagData = processTagData(filteredSubmissions);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
            p: 3,
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
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md="auto">
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: getRatingColor(student.currentRating),
                  fontSize: '2.5rem',
                }}
              >
                {student.name.charAt(0)}
              </Avatar>
            </Grid>
            <Grid item xs={12} md>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  {student.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: 0.5,
                      color: 'text.secondary'
                    }}
                  >
                    <CodeIcon fontSize="small" />
                    {student.codeforcesHandle}
                  </Typography>
                  <Tooltip title="Open Codeforces Profile">
                    <IconButton
                      component="a"
                      href={`https://codeforces.com/profile/${student.codeforcesHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<TrendingUpIcon />}
                    label={`Rating: ${student.currentRating || 'Unrated'}`}
                    sx={{
                      backgroundColor: getRatingColor(student.currentRating),
                      color: 'white',
                      fontWeight: 500,
                    }}
                  />
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={`${student.problemsSolved} Problems Solved`}
                    sx={{
                      backgroundColor: theme.palette.success.main,
                      color: 'white',
                      fontWeight: 500,
                    }}
                  />
                  <Chip
                    label={getRatingLabel(student.currentRating)}
                    sx={{
                      backgroundColor: getRatingColor(student.currentRating),
                      color: 'white',
                      fontWeight: 500,
                    }}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Problem Solving Stats */}
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2, maxHeight: 475, overflow: 'auto' }}>
              <Typography variant="h5" gutterBottom>
                Problem Solving Stats
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Average Problems per Day
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {avgProblemsPerDay}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Tag Statistics
                </Typography>
                {student.problemSolvingData?.tagStats?.map((tag, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">
                        {tag.tag}
                      </Typography>
                      <Typography variant="body2">
                        {tag.solved}/{tag.attempted} ({tag.attempted > 0 ? tag.successRate : 'N/A'})
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={tag.successRate}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.1)' 
                          : 'rgba(0, 0, 0, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: tag.successRate >= 50 
                            ? theme.palette.success.main 
                            : theme.palette.error.main,
                        },
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Recent Submissions */}
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h5" gutterBottom>
                Recent Submissions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {student.recentSubmissions?.slice(0, 10).map((submission, index) => (
                  <Box 
                    key={index}
                    sx={{
                      p: 1.5,
                      mb: 1,
                      borderRadius: 1,
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.08)' 
                          : 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                        {submission.problem.name}
                      </Typography>
                      <Chip
                        label={submission.verdict}
                        size="small"
                        sx={{
                          backgroundColor: submission.verdict === 'OK' 
                            ? theme.palette.success.main 
                            : theme.palette.error.main,
                          color: 'white',
                          fontWeight: 500,
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        size="small"
                        label={`Rating: ${submission.problem.rating}`}
                        sx={{
                          backgroundColor: getRatingColor(submission.problem.rating),
                          color: 'white',
                        }}
                      />
                      {submission.problem.tags.map((tag, tagIndex) => (
                        <Chip
                          key={tagIndex}
                          size="small"
                          icon={<TagIcon />}
                          label={tag}
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="student profile tabs">
            <Tab icon={<TimelineIcon />} label="Progress" />
            <Tab icon={<CodeIcon />} label="Problem Solving" />
            <Tab icon={<AssessmentIcon />} label="Recommendations" />
            <Tab icon={<CompareIcon />} label="Comparison" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ mt: 3 }}>
              <Typography variant="h5" gutterBottom>Contest History</Typography>
              <Box sx={{ mb: 2 }}>
                <Button variant={contestFilter === 30 ? 'contained' : 'outlined'} onClick={() => handleContestFilterChange(30)} sx={{ mr: 1 }}>30 Days</Button>
                <Button variant={contestFilter === 90 ? 'contained' : 'outlined'} onClick={() => handleContestFilterChange(90)} sx={{ mr: 1 }}>90 Days</Button>
                <Button variant={contestFilter === 365 ? 'contained' : 'outlined'} onClick={() => handleContestFilterChange(365)}>365 Days</Button>
              </Box>
              
              {ratingData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={ratingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="rating" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Typography>No contest history available for the selected period.</Typography>
              )}

              <Typography variant="h6" sx={{ mt: 3 }}>Recent Contests</Typography>
              {filteredContests.length > 0 ? (
                <List>
                  {filteredContests.map((contest, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={contest.contestName}
                        secondary={`Rank: ${contest.rank} | Rating Change: ${contest.newRating - contest.oldRating} | Old Rating: ${contest.oldRating} | New Rating: ${contest.newRating}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography>No recent contests found for the selected period.</Typography>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mt: 3 }}>
              <Typography variant="h5" gutterBottom>Problem Solving Data</Typography>
              <Box sx={{ mb: 2 }}>
                <Button variant={problemFilter === 7 ? 'contained' : 'outlined'} onClick={() => handleProblemFilterChange(7)} sx={{ mr: 1 }}>7 Days</Button>
                <Button variant={problemFilter === 30 ? 'contained' : 'outlined'} onClick={() => handleProblemFilterChange(30)} sx={{ mr: 1 }}>30 Days</Button>
                <Button variant={problemFilter === 90 ? 'contained' : 'outlined'} onClick={() => handleProblemFilterChange(90)}>90 Days</Button>
              </Box>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="subtitle1">Total Solved</Typography>
                    <Typography variant="h6">{totalSolvedProblems}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="subtitle1">Average Rating</Typography>
                    <Typography variant="h6">{averageRating}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="subtitle1">Avg Problems/Day</Typography>
                    <Typography variant="h6">{avgProblemsPerDay}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="subtitle1">Most Difficult Solved</Typography>
                    <Typography variant="h6">{mostDifficultProblem ? `${mostDifficultProblem.problemName} (${mostDifficultProblem.problemRating})` : 'N/A'}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Problem Tags Analysis */}
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Problem Tags Analysis</Typography>
              {tagData.length > 0 ? (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle1" gutterBottom>Tag Distribution</Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={tagData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="tag" />
                          <PolarRadiusAxis />
                          <Radar
                            name="Solved"
                            dataKey="solved"
                            stroke="#8884d8"
                            fill="#8884d8"
                            fillOpacity={0.6}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle1" gutterBottom>Tag Statistics</Typography>
                      <List>
                        {tagData.map((tag, index) => (
                          <ListItem key={index} divider>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Chip label={tag.tag} size="small" />
                                  <Typography variant="body2" color="text.secondary">
                                    {tag.successRate}% success rate
                                  </Typography>
                                </Box>
                              }
                              secondary={`${tag.solved} solved out of ${tag.attempted} attempts`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </Grid>
                </Grid>
              ) : (
                <Typography color="textSecondary">
                  No tag data available for the selected period.
                </Typography>
              )}

              <Typography variant="h6" sx={{ mt: 3 }}>Problems Solved by Rating</Typography>
              {problemsByRatingData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={problemsByRatingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rating" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography>No problem solving data by rating available for the selected period.</Typography>
              )}

              <Typography variant="h6" sx={{ mt: 3 }}>Recent Submissions</Typography>
              {filteredSubmissions.length > 0 ? (
                <List>
                  {filteredSubmissions.map((submission, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={submission.problemName}
                        secondary={`Verdict: ${submission.verdict} | Rating: ${submission.problemRating || 'N/A'}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="textSecondary">
                  No recent submissions found for the selected period.
                </Typography>
              )}

              {/* Submission Heat Map */}
              <SubmissionHeatMap 
                submissions={student.recentSubmissions || []} 
                key={student.recentSubmissions?.length}
              />

              {/* Add Student Comparison */}
              <StudentComparison currentStudent={student} />

              {/* Add Problem Recommendations */}
              <ProblemRecommendations student={student} />
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <ProblemRecommendations student={student} />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <StudentComparison currentStudent={student} />
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
};

export default StudentProfile; 