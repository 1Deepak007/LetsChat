import React, { useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import { Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login.jsx';
import Home from './components/Home.jsx';
import Friends from './components/Friends.jsx';
import './App.css';
import Signup from './components/Signup.jsx';

// Function to check if the token is expired
const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp < Date.now() / 1000; // Check if token is expired
  } catch (error) {
    return true; // If there's an error decoding, consider the token as expired
  }
};

// PrivateRoute component to protect routes
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token || isTokenExpired(token)) {
    // Redirect to login if token is not available or expired
    return <Navigate to="/" />;
  }
  return children;
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token'); // Remove token if it's null or undefined
    }
  }, [token]);

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/"
          element={token && !isTokenExpired(token) ? <Navigate to="/home" /> : <Login setToken={setToken} />}
        />

        <Route path="/signup"
          element={<Signup />}
        />

        {/* Protected Routes*/}
        {/* <Route path="/home" element={
          <PrivateRoute>
            <Home token={token} setToken={setToken} />
          </PrivateRoute>
        }
        /> */}

        <Route path="/home/:_id?" element={
          <PrivateRoute>
            <Home token={token} setToken={setToken} />
          </PrivateRoute>
        }
        />


        <Route path="/friends" element={
          <PrivateRoute>
            <Friends token={token} />
          </PrivateRoute>
        }
        />

        {/* 404 Page Not Found */}
        <Route path="*" element={<h1>Page not found</h1>} />
      </Routes>
    </>
  );
}

export default App;






// <div>
//   {token ? <Home token={token} setToken={setToken} /> : <Login setToken={setToken} />}
// </div>