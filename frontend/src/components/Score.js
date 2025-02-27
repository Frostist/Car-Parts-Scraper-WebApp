import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { BarChart, Bar, Cell, Tooltip } from 'recharts';

function Score() {
  const [brandStats, setBrandStats] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const prepareHistogramData = (prices) => {
    if (!prices || prices.length === 0) return [];
    
    // Create 10 bins for the histogram
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const binSize = (max - min) / 10;
    const bins = Array(10).fill(0);

    prices.forEach(price => {
      const binIndex = Math.min(Math.floor((price - min) / binSize), 9);
      bins[binIndex]++;
    });

    // Normalize the counts to be between 0 and 1
    const maxCount = Math.max(...bins);
    return bins.map((count, index) => ({
      bin: index,
      count: count,
      normalizedCount: maxCount > 0 ? count / maxCount : 0,
      binStart: min + (index * binSize),
      binEnd: min + ((index + 1) * binSize)
    }));
  };

  useEffect(() => {
    const fetchBrandStats = async () => {
      try {
        setError(null);
        const response = await fetch('http://localhost:8000/brand-stats');
        if (!response.ok) {
          throw new Error('Failed to fetch brand statistics');
        }
        const data = await response.json();
        // Sort by average price descending
        const sortedData = data.sort((a, b) => b.average_price - a.average_price);
        setBrandStats(sortedData);
      } catch (error) {
        console.error('Error fetching brand stats:', error);
        setError(error.message);
      }
    };

    fetchBrandStats();
  }, []);

  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 3 }}
        >
          Back to Home
        </Button>
        
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Brand Statistics
        </Typography>

        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Brand</TableCell>
                <TableCell align="right">Average Price (R)</TableCell>
                <TableCell align="right">Total Parts</TableCell>
                <TableCell align="center">Price Distribution</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {brandStats.map((stat) => {
                const histogramData = prepareHistogramData(stat.price_distribution);
                return (
                  <TableRow key={stat.brand_name}>
                    <TableCell component="th" scope="row">
                      {stat.brand_name}
                    </TableCell>
                    <TableCell align="right">
                      {stat.average_price.toLocaleString('en-ZA', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </TableCell>
                    <TableCell align="right">{stat.total_parts}</TableCell>
                    <TableCell align="center" sx={{ width: '200px' }}>
                      <Box sx={{ width: '100%', height: '50px' }}>
                        <BarChart 
                          width={180} 
                          height={50} 
                          data={histogramData} 
                          margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                        >
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div style={{
                                    backgroundColor: 'white',
                                    padding: '5px',
                                    border: '1px solid #ccc'
                                  }}>
                                    <div>Range: R{Math.round(data.binStart)} - R{Math.round(data.binEnd)}</div>
                                    <div>Count: {data.count}</div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="normalizedCount" fill="#1976d2">
                            {histogramData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`}
                                fill={entry.count > 0 ? '#1976d2' : '#eee'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
}

export default Score; 