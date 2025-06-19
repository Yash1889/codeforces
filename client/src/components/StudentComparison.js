import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  useTheme,
  Tabs,
  Tab,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  EmojiEvents as EmojiEventsIcon,
  Code as CodeIcon,
  Add as AddIcon,
  Close as CloseIcon,
  CompareArrows as CompareArrowsIcon,
  Assessment as AssessmentIcon,
  LocalOffer as TagIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const StudentComparison = ({ student }) => {
  const [comparisonHandles, setComparisonHandles] = useState([]);
  const [newHandle, setNewHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [comparisonData, setComparisonData] = useState([]);
  const [ratingHistory, setRatingHistory] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [problemStats, setProblemStats] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    if (!student && comparisonHandles.length === 0) return;
    const handles = student && student.codeforcesHandle
      ? [student.codeforcesHandle, ...comparisonHandles]
      : comparisonHandles;
    if (handles.length === 0) return;
    const fetchAllData = async () => {
      console.log('Starting data fetch for handles:', handles);
      setLoading(true);
      setError('');
      try {
        const userData = await Promise.all(handles.map(fetchUserData));
        console.log('All user data fetched:', userData);
        if (userData.length > 0) setProblemStats(userData[0]);
        const comparisonResults = userData.map((user, idx) => ({
          handle: user.handle,
          rating: user.rating,
          maxRating: user.maxRating,
          rank: user.rank,
          solvedCount: user.solvedCount,
          ratingDiff: student && userData[0] ? user.rating - userData[0].rating : 0,
          problemsDiff: student && userData[0] ? user.solvedCount - userData[0].solvedCount : 0,
          averagePerDay: user.averagePerDay,
          tagStats: user.tagStats,
        }));
        console.log('Processed comparison data:', comparisonResults);
        setComparisonData(comparisonResults);
        const combinedHistory = [];
        userData.forEach(user => {
          user.ratingHistory.forEach(entry => {
            combinedHistory.push({
              handle: user.handle,
              date: entry.date,
              rating: entry.newRating,
              ratingChange: entry.ratingChange,
              contestName: entry.contestName,
            });
          });
        });
        const sortedHistory = combinedHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
        console.log('Processed rating history:', sortedHistory);
        setRatingHistory(sortedHistory);
      } catch (error) {
        console.error('Error in fetchAllData:', error);
        setError('Failed to fetch comparison data');
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [student, comparisonHandles]);

  const fetchUserData = async (handle) => {
    try {
      console.log('Fetching data for handle:', handle);
      const [userInfo, ratingData, submissions] = await Promise.all([
        axios.get(`${API_BASE_URL}/codeforces/user/${handle}`),
        axios.get(`${API_BASE_URL}/codeforces/rating/${handle}`),
        axios.get(`${API_BASE_URL}/codeforces/submissions/${handle}`),
      ]);

      console.log('API responses:', {
        userInfo: userInfo.data,
        ratingData: ratingData.data,
        submissions: submissions.data
      });

      // Validate responses
      if (userInfo.data.status !== 'OK' || !userInfo.data.result?.[0]) {
        throw new Error(userInfo.data.comment || 'Invalid user handle');
      }

      if (ratingData.data.status !== 'OK') {
        throw new Error(ratingData.data.comment || 'Failed to fetch rating history');
      }

      if (submissions.data.status !== 'OK') {
        throw new Error(submissions.data.comment || 'Failed to fetch submissions');
      }

      const userData = userInfo.data.result[0];
      const ratingHistory = ratingData.data.result;
      const submissionData = submissions.data.result;

      console.log('Processed data:', {
        userData,
        ratingHistory,
        submissionData: submissionData.length
      });

      // Calculate solved problems and tag statistics
      const solvedProblems = new Set();
      const tagStats = new Map();
      const tagAttempts = new Map();

      submissionData.forEach(submission => {
        const problemId = `${submission.problem.contestId}${submission.problem.index}`;
        
        submission.problem.tags.forEach(tag => {
          tagAttempts.set(tag, (tagAttempts.get(tag) || 0) + 1);
          if (submission.verdict === 'OK') {
            tagStats.set(tag, (tagStats.get(tag) || 0) + 1);
          }
        });

        if (submission.verdict === 'OK') {
          solvedProblems.add(problemId);
        }
      });

      // Calculate average problems per day
      const firstSubmission = submissionData[submissionData.length - 1]?.creationTimeSeconds || Date.now() / 1000;
      const daysSinceFirst = Math.ceil((Date.now() / 1000 - firstSubmission) / (24 * 60 * 60));
      const averagePerDay = solvedProblems.size / Math.max(1, daysSinceFirst);

      // Process tag statistics
      const processedTagStats = Array.from(tagAttempts.entries())
        .map(([tag, attempts]) => ({
          tag,
          solved: tagStats.get(tag) || 0,
          total: attempts,
          successRate: ((tagStats.get(tag) || 0) / attempts * 100).toFixed(1)
        }))
        .sort((a, b) => b.solved - a.solved);

      const result = {
        handle: userData.handle,
        rating: userData.rating || 0,
        maxRating: userData.maxRating || 0,
        rank: userData.rank || 'unrated',
        solvedCount: solvedProblems.size,
        averagePerDay,
        tagStats: processedTagStats,
        ratingHistory: ratingHistory.map(entry => ({
          contestId: entry.contestId,
          contestName: entry.contestName,
          rank: entry.rank,
          ratingChange: entry.newRating - entry.oldRating,
          oldRating: entry.oldRating,
          newRating: entry.newRating,
          date: format(new Date(entry.ratingUpdateTimeSeconds * 1000), 'yyyy-MM-dd'),
        })),
      };

      console.log('Final processed user data:', result);
      return result;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw new Error(error.response?.data?.comment || error.message || `Failed to fetch data for handle: ${handle}`);
    }
  };

  const addComparisonHandle = async (e) => {
    e.preventDefault();
    const trimmedHandle = newHandle.trim();
    
    if (!trimmedHandle) {
      setError('Please enter a handle');
      return;
    }

    // Check if handle already exists (case-insensitive)
    const normalizedHandle = trimmedHandle.toLowerCase();
    if (student?.codeforcesHandle?.toLowerCase() === normalizedHandle || 
        comparisonHandles.some(h => h.toLowerCase() === normalizedHandle)) {
      setError('This handle is already added for comparison');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await fetchUserData(trimmedHandle);
      setComparisonHandles([...comparisonHandles, trimmedHandle]);
      setNewHandle('');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeComparisonHandle = (handle) => {
    setComparisonHandles(comparisonHandles.filter(h => h.toLowerCase() !== handle.toLowerCase()));
  };

  const getRankColor = (rank) => {
    const rankColors = {
      'newbie': theme.palette.rating.newbie,
      'pupil': theme.palette.rating.pupil,
      'specialist': theme.palette.rating.specialist,
      'expert': theme.palette.rating.expert,
      'candidate master': theme.palette.rating.candidateMaster,
      'master': theme.palette.rating.master,
      'international master': theme.palette.rating.master,
      'grandmaster': theme.palette.rating.grandmaster,
      'international grandmaster': theme.palette.rating.grandmaster,
      'legendary grandmaster': theme.palette.rating.grandmaster,
    };
    return rankColors[rank?.toLowerCase()] || theme.palette.grey[500];
  };

  // Helper for progress bar color
  const getTagBarColor = (successRate) => {
    const rate = parseFloat(successRate);
    if (rate < 50) return theme.palette.error.main;
    if (rate < 70) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <CompareArrowsIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h6">
              Compare with Other Users
            </Typography>
          </Box>

          <form onSubmit={addComparisonHandle}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                size="small"
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                placeholder="Enter Codeforces handle"
                InputProps={{
                  endAdornment: (
                    <IconButton 
                      size="small" 
                      type="submit"
                      disabled={loading || !newHandle.trim()}
                    >
                      <AddIcon />
                    </IconButton>
                  ),
                }}
              />
            </Box>
          </form>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Fetching data from Codeforces...
                </Typography>
              </Box>
            </Box>
          )}

          {!loading && error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && (
            <>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
              >
                <Tab 
                  icon={<TrendingUpIcon />} 
                  iconPosition="start" 
                  label="Rating History" 
                />
                <Tab 
                  icon={<AssessmentIcon />} 
                  iconPosition="start" 
                  label="Comparison Stats" 
                />
                <Tab 
                  icon={<TagIcon />} 
                  iconPosition="start" 
                  label="Problem Stats" 
                />
              </Tabs>

              {activeTab === 0 && (
                <Box>
                  {ratingHistory.length > 0 ? (
                    <Paper sx={{ p: 2, height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={ratingHistory}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            interval="preserveStartEnd"
                          />
                          <YAxis 
                            domain={['dataMin - 100', 'dataMax + 100']}
                            tick={{ fontSize: 12 }}
                          />
                          <RechartsTooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <Paper sx={{ p: 1.5, boxShadow: theme.shadows[3] }}>
                                    <Typography variant="subtitle2">
                                      {label}
                                    </Typography>
                                    {payload.map((entry, index) => (
                                      <Box key={index} sx={{ mt: 1 }}>
                                        <Typography 
                                          variant="body2" 
                                          sx={{ color: entry.color, fontWeight: 500 }}
                                        >
                                          {entry.payload.handle}: {entry.value}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          Change: {entry.payload.ratingChange > 0 ? '+' : ''}
                                          {entry.payload.ratingChange}
                                        </Typography>
                                      </Box>
                                    ))}
                                  </Paper>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend />
                          {comparisonData.map((user, index) => (
                            <Line
                              key={user.handle}
                              type="monotone"
                              dataKey="rating"
                              data={ratingHistory.filter(entry => entry.handle.toLowerCase() === user.handle.toLowerCase())}
                              name={user.handle}
                              stroke={getRankColor(user.rank)}
                              strokeWidth={2}
                              dot={{ r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </Paper>
                  ) : (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Rating History Available
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {comparisonHandles.length > 0 
                          ? "The selected users haven't participated in any rated contests yet."
                          : "Add Codeforces handles to compare rating history."}
                      </Typography>
                    </Paper>
                  )}
                </Box>
              )}

              {activeTab === 1 && (
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {comparisonData.length > 0 ? (
                    <Grid container spacing={2}>
                      {comparisonData.map((user, index) => (
                        <Grid key={user.handle}>
                          <Card 
                            variant="outlined"
                            sx={{
                              position: 'relative',
                              '&:hover': {
                                boxShadow: theme.shadows[4],
                              },
                            }}
                          >
                            {index !== 0 && (
                              <IconButton
                                size="small"
                                onClick={() => removeComparisonHandle(user.handle)}
                                sx={{
                                  position: 'absolute',
                                  right: 8,
                                  top: 8,
                                }}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            )}
                            
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                {user.handle}
                              </Typography>
                              
                              <Box sx={{ mb: 2 }}>
                                <Chip
                                  label={`${user.rating} (${user.rank || 'Unrated'})`}
                                  sx={{
                                    backgroundColor: getRankColor(user.rank),
                                    color: 'white',
                                    fontWeight: 600,
                                  }}
                                />
                              </Box>

                              <Grid container spacing={2}>
                                <Grid item>
                                  <Typography variant="caption" color="text.secondary">
                                    Max Rating
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <EmojiEventsIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />
                                    <Typography variant="body2">{user.maxRating || 'N/A'}</Typography>
                                  </Box>
                                </Grid>
                                <Grid item>
                                  <Typography variant="caption" color="text.secondary">
                                    Problems Solved
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CodeIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                                    <Typography variant="body2">{user.solvedCount}</Typography>
                                  </Box>
                                </Grid>
                                <Grid item>
                                  <Typography variant="caption" color="text.secondary">
                                    Average Problems/Day
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CalendarIcon fontSize="small" sx={{ color: theme.palette.info.main }} />
                                    <Typography variant="body2">
                                      {user.averagePerDay.toFixed(1)}
                                    </Typography>
                                  </Box>
                                </Grid>
                              </Grid>

                              {index !== 0 && (
                                <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                                  <Grid container spacing={2}>
                                    <Grid item>
                                      <Typography variant="caption" color="text.secondary">
                                        Rating Difference
                                      </Typography>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <TrendingUpIcon 
                                          fontSize="small" 
                                          sx={{ 
                                            color: user.ratingDiff > 0 
                                              ? theme.palette.success.main 
                                              : theme.palette.error.main 
                                          }} 
                                        />
                                        <Typography 
                                          variant="body2"
                                          color={user.ratingDiff > 0 ? 'success.main' : 'error.main'}
                                        >
                                          {user.ratingDiff > 0 ? '+' : ''}{user.ratingDiff}
                                        </Typography>
                                      </Box>
                                    </Grid>
                                    <Grid item>
                                      <Typography variant="caption" color="text.secondary">
                                        Problems Difference
                                      </Typography>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CodeIcon 
                                          fontSize="small"
                                          sx={{ 
                                            color: user.problemsDiff > 0 
                                              ? theme.palette.success.main 
                                              : theme.palette.error.main 
                                          }}
                                        />
                                        <Typography 
                                          variant="body2"
                                          color={user.problemsDiff > 0 ? 'success.main' : 'error.main'}
                                        >
                                          {user.problemsDiff > 0 ? '+' : ''}{user.problemsDiff}
                                        </Typography>
                                      </Box>
                                    </Grid>
                                  </Grid>
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Comparison Data
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Add Codeforces handles to compare statistics.
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Enter a valid Codeforces handle in the input field above and click the + button to add it for comparison.
                      </Typography>
                    </Paper>
                  )}
                </Box>
              )}

              {activeTab === 2 && problemStats && (
                <Paper sx={{ maxHeight: 400, overflow: 'auto', p: 2 }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Average Problems per Day
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {problemStats.averagePerDay.toFixed(1)}
                    </Typography>
                  </Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Tag Statistics
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {problemStats.tagStats.map((tag, index) => (
                      <React.Fragment key={index}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={600} sx={{ minWidth: 120 }}>
                            {tag.tag}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 2, minWidth: 90, textAlign: 'right' }}>
                            {tag.solved}/{tag.total} ({tag.successRate}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={parseFloat(tag.successRate)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.12)' 
                              : 'rgba(0, 0, 0, 0.12)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getTagBarColor(tag.successRate),
                              borderRadius: 4,
                            },
                          }}
                        />
                        {index < problemStats.tagStats.length - 1 && (
                          <Divider sx={{ my: 1 }} />
                        )}
                      </React.Fragment>
                    ))}
                  </Box>
                </Paper>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default StudentComparison; 