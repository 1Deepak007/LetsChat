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
    const [userId, setUserId] = useState('');

    useEffect(() => {
        if (token) {
            const decoded = jwtDecode(token);
            setUserId(decoded.userId);
            socket.emit('join', decoded.userId);

            // axios.get(`http://localhost:5000/api/chat/messages?sender=${decoded.userId}&receiver=otherUserId`, {
            //     headers: { Authorization: `Bearer ${token}` }
            // })
            // .then((res) => setMessages(res.data))
            // .catch(err => console.error("Error fetching messages:", err));

            axios.get(`http://localhost:5000/api/chat/messages`)
        }
    }, [token]);

    const sendMessage = async () => {
        const newMessage = { sender: userId, receiver: 'otherUserId', content: message };
        socket.emit('send_message', newMessage);

        await axios.post('http://localhost:5000/api/chat/sendmessage', newMessage, {
            headers: { Authorization: `Bearer ${token}` }
        });

        setMessages([...messages, newMessage]);
        setMessage('');
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken('');
    };

    return (
        <div>
            <h1>Welcome to the Chat</h1>
            <button onClick={logout}>Logout</button>
            <input value={message} onChange={(e) => setMessage(e.target.value)} />
            <button onClick={sendMessage}>Send</button>
            <div>
                {messages.map((msg, idx) => (
                    <div key={idx}>{msg.content}</div>
                ))}
            </div>
        </div>
    );
};

export default Home;
