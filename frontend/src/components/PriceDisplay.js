import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Typography,
  Link,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  CartesianGrid,
  Cell 
} from 'recharts';
import { OpenInNew, Sort, Delete } from '@mui/icons-material';
import axios from 'axios';

const PriceDisplay = () => {
  const [priceData, setPriceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [sortOrder, setSortOrder] = useState('asc');
  const [detailedParts, setDetailedParts] = useState([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isScraperRunning, setIsScraperRunning] = useState(true);

  // Add color scale for brands
  const brandColors = [
    '#e41a1c', // Red
    '#377eb8', // Blue
    '#4daf4a', // Green
    '#984ea3', // Purple
    '#ff7f00', // Orange
    '#ffff33', // Yellow
    '#a65628', // Brown
    '#f781bf', // Pink
    '#00ffff', // Cyan
    '#808080', // Gray
    '#8dd3c7', // Mint
    '#bebada', // Periwinkle
    '#fb8072', // Salmon
    '#80b1d3', // Light Blue
    '#fdb462', // Light Orange
    '#b3de69', // Light Green
    '#fccde5', // Light Pink
    '#bc80bd', // Light Purple
    '#ccebc5', // Pale Green
    '#ffed6f', // Light Yellow
  ];

  const getBrandColor = (brand) => {
    const index = brands.findIndex(b => b.name === brand);
    return brandColors[index % brandColors.length];
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [brandsRes, categoriesRes] = await Promise.all([
          axios.get('http://localhost:8000/brands'),
          axios.get('http://localhost:8000/categories')
        ]);
        setBrands(brandsRes.data);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Only include parameters if they're not null
        const statsParams = {};
        if (selectedCategory !== null) statsParams.category = selectedCategory;
        
        const partsParams = {};
        if (selectedBrand !== null) partsParams.brand = selectedBrand;
        if (selectedCategory !== null) partsParams.category = selectedCategory;

        const [statsRes, partsRes] = await Promise.all([
          axios.get('http://localhost:8000/price-stats', { params: statsParams }),
          axios.get('http://localhost:8000/parts', { params: partsParams })
        ]);

        setPriceData(statsRes.data);
        setDetailedParts(partsRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [selectedBrand, selectedCategory]);

  const handleSort = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    setPriceData([...priceData].sort((a, b) => {
      return newOrder === 'asc' 
        ? a.avg_price - b.avg_price 
        : b.avg_price - a.avg_price;
    }));
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleBrandChange = (event) => {
    setSelectedBrand(event.target.value);
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  const handleAddBrand = async () => {
    try {
      await axios.post('http://localhost:8000/brands', {
        name: newBrandName
      });
      
      // Refresh brands list
      const brandsRes = await axios.get('http://localhost:8000/brands');
      setBrands(brandsRes.data);
      
      setOpenAddDialog(false);
      setNewBrandName('');
      setSnackbar({
        open: true,
        message: 'Brand added successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Error adding brand',
        severity: 'error'
      });
    }
  };

  const handleDeleteBrand = async (brandName) => {
    if (window.confirm(`Are you sure you want to delete ${brandName}?`)) {
      try {
        await axios.delete(`http://localhost:8000/brands/${brandName}`);
        
        // Refresh brands list
        const brandsRes = await axios.get('http://localhost:8000/brands');
        setBrands(brandsRes.data);
        
        setSnackbar({
          open: true,
          message: 'Brand deleted successfully',
          severity: 'success'
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: error.response?.data?.detail || 'Error deleting brand',
          severity: 'error'
        });
      }
    }
  };

  const handleScraperToggle = async () => {
    try {
      const endpoint = isScraperRunning ? '/scraper/stop' : '/scraper/start';
      await axios.post(`http://localhost:8000${endpoint}`);
      setIsScraperRunning(!isScraperRunning);
      setSnackbar({
        open: true,
        message: `Scraper ${isScraperRunning ? 'stopped' : 'started'} successfully`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || `Error ${isScraperRunning ? 'stopping' : 'starting'} scraper`,
        severity: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Box display="flex" alignItems="center" gap={2}>
            <FormControl fullWidth>
              <InputLabel>Brand</InputLabel>
              <Select
                value={selectedBrand ?? ''}
                label="Brand"
                onChange={handleBrandChange}
              >
                <MenuItem value="">All Brands</MenuItem>
                {brands.map((brand) => (
                  <MenuItem key={brand.id} value={brand.name}>
                    {brand.name}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBrand(brand.name);
                      }}
                      sx={{ ml: 2 }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={() => setOpenAddDialog(true)}
              sx={{ minWidth: 'auto' }}
            >
              Add Brand
            </Button>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box display="flex" alignItems="center" gap={2}>
            <FormControl fullWidth>
              <InputLabel>Part Category</InputLabel>
              <Select
                value={selectedCategory ?? ''}
                label="Part Category"
                onChange={handleCategoryChange}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.name}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color={isScraperRunning ? "error" : "success"}
              onClick={handleScraperToggle}
              sx={{ minWidth: '120px' }}
            >
              {isScraperRunning ? 'Stop Scraper' : 'Start Scraper'}
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Overview" />
        <Tab label="Detailed Prices" />
      </Tabs>

      {tabValue === 0 ? (
        <>
          <Box sx={{ width: '100%', height: 400, mb: 4 }}>
            <ResponsiveContainer>
              <BarChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="brand" 
                  height={40}
                  tick={({ x, y, payload }) => (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={0}
                        y={0}
                        dy={16}
                        textAnchor="middle"
                        fill="#666"
                      >
                        {payload.value}
                      </text>
                    </g>
                  )}
                />
                <YAxis label={{ value: 'Average Price (ZAR)', angle: -90, position: 'insideLeft' }} />
                <RechartsTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <Card>
                          <CardContent>
                            <Typography variant="subtitle2">{data.brand}</Typography>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              {data.category}
                            </Typography>
                            <Typography>Average: R {data.avg_price.toFixed(2)}</Typography>
                            <Typography>Min: R {data.min_price.toFixed(2)}</Typography>
                            <Typography>Max: R {data.max_price.toFixed(2)}</Typography>
                            <Typography>Retailers: {data.retailer_count}</Typography>
                          </CardContent>
                        </Card>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="avg_price">
                  {priceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBrandColor(entry.brand)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Brand</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">
                    Average Price (ZAR)
                    <IconButton size="small" onClick={handleSort}>
                      <Sort />
                    </IconButton>
                  </TableCell>
                  <TableCell align="right">Min Price</TableCell>
                  <TableCell align="right">Max Price</TableCell>
                  <TableCell align="right">Retailers</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {priceData.map((row) => (
                  <TableRow key={`${row.brand}-${row.category}`}>
                    <TableCell>{row.brand}</TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell align="right">R {row.avg_price.toFixed(2)}</TableCell>
                    <TableCell align="right">R {row.min_price.toFixed(2)}</TableCell>
                    <TableCell align="right">R {row.max_price.toFixed(2)}</TableCell>
                    <TableCell align="right">{row.retailer_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Part Name</TableCell>
                <TableCell>Brand</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Retailer</TableCell>
                <TableCell align="right">Price (ZAR)</TableCell>
                <TableCell align="right">Last Updated</TableCell>
                <TableCell align="center">Link</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {detailedParts.map((part) => (
                <TableRow key={part.id}>
                  <TableCell>{part.name}</TableCell>
                  <TableCell>{part.brand.name}</TableCell>
                  <TableCell>{part.category.name}</TableCell>
                  <TableCell>{part.retailer.name}</TableCell>
                  <TableCell align="right">R {part.price.toFixed(2)}</TableCell>
                  <TableCell align="right">
                    {new Date(part.last_updated).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    {part.url && (
                      <Tooltip title="View on retailer's website">
                        <IconButton 
                          size="small" 
                          component={Link} 
                          href={part.url} 
                          target="_blank"
                        >
                          <OpenInNew />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Brand Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle>Add New Brand</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Brand Name"
            fullWidth
            value={newBrandName}
            onChange={(e) => setNewBrandName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddBrand} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PriceDisplay; 