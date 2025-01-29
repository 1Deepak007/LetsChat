import React, { useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import { Route, Routes } from 'react-router-dom';
import Login from './components/Login.jsx';
import Home from './components/Home.jsx';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    }
  }, [token]);

  return (
    // <div>
    //   {token ? <Home token={token} setToken={setToken} /> : <Login setToken={setToken} />}
    // </div>
    <>
      <Routes>
        <Route path="/" element={token ? <Home token={token} setToken={setToken} /> : <Login setToken={setToken} />} />
        <Route path="*" element={() => <h1>Page not found</h1>} />
      </Routes>
    </>
  );
}

export default App;