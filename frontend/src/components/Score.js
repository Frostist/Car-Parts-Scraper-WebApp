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
  Box
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

function Score() {
  const [brandStats, setBrandStats] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBrandStats = async () => {
      try {
        const response = await fetch('http://localhost:8000/brand-stats');
        const data = await response.json();
        setBrandStats(data);
      } catch (error) {
        console.error('Error fetching brand stats:', error);
      }
    };

    fetchBrandStats();
  }, []);

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
              </TableRow>
            </TableHead>
            <TableBody>
              {brandStats.map((stat) => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
}

export default Score; 