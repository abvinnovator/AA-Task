import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Select, MenuItem, Card, CardContent, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [pageStats, setPageStats] = useState(null);
  const [dateRange, setDateRange] = useState({
    since: '2024-01-01',
    until: '2024-12-31',
  });

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
      const response = await axios.get(
        `https://graph.facebook.com/v13.0/me/accounts?access_token=${user.accessToken}`
      );
      setPages(response.data.data);
    } catch (error) {
      console.error('Error fetching pages:', error);
    }
  };

  const fetchPageStats = async () => {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v13.0/${selectedPage}/insights`,
        {
          params: {
            metric: 'page_fans,page_engaged_users,page_impressions,page_reactions_total',
            access_token: user.accessToken,
            period: 'total_over_range',
            since: dateRange.since,
            until: dateRange.until,
          },
        }
      );
      setPageStats(response.data.data);
    } catch (error) {
      console.error('Error fetching page stats:', error);
    }
  };

  const handlePageChange = (event) => {
    setSelectedPage(event.target.value);
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
      <button onClick={handleLogout}>Logout</button>

      <Select value={selectedPage} onChange={handlePageChange}>
        {pages.map((page) => (
          <MenuItem key={page.id} value={page.id}>
            {page.name}
          </MenuItem>
        ))}
      </Select>

      {pageStats && (
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
          {pageStats.map((stat) => (
            <Card key={stat.name} style={{ minWidth: 200 }}>
              <CardContent>
                <Typography variant="h5" component="div">
                  {stat.name}
                </Typography>
                <Typography variant="body2">
                  {stat.values[0].value}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;