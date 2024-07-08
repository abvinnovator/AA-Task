import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Select, MenuItem, Card, CardContent, Typography, Button, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CompanyLogo from '../assets/logo.png'

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

 const fetchPageStats = async (pageId, pageAccessToken) => {
  setLoading(true);
  setError('');
  try {
    const [feedResponse, pageResponse] = await Promise.all([
      axios.get(`https://graph.facebook.com/v20.0/${pageId}/feed?fields=id,reactions.summary(total_count),likes.summary(total_count)&access_token=${pageAccessToken}`),
      axios.get(`https://graph.facebook.com/v20.0/${pageId}?fields=fan_count&access_token=${pageAccessToken}`)
    ]);

    const posts = feedResponse.data.data;
    const totalReactions = posts.reduce((sum, post) => sum + (post.reactions?.summary?.total_count || 0), 0);
    const totalLikes = posts.reduce((sum, post) => sum + (post.likes?.summary?.total_count || 0), 0);

    setPageStats({
      totalReactions,
      totalLikes,
      totalFollowers: pageResponse.data.fan_count,
      totalEngagement: 'N/A',
      totalImpressions: 'N/A',
    });
  } catch (error) {
    console.error('Error fetching page stats:', error);
    setError('Failed to fetch page statistics. Please try again.');
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
        fetchPageStats(pageId, selectedPageData.access_token);
      } else {
        setError('Page access token not found.');
      }
    } else {
      setPageStats({
        totalReactions: 0,
        totalLikes: 0,
        totalFollowers: 0,
        totalEngagement: 0,
        totalImpressions: 0,
      });
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
            <Typography variant="h6" gutterBottom className="text-gray-700 font-semibold">Select a Page</Typography>
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard
                title="Total Reactions"
                value={pageStats.totalReactions}
                icon={<ThumbUpAltIcon className="text-blue-500" />}
                color="blue"
              />
              <StatCard
                title="Total Likes"
                value={pageStats.totalLikes}
                icon={<FavoriteIcon className="text-red-500" />}
                color="red"
              />
              <StatCard
                title="Total Followers"
                value={pageStats.totalFollowers}
                icon={<PeopleIcon className="text-green-500" />}
                color="green"
              />
              <StatCard
                title="Total Engagement"
                value={pageStats.totalEngagement}
                icon={<BarChartIcon className="text-yellow-500" />}
                color="yellow"
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

function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'from-blue-400 to-blue-600',
    red: 'from-red-400 to-red-600',
    green: 'from-green-400 to-green-600',
    yellow: 'from-yellow-400 to-yellow-600'
  };

  return (
    <Card className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg shadow-lg transition-transform duration-300 hover:scale-105 aspect-square`}>
      <CardContent className="p-6 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <Typography variant="h6" className="font-semibold text-white">
            {title}
          </Typography>
          <div className="bg-white p-2 rounded-full">
            {icon}
          </div>
        </div>
        <Typography variant="h3" className="font-bold text-white mt-4 self-end">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default Dashboard;
