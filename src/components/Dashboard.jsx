import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Select, MenuItem, Card, CardContent, Typography, Button, CircularProgress, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Dashboard({ user: initialUser, onLogout }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(initialUser);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [pageFans, setPageFans] = useState(null);
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

  const fetchPageAccessToken = async (pageId) => {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v17.0/${pageId}`,
        {
          params: {
            fields: 'access_token',
            access_token: user.accessToken,
          },
        }
      );
      return response.data.access_token;
    } catch (error) {
      console.error('Error fetching page access token:', error);
      setError(`Error fetching page access token: ${error.response?.data?.error?.message || error.message}`);
      setLoading(false);
      return null;
    }
  };

  const fetchPageFans = async () => {
    try {
      setLoading(true);
      setError(null);
      const pageAccessToken = await fetchPageAccessToken(selectedPage);
  
      if (!pageAccessToken) {
        setLoading(false);
        return;
      }
  
      const response = await axios.get(
        `https://graph.facebook.com/v17.0/${selectedPage}/insights`,
        {
          params: {
            metric: 'page_fans',
            access_token: pageAccessToken,
            period: 'day',
            date_preset: 'last_30d',
          },
        }
      );
  
      setPageFans(response.data.data[0].values[0].value);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching page fans:', error.response ? error.response.data : error.message);
      setError(`Error fetching page fans: ${error.response?.data?.error?.message || error.message}`);
      setLoading(false);
    }
  };

  const handlePageChange = (event) => {
    setSelectedPage(event.target.value);
  };

  useEffect(() => {
    if (selectedPage && user && user.accessToken) {
      fetchPageFans();
    }
  }, [selectedPage, user]);

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
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <img src={user.picture?.data?.url} alt={user.name} style={{ borderRadius: '50%', width: 50, height: 50 }} />
        </Grid>
        <Grid item>
          <Typography variant="h5">Welcome, {user.name}!</Typography>
        </Grid>
        <Grid item>
          <Button onClick={handleLogout} variant="contained" color="secondary">Logout</Button>
        </Grid>
      </Grid>

      {loading ? (
        <CircularProgress style={{ marginTop: 20 }} />
      ) : error ? (
        <Typography color="error" style={{ marginTop: 20 }}>{error}</Typography>
      ) : pages.length === 0 ? (
        <Typography style={{ marginTop: 20 }}>
          You don't have admin access to any Facebook Pages. To use this feature, please create a Facebook Page or obtain admin access to an existing one.
        </Typography>
      ) : (
        <>
          <Select value={selectedPage} onChange={handlePageChange} style={{ marginTop: 20, marginBottom: 20, minWidth: 200 }}>
            {pages.map((page) => (
              <MenuItem key={page.id} value={page.id}>
                {page.name}
              </MenuItem>
            ))}
          </Select>

          {pageFans !== null && (
            <Card style={{ minWidth: 200, margin: '20px auto' }}>
              <CardContent>
                <Typography variant="h6">Total Followers / Fans</Typography>
                <Typography variant="body2">
                  {pageFans.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;
