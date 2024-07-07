import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Select, MenuItem, Card, CardContent, Typography, Button, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Dashboard({ user: initialUser, onLogout }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(initialUser);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [pageStats, setPageStats] = useState(null);
  const [dateRange, setDateRange] = useState({
    since: '2023-01-01',
    until: '2023-12-31',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.accessToken) {
      fetchPages();
    }
  }, [user]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `https://graph.facebook.com/v17.0/me/accounts?access_token=${user.accessToken}`
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
        `https://graph.facebook.com/v17.0/${selectedPage}/insights`,
        {
          params: {
            metric: 'page_fan_adds_unique,page_views_total,page_engaged_users,page_impressions',
            access_token: user.accessToken,
            period: 'day',
            since: dateRange.since,
            until: dateRange.until,
          },
        }
      );
      console.log('Page insights:', response.data);
      setPageStats(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching page stats:', error);
      setError(`Error fetching page stats: ${error.response?.data?.error?.message || error.message}`);
      setLoading(false);
    }
  };

  const handlePageChange = (event) => {
    setSelectedPage(event.target.value);
  };

  useEffect(() => {
    if (selectedPage && user && user.accessToken) {
      fetchPageStats();
    }
  }, [selectedPage, user, dateRange]);

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

          {pageStats && (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', marginTop: '20px' }}>
              {pageStats.map((stat) => (
                <Card key={stat.name} style={{ minWidth: 200, margin: '10px' }}>
                  <CardContent>
                    <Typography variant="h6" component="div">
                      {stat.name}
                    </Typography>
                    <Typography variant="body2">
                      {stat.values && stat.values.length > 0 ? stat.values[0].value : 'N/A'}
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