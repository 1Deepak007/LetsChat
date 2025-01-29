import axios from 'axios';
import React, { useState } from 'react';

const Login = ({ setToken }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState(null); // State for error message

    const login = async () => {
        try {
            console.log(username, ':', password);
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                username,
                password,
            });

            setToken(response.data.token);
            console.log('Login successful!');
            setErrorMessage(null); // Clear error message on successful login
        } catch (error) {
            console.error('Login failed:', error);
            if (error.response && error.response.status === 400) {
                setErrorMessage(error.response.data.message || 'Invalid username or password');
            } else {
                setErrorMessage('An error occurred. Please try again later.');
            }
        }
    };
    // http://localhost:5000/api/auth/register
    return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f4f8', padding: '20px' }}>
            <h1 style={{ fontSize: '2.5rem', color: '#333', marginBottom: '20px' }}>Login</h1>
            <input
                style={{ width: '100%', maxWidth: '300px', padding: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1rem' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
            />
            <input
                style={{ width: '100%', maxWidth: '300px', padding: '10px', marginBottom: '20px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Password"
            />
            <button
                style={{ width: '100%', maxWidth: '300px', padding: '10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '1rem', cursor: 'pointer' }}
                onClick={login}
            >
                Login
            </button>

            {errorMessage && (
                <span style={{ color: 'red', marginTop: '10px' }}>{errorMessage}</span>
            )}
        </div>
    );
};

export default Login;