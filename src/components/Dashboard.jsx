import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Select, MenuItem, Card, CardContent, Typography, Button, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Dashboard({ user: initialUser, onLogout }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(initialUser);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [totalReactions, setTotalReactions] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        navigate('/');
      }
    } else {
      fetchPages();
    }
  }, [user, navigate]);

  const fetchPages = async () => {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v17.0/me/accounts?access_token=${user.accessToken}`
      );
      setPages(response.data.data);
    } catch (error) {
      console.error('Error fetching pages:', error);
      setError('Failed to fetch pages. Please try again.');
    }
  };

  const fetchReactions = async (pageId, pageAccessToken) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v20.0/${pageId}/feed?fields=id,reactions.summary(total_count)&access_token=${pageAccessToken}`
      );
      const posts = response.data.data;
      const total = posts.reduce((sum, post) => sum + (post.reactions?.summary?.total_count || 0), 0);
      setTotalReactions(total);
    } catch (error) {
      console.error('Error fetching reactions:', error);
      setError('Failed to fetch reactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event) => {
    const pageId = event.target.value;
    setSelectedPage(pageId);
    if (pageId) {
      const selectedPageData = pages.find(page => page.id === pageId);
      if (selectedPageData && selectedPageData.access_token) {
        fetchReactions(pageId, selectedPageData.access_token);
      } else {
        setError('Page access token not found.');
      }
    } else {
      setTotalReactions(0);
    }
  };

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

      <Card style={{ marginTop: '20px', maxWidth: '400px', margin: 'auto' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Select a Page</Typography>
          <Select
            value={selectedPage}
            onChange={handlePageChange}
            fullWidth
            displayEmpty
          >
            <MenuItem value="">
              <em>Select a page</em>
            </MenuItem>
            {pages.map((page) => (
              <MenuItem key={page.id} value={page.id}>{page.name}</MenuItem>
            ))}
          </Select>

          {loading ? (
            <CircularProgress style={{ marginTop: '20px' }} />
          ) : (
            selectedPage && (
              <Typography variant="h6" style={{ marginTop: '20px' }}>
                Total Reactions: {totalReactions}
              </Typography>
            )
          )}

          {error && (
            <Typography color="error" style={{ marginTop: '20px' }}>
              {error}
            </Typography>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Dashboard;