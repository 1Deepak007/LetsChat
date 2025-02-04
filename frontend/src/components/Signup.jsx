import axios from 'axios';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState(null); // State for error message
    const [successMessage, setSuccessMessage] = useState(null); // State for success message

    const signup = async () => {
        try {
            console.log(username, ':', password);
            const response = await axios.post('http://localhost:5000/api/auth/signup', {
                username,
                password,
            });
            console.log('Signup successful:', response.data);
            setSuccessMessage('Account created successfully! Please login.');
            setErrorMessage(null); // Clear any previous error messages
        } catch (error) {
            console.error('Signup failed:', error);
            if (error.response && error.response.status === 400) {
                setErrorMessage(error.response.data.message || 'Username already exists.');
            } else {
                setErrorMessage('An error occurred. Please try again later.');
            }
            setSuccessMessage(null); // Clear success message on error
        }
    };

    return (
        <div className="flex flex-col justify-center items-center h-screen bg-gray-100 p-5">
            {/* Title */}
            <h1 className="text-4xl font-bold text-gray-800 mb-6">Sign Up</h1>

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

            {/* Signup Button */}
            <button
                onClick={signup}
                className="w-full max-w-[300px] px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition duration-300 cursor-pointer"
            >
                Sign Up
            </button>

            {/* Error Message */}
            {errorMessage && (
                <span className="text-red-500 text-sm mt-4">{errorMessage}</span>
            )}

            {/* Success Message */}
            {successMessage && (
                <span className="text-green-500 text-sm mt-4">{successMessage}</span>
            )}

            <span className='mt-3'>
                Already have an account ? <Link to="/" className='text-blue-600'>Login</Link>
            </span>
        </div>
    );
};

export default Signup;