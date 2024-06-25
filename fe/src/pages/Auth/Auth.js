import React, { useState } from 'react';
import axios from 'axios';
import './AuthPage.css'; // Import your CSS file for styling

const AuthPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // Track if user is registering or logging in
  const [isLoading, setIsLoading] = useState(false); // Track loading state for better UX feedback
  const [errorMessage, setErrorMessage] = useState('');

  const handleAuth = async () => {
    setIsLoading(true); // Start loading state
    setErrorMessage('');
    try {
      const endpoint = isRegistering ? 'register' : 'login';
      const response = await axios.post(`http://localhost:5000/${endpoint}`, {
        username,
        password
      });
      console.log(response.status); // Assuming backend returns user details or success message
      
      if (response.data.userID) {
        localStorage.setItem('userID', response);
      }

      setIsLoading(false); // End loading state
      setErrorMessage('');
      // Redirect to the dashboard or home page after successful authentication
    } catch (error) {
      console.error('Authentication failed:', error);
      setIsLoading(false); // End loading state
      setErrorMessage(error.response ? error.response.data.message : 'Authentication failed. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <h2>{isRegistering ? 'Register' : 'Login'}</h2>
      <div className="input-container">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="input-container">
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <button onClick={handleAuth} disabled={isLoading}>
        {isLoading ? 'Loading...' : (isRegistering ? 'Register' : 'Login')}
      </button>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <p className="toggle-auth" onClick={() => setIsRegistering(!isRegistering)}>
        {isRegistering ? 'Already have an account? Login here' : "Don't have an account? Register here"}
      </p>
    </div>
  );
};

export default AuthPage;
