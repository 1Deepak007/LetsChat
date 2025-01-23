import React, { useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import Login from './components/Login.jsx';
import Home from './components/Home.jsx';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    }
  }, [token]);

  return (
    <div>
      {token ? <Home token={token} setToken={setToken} /> : <Login setToken={setToken} />}
    </div>
  );
}

export default App;
