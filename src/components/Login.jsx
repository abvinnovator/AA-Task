import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
    <div>
      <h1>Login with Facebook</h1>
      <button onClick={handleLogin}>Login with Facebook</button>
    </div>
  );
}

export default Login;