import React from 'react';
import { Box, Typography } from '@mui/material';

function SubmissionHeatmap({ data }) {
  const getColor = (count) => {
    if (count === 0) return '#ebedf0';
    if (count <= 2) return '#9be9a8';
    if (count <= 4) return '#40c463';
    if (count <= 6) return '#30a14e';
    return '#216e39';
  };

  const getMonthName = (month) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month];
  };

  const renderHeatmap = () => {
    const today = new Date();
    const days = [];
    const months = new Set();

    // Generate last 365 days
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = data[dateStr] || 0;
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

    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {Array.from(months).map((month) => (
            <Typography
              key={month}
              variant="caption"
              sx={{ height: 15, visibility: 'hidden' }}
            >
              {getMonthName(month)}
            </Typography>
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {weeks.map((week, weekIndex) => (
            <Box key={weekIndex} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {week.map((day) => (
                <Box
                  key={day.date}
                  sx={{
                    width: 15,
                    height: 15,
                    backgroundColor: getColor(day.count),
                    borderRadius: 2,
                  }}
                  title={`${day.date}: ${day.count} submissions`}
                />
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Submission Heatmap
      </Typography>
      {renderHeatmap()}
    </Box>
  );
}

export default SubmissionHeatmap; 