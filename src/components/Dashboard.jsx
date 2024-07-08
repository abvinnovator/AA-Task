import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Select, MenuItem, Card, CardContent, Typography, Button, CircularProgress, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CompanyLogo from '../assets/logo.png'
import VisibilityIcon from '@mui/icons-material/Visibility';

function Dashboard({ user: initialUser, onLogout }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(initialUser);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [pageStats, setPageStats] = useState({
    totalReactions: 0,
    totalLikes: 0,
    totalFollowers: 0,
    totalEngagement: 0,
    totalImpressions: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
  useEffect(() => {
    if (selectedPage && startDate && endDate) {
      fetchPageStats();
    }
  }, [selectedPage, startDate, endDate]);
  
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

  const fetchPageStats = async (pageId, pageAccessToken) => {
    if (!selectedPage || !startDate || !endDate) {
      console.log('Missing required data for fetching stats');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const selectedPageData = pages.find(page => page.id === selectedPage);
      if (!selectedPageData || !selectedPageData.access_token) {
        throw new Error('Page access token not found.');
      }

      const pageId = selectedPage;
      const pageAccessToken = selectedPageData.access_token;
  
      const since = Math.floor(new Date(startDate).getTime() / 1000);
      const until = Math.floor(new Date(endDate).getTime() / 1000);

      console.log(`Fetching data for date range: ${new Date(since * 1000).toISOString()} to ${new Date(until * 1000).toISOString()}`);
  
      const [feedResponse, pageResponse, insightsResponse] = await Promise.all([
        axios.get(`https://graph.facebook.com/v20.0/${pageId}/feed?fields=id,reactions.summary(total_count),likes.summary(total_count)&access_token=${pageAccessToken}`),
        axios.get(`https://graph.facebook.com/v20.0/${pageId}?fields=fan_count,followers_count&access_token=${pageAccessToken}`),
        axios.get(`https://graph.facebook.com/${pageId}/insights?metric=page_post_engagements,page_impressions_organic_v2&period=total_over_range&since=${since}&until=${until}&access_token=${pageAccessToken}`)
      ]);
      
     
      
      const posts = feedResponse.data.data;
      const totalReactions = posts.reduce((sum, post) => sum + (post.reactions?.summary?.total_count || 0), 0);
      const totalLikes = posts.reduce((sum, post) => sum + (post.likes?.summary?.total_count || 0), 0);
  
      const insightsData = insightsResponse.data.data;
     
  
      let engagements = 0;
      let impressions = 0;
  
      insightsData.forEach(item => {
        console.log(`Processing ${item.name}:`, item);
        if (item.name === 'page_post_engagements' && item.values && item.values.length > 0) {
          engagements = item.values[0].value || 0;
        } else if (item.name === 'page_impressions_organic_v2' && item.values && item.values.length > 0) {
          impressions = item.values[0].value || 0;
        }
      });
  
     
  
      if (engagements === 0 && impressions === 0) {
        console.warn('Both engagements and impressions are 0. This might indicate an issue with the data returned by the API.');
      }
  
      setPageStats({
        totalReactions,
        totalLikes,
        totalFollowers: pageResponse.data.followers_count,
        totalFans: pageResponse.data.fan_count,
        totalEngagement: engagements,
        totalImpressions: impressions,
      });
  
     
  
    } catch (error) {
      console.error('Error fetching page stats:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      setError('Failed to fetch page statistics. Please check the console for more details.');
    } finally {
      setLoading(false);
    }
  };
  const handlePageChange = (event) => {
    const pageId = event.target.value;
    setSelectedPage(pageId);
    if (!pageId) {
      setPageStats({
        totalReactions: 0,
        totalLikes: 0,
        totalFollowers: 0,
        totalFans: 0,
        totalEngagement: 0,
        totalImpressions: 0,
      });
    }
  };
  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value);
  };

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center mb-8">
          <img src={CompanyLogo} alt="Company Logo" className=" mb-4  " />
          <div className="flex items-center space-x-4">
            <img src={user.picture?.data?.url} alt={user.name} className="w-16 h-16 rounded-full border-4 border-white shadow-lg" />
            <h1 className="text-3xl font-bold text-gray-800">Welcome, {user.name}!</h1>
          </div>
          <Button 
            onClick={handleLogout} 
            variant="contained" 
            color="secondary"
            className="bg-purple-600 hover:bg-purple-700 transition-colors duration-300 mt-4"
          >
            Logout
          </Button>
        </div>

        <Card className="mb-8 bg-white rounded-lg shadow-lg">

          <CardContent className="p-6">
            <Typography variant="h6" gutterBottom className="text-gray-700 font-semibold">Select a Page and Date Range</Typography>
            <div className="flex space-x-4 mt-4">
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
            />
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
            />
          </div>
            <Select
              value={selectedPage}
              onChange={handlePageChange}
              fullWidth
              displayEmpty
              className="mt-2"
            >
              <MenuItem value="">
                <em>Select a page</em>
              </MenuItem>
              {pages.map((page) => (
                <MenuItem key={page.id} value={page.id}>{page.name}</MenuItem>
              ))}
            </Select>
            
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center">
            <CircularProgress className="text-purple-600" />
          </div>
        ) : (
          selectedPage && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <StatCard
                title="Total Reactions"
                value={pageStats.totalReactions}
                icon={<ThumbUpAltIcon className="text-blue-500" />}
              />
              <StatCard
                title="Total Likes"
                value={pageStats.totalLikes}
                icon={<FavoriteIcon className="text-red-500" />}
              />
              <StatCard
                title="Total Followers"
                value={pageStats.totalFollowers}
                icon={<PeopleIcon className="text-green-500" />}
              />
              <StatCard
                title="Total Fans"
                value={pageStats.totalFans}
                icon={<PeopleIcon className="text-purple-500" />}
              />
              <StatCard
                title="Total Engagement"
                value={pageStats.totalEngagement}
                icon={<BarChartIcon className="text-yellow-500" />}
              />
              <StatCard
                title="Total Impressions"
                value={pageStats.totalImpressions}
                icon={<VisibilityIcon className="text-indigo-500" />}
              />
            </div>
          )
        )}

        {error && (
          <Typography color="error" className="mt-8 text-center text-red-600 bg-red-100 p-4 rounded-lg">
            {error}
          </Typography>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <Card className="bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 aspect-square">
      <CardContent className="p-6 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <Typography variant="h6" className="font-semibold text-gray-800">
            {title}
          </Typography>
          <div className="bg-gray-100 p-2 rounded-full">
            {icon}
          </div>
        </div>
        <Typography variant="h3" className="font-bold text-gray-800 mt-4 self-end">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default Dashboard;