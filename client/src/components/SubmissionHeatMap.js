import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

const SubmissionHeatMap = ({ submissions = [] }) => {
  const theme = useTheme();

  const getSubmissionCount = (date) => {
    return submissions.filter(sub => 
      new Date(sub.date).toISOString().split('T')[0] === date
    ).length;
  };

  const getColor = (count) => {
    if (count === 0) return theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    if (count <= 2) return theme.palette.success.light;
    if (count <= 4) return theme.palette.success.main;
    if (count <= 6) return theme.palette.success.dark;
    return theme.palette.success.dark;
  };

  const getMonthName = (month) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month];
  };

  const generateHeatmapData = () => {
    const today = new Date();
    const days = [];
    const months = new Set();

    // Generate last 365 days
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = getSubmissionCount(dateStr);
      days.unshift({
        date: dateStr,
        count,
        day: date.getDay(),
        month: date.getMonth(),
      });
      months.add(date.getMonth());
    }

    // Group by weeks
    const weeks = [];
    let currentWeek = [];
    days.forEach((day) => {
      currentWeek.push(day);
      if (day.day === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return { weeks, months: Array.from(months).sort((a, b) => a - b) };
  };

  const { weeks, months } = generateHeatmapData();
  const cellSize = 10;
  const cellPadding = 2;
  const totalWidth = weeks.length * (cellSize + cellPadding);
  const totalHeight = 7 * (cellSize + cellPadding);

  return (
    <Box sx={{ 
      position: 'relative',
      width: '100%',
      overflowX: 'auto',
      pb: 2,
    }}>
      {/* Months labels */}
      <Box sx={{ 
        display: 'flex',
        height: 20,
        ml: `${cellSize + cellPadding}px`,
        mb: 1,
      }}>
        {months.map((month, i) => (
          <Typography
            key={i}
            variant="caption"
            color="text.secondary"
            sx={{
              position: 'relative',
              width: `${4 * (cellSize + cellPadding)}px`,
            }}
          >
            {getMonthName(month)}
          </Typography>
        ))}
      </Box>

      {/* Days labels */}
      <Box sx={{ 
        position: 'absolute',
        left: 0,
        top: 20,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        height: totalHeight,
        pr: 1,
      }}>
        {['Sun', 'Mon', 'Wed', 'Fri'].map((day, i) => (
          <Typography
            key={i}
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: '0.65rem' }}
          >
            {day}
          </Typography>
        ))}
      </Box>

      {/* Heatmap grid */}
      <Box sx={{ 
        display: 'flex',
        ml: 3,
        gap: `${cellPadding}px`,
      }}>
        {weeks.map((week, weekIndex) => (
          <Box
            key={weekIndex}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: `${cellPadding}px`,
            }}
          >
            {Array(7).fill(null).map((_, dayIndex) => {
              const day = week[dayIndex];
              return (
                <Box
                  key={dayIndex}
                  sx={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: day ? getColor(day.count) : 'transparent',
                    borderRadius: '2px',
                    cursor: day ? 'pointer' : 'default',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: day ? 'scale(1.2)' : 'none',
                    },
                  }}
                  title={day ? `${day.date}: ${day.count} submissions` : ''}
                />
              );
            })}
          </Box>
        ))}
      </Box>

      {/* Legend */}
      <Box sx={{ 
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        mt: 2,
        ml: 3,
      }}>
        <Typography variant="caption" color="text.secondary">
          Less
        </Typography>
        {[0, 2, 4, 6, 8].map((count) => (
          <Box
            key={count}
            sx={{
              width: cellSize,
              height: cellSize,
              backgroundColor: getColor(count),
              borderRadius: '2px',
            }}
          />
        ))}
        <Typography variant="caption" color="text.secondary">
          More
        </Typography>
      </Box>
    </Box>
  );
};

export default SubmissionHeatMap; 