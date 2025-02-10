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
        <div className="relative h-screen w-screen overflow-hidden">
            <video
                autoPlay
                loop
                muted
                className="absolute inset-0 w-full h-full object-cover"
                src="https://cdn.pixabay.com/video/2023/04/15/159052-818026310_large.mp4"
            />

            <div className="absolute inset-0 flex flex-col justify-center items-center p-5">
                <div className='bg-gray-400 p-5 rounded-lg w-full max-w-[400px] bg-opacity-70'>
                    <h1 className="text-4xl font-bold text-gray-800 mb-6">Sign Up</h1>

                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        className="w-full max-w-[300px] px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                    />

                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full max-w-[300px] px-4 py-3 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                    />

                    <button
                        onClick={signup}
                        className="w-full max-w-[300px] px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition duration-300 cursor-pointer"
                    >
                        Sign Up
                    </button>

                    {errorMessage && (
                        <span className="text-red-500 text-sm mt-4">{errorMessage}</span>
                    )}

                    {successMessage && (
                        <span className="text-green-500 text-sm mt-4">{successMessage}</span>
                    )}

                    <div className='mt-3'>
                        <span>
                            Already have an account ? <Link to="/" className='text-blue-900 pt-2 hover:underline hover:text-xl'>Login</Link>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;