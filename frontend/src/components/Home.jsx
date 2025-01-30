import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';

const socket = io('http://localhost:5000', {
    transports: ['websocket', 'pooling'],
    withCredentials: true
});

const Home = ({ token, setToken }) => {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [friends, setFriends] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedFrndId, setSelectedFrndId] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const isTokenValid = (token) => {
        try {
            const decoded = JSON.parse(atob(token.split(".")[1])); // Decode payload
            return decoded.exp * 1000 > Date.now(); // Compare expiry with current time
        } catch (error) {
            return false;
        }
    };

    const fetchUserProfile = async (token, userId) => {
        if (!token || !isTokenValid(token)) {
            console.error("Token is missing or expired.");
            return;
        }

        try {
            const response = await axios.get(`http://localhost:5000/api/profile/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCurrentUser(response.data);
            console.log("User Profile:", response.data);
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    const fetchFriends = async (token, userId) => {
        setIsLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/friends/get-friends/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setFriends(response.data);
        } catch (error) {
            console.error("Error fetching friends:", error);
            setError(`Unable to get friends. ${error.message}.`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            console.error("No token found.");
            return;
        }

        const decodedToken = jwtDecode(token);
        console.log("Token:", token);
        console.log("Decoded Token:", decodedToken);

        setCurrentUserId(decodedToken.id);
        fetchUserProfile(token, decodedToken.id);
        fetchFriends(token, decodedToken.id);

        socket.on("receive_message", (msg) => {
            setMessages((prevMessages) => [...prevMessages, msg]);
        });

        return () => {
            socket.off("receive_message");
        };
    }, [token]);

    const logout = () => {
        localStorage.removeItem("token");
        setToken("");
    };

    const handleSelectFriend = (e) => {
        setSelectedFrndId(e.target.value);
    };

    useEffect(() => {
        console.log("Selected friend:", selectedFrndId);
    }, [selectedFrndId]);


    return (
        <div className='mt-3'>
            <div className='flex justify-between items-center'>
                <div className='flex-grow content-center'>
                    <h1 className='text-xl text-center underline mb-2'>Welcome to the LetsChat</h1>
                </div>
                <div className='ml-0 me-4'>
                    <button onClick={logout} className='bg-red-500 text-white p-1 rounded-full'>Logout</button>
                </div>
            </div>



            <div className='p-5 pt-3'>
                <div className='row'>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    {isLoading && <p>Loading friends...</p>}
                    <select onChange={handleSelectFriend} className='bg-black text-white rounded-md p-2 mb-2 w-1/3'>
                        <option value="">Select a friend to text</option>
                        {friends && friends.map((friend) => (
                            <option key={friend._id} value={friend._id}>{friend.username}</option>
                        ))}
                    </select>

                    {messages.map((msg, idx) => (
                        <div key={idx}>{msg.content}</div>
                    ))}
                </div>

                <div className='row'>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} className='border border p-1 me-2 rounded-xl' rows="4" cols="50"></textarea>
                    <button onClick='' className='rounded-md p-1 mt-3 bg-black text-white'>Send message</button>
                </div>
            </div>
        </div >
    );
};

export default Home;
