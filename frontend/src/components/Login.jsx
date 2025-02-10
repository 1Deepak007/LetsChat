import axios from 'axios';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';


const Login = ({ setToken }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState(null); // State for error message
    const [showPassword, setShowPassword] = useState(false); // State for password visibility


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
            <video
                autoPlay
                loop
                muted
                className="absolute inset-0 w-full h-full object-cover" // Cover the entire screen
                src="https://cdn.pixabay.com/video/2023/04/15/159052-818026310_large.mp4"
            />

            <div className="absolute inset-0 flex flex-col justify-center items-center p-5"> {/* Overlay Content */}
                <div className='bg-gray-400 p-5 rounded-lg w-full max-w-[400px] bg-opacity-70'> {/* Added opacity */}
                    <h1 className="text-4xl font-bold text-gray-800 mb-6">Login</h1>


                    <div className="w-full max-w-[300px]">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                            className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        />

                        {/* Password Input */}
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full px-4 py-3 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/3 cursor-pointer transform -translate-y-1/2"
                            >
                                {showPassword ? <AiFillEyeInvisible className="text-gray-500 " /> : <AiFillEye className="text-gray-500" />}
                            </button>
                        </div>
                    </div>


                    <button
                        onClick={login}
                        className="w-full max-w-[300px] px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-300 cursor-pointer"
                    >
                        Login
                    </button>

                    <div className='mt-4 mb-4'>
                        {errorMessage && (
                            <span className="text-red-800 text-sm mt-4">{errorMessage}</span>
                        )}
                    </div>
                    
                    <div className="mt-3">
                        <span>
                            Don't have an account ? <Link to="/signup" className='text-blue-900 pt-2 hover:underline hover:text-xl'>Sign Up</Link> {/* Corrected Link Text */}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;