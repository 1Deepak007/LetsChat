import axios from 'axios';
import React, { useState } from 'react';

const Login = ({ setToken }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const login = async () => {
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', { username, password });
            setToken(response.data.token);
        } catch (error) {
            console.error('Login failed', error);
        }
    };

    return (
        <div>
            <h1>Login</h1>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" />
            <button onClick={login}>Login</button>
        </div>
    );
};

export default Login;
