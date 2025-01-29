import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { jwtDecode } from "jwt-decode";

const socket = io('http://localhost:5000', {
    transports: ['websocket', 'pooling'],
    withCredentials: true
});

const Home = ({ token, setToken }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [friends, setfriends] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);


    useEffect(() => {
        const decoded = jwtDecode(token);


        const fetchFriends = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`http://localhost:5000/api/friends/get-friends/${decoded.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setfriends(response.data); // Assuming the API directly returns the array of friends
            } catch (error) {
                console.error('Error fetching friends:', error);
                setError(error.message || 'An error occurred while fetching friends.');
            } finally {
                setIsLoading(false);
            }
        };

        if (token) {
            fetchFriends();
        }

        socket.on('receive_message', (msg) => {
            setMessages(prevMessages => [...prevMessages, msg]);
        });
    }, [token]); // Dependency array includes token for refetching on token change

    const logout = () => {
        localStorage.removeItem('token');
        setToken('');
    };

    return (
        <div >
            <h1 >Welcome to the LetsChat</h1>
            <button onClick={logout}>Logout</button>
            <input value={message} onChange={(e) => setMessage(e.target.value)} />
            <button onClick='' className='btn btn-primary'>Send message</button>

            {isLoading && <p>Loading friends...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <div>
                {messages.map((msg, idx) => (
                    <div key={idx}>{msg.content}</div>
                ))}
            </div>
            <ul>
                {
                    friends &&
                    friends.map((friend) => (
                        <li key={friend._id}>{friend.username}</li>
                    ))
                }
            </ul>
        </div>
    );
};

export default Home;