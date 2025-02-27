import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import PriceDisplay from './components/PriceDisplay';
import Score from './components/Score';
import BarChartIcon from '@mui/icons-material/BarChart';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function HomePage() {
  return (
    <Box sx={{ my: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Car Parts Price Tracker
      </Typography>
      <Typography variant="h6" component="h2" gutterBottom align="center" color="text.secondary">
        Average Spare Parts Prices in South Africa
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Button
          component={Link}
          to="/score"
          variant="contained"
          startIcon={<BarChartIcon />}
          sx={{ mt: 2 }}
        >
          View Brand Statistics
        </Button>
      </Box>
      <PriceDisplay />
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Container maxWidth="lg">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/score" element={<Score />} />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App;
