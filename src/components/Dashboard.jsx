import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Select, MenuItem, Card, CardContent, Typography, Button, CircularProgress, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [pageStats, setPageStats] = useState(null);
  const [dateRange, setDateRange] = useState({
    since: '2023-01-01',  // Changed to a past date
    until: '2023-12-31',  // Changed to a past date
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        user = JSON.parse(storedUser);
      } else {
        navigate('/');
        return;
      }
    }
    fetchPages();
  }, [user, navigate]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `https://graph.facebook.com/v20.0/me/accounts?access_token=${user.accessToken}`
      );
      setPages(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pages:', error);
      setError('Error fetching pages. Please try again later.');
      setLoading(false);
    }
  };

  const fetchPageStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `https://graph.facebook.com/v20.0/${selectedPage}/insights`,
        {
          params: {
            metric: 'page_fans_total,page_post_engagements,page_impressions,page_reactions_total',
            access_token: user.accessToken,
            since: dateRange.since,
            until: dateRange.until,
            period: 'total_over_range'
          },
        }
      );
      setPageStats(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching page stats:', error);
      setError('Error fetching page stats. This page might not have any activity or you might not have sufficient permissions.');
      setLoading(false);
    }
  };

  const handlePageChange = (event) => {
    setSelectedPage(event.target.value);
  };

  const handleDateChange = (event) => {
    setDateRange({
      ...dateRange,
      [event.target.name]: event.target.value
    });
  };

  useEffect(() => {
    if (selectedPage) {
      fetchPageStats();
    }
  }, [selectedPage, dateRange]);

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <img src={user.picture?.data?.url} alt={user.name} />
      <p>Welcome, {user.name}!</p>
      <Button onClick={handleLogout} variant="contained" color="secondary">Logout</Button>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : pages.length === 0 ? (
        <Typography>
          You don't have admin access to any Facebook Pages. To use this feature, please create a Facebook Page or obtain admin access to an existing one.
        </Typography>
      ) : (
        <>
          <Select value={selectedPage} onChange={handlePageChange} style={{ marginTop: '20px', marginBottom: '20px' }}>
            {pages.map((page) => (
              <MenuItem key={page.id} value={page.id}>
                {page.name}
              </MenuItem>
            ))}
          </Select>

          <div style={{ marginTop: '20px', marginBottom: '20px' }}>
            <TextField
              label="Since"
              type="date"
              name="since"
              value={dateRange.since}
              onChange={handleDateChange}
              InputLabelProps={{
                shrink: true,
              }}
              style={{ marginRight: '20px' }}
            />
            <TextField
              label="Until"
              type="date"
              name="until"
              value={dateRange.until}
              onChange={handleDateChange}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </div>

          {pageStats && (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', marginTop: '20px' }}>
              {pageStats.map((stat) => (
                <Card key={stat.name} style={{ minWidth: 200, margin: '10px' }}>
                  <CardContent>
                    <Typography variant="h6" component="div">
                      {stat.name}
                    </Typography>
                    <Typography variant="body2">
                      {stat.values[0]?.value || 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;
