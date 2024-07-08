import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CompanyLogo from '../assets/logo.png'

function Login({ setUser }) {
  const navigate = useNavigate();

  useEffect(() => {
    window.fbAsyncInit = function() {
      FB.init({
        appId: '895754192568949',
        cookie: true,
        xfbml: true,
        version: 'v13.0'
      });
      
      FB.AppEvents.logPageView();   
    };

    (function(d, s, id){
       var js, fjs = d.getElementsByTagName(s)[0];
       if (d.getElementById(id)) {return;}
       js = d.createElement(s); js.id = id;
       js.src = "https://connect.facebook.net/en_US/sdk.js";
       fjs.parentNode.insertBefore(js, fjs);
     }(document, 'script', 'facebook-jssdk'));
  }, []);

  const handleLogin = () => {
    FB.login(function(response) {
      if (response.authResponse) {
        FB.api('/me', { fields: 'name,email,picture' }, function(userInfo) {
          const userData = {
            ...userInfo,
            accessToken: response.authResponse.accessToken
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          navigate('/dashboard');
        });
      } else {
        console.log('User cancelled login or did not fully authorize.');
      }
    }, { scope: 'public_profile,email,pages_show_list,pages_read_engagement' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex flex-col items-center justify-center p-8">
      <img src={CompanyLogo} alt="Company Logo" className=" w-80 h-36 mb-8" />
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Login with Facebook</h1>
      <button 
        onClick={handleLogin} 
        className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 transition duration-300"
      >
        Login with Facebook
      </button>
    </div>
  );
}

export default Login;
