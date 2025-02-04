import axios from 'axios';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';


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
        <div className="flex flex-col justify-center items-center h-screen bg-gray-100 p-5">
            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-800 mb-6">Login</h1>

            {/* Username Input */}
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full max-w-[300px] px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            />

            {/* Password Input */}
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full max-w-[300px] px-4 py-3 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            />

            {/* Login Button */}
            <button
                onClick={login}
                className="w-full max-w-[300px] px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-300 cursor-pointer"
            >
                Login
            </button>

            {/* Error Message */}
            {errorMessage && (
                <span className="text-red-500 text-sm mt-4">{errorMessage}</span>
            )}

            <span className='mt-3'>
                Don't have an account ? <Link to="/signup" className='text-blue-600'>Login</Link>
            </span>
        </div>
    );
};

export default Login;