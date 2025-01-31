import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';

const socket = io('http://localhost:5000', {
    transports: ['websocket', 'poling'],
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
            console.log(token)
            console.log(userId)
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
                // const response = await axios.get(`http://localhost:5000/api/chat/messages`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    sender: userId,
                    receiver: selectedFrndId
                }
            });
            setFriends(response.data);
        } catch (error) {
            console.error("Error fetching friends:", error);
            setError(`Unable to get friends. ${error.message}.`);
        } finally {
            setIsLoading(false);
        }
    };
    console.log("Friends : ", friends)


    const fetchMessages = async (token, userId, selectedFrndId) => {
        setIsLoading(true);
        try {
            const response = await axios.get(`http://localhost:5000/api/chat/messages`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    sender: userId,
                    receiver: selectedFrndId
                }
            });
            setMessages(response.data);
        } catch (error) {
            console.error(`Error fetching messages: ${error.message}.`);
            setError(`Unable to get messages: ${error.message}.`);
        } finally {
            setIsLoading(false);
        }
    }

    const sendMessage = async () => {
        if (!message.trim() || !selectedFrndId) return;

        const newMessage = {
            content: message,
            sender: currentUserId,
            receiver: selectedFrndId,
            timestamp: new Date().toISOString()
        };

        try {
            await axios.post('http://localhost:5000/api/chat/sendmessage', newMessage, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Optimistically update UI
            setMessages(prev => [...prev, newMessage]);
            setMessage("");

            // Emit via socket.io
            socket.emit("send_message", newMessage);
        } catch (error) {
            console.error("Error sending message:", error);
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
        if (!selectedFrndId) {
            return;
        } else {
            fetchMessages(token, currentUserId, selectedFrndId);
        }
        console.log("Friends : ", friends)
        console.log("Selected friend : ", selectedFrndId);
        console.log("Messages : ", messages)
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

                    {/* {messages.map((msg, idx) => (
                        <div key={idx}>{msg.content}</div>
                    ))} */}

                    <div className='row'>
                        {/* Messages Container */}
                        <div className="flex flex-col gap-2 h-96 overflow-y-auto mb-4 p-2 border rounded">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`max-w-[70%] p-2 rounded-lg break-words ${msg.sender === currentUserId
                                        ? 'ml-auto bg-blue-500 text-white'  // Current user's messages
                                        : 'mr-auto bg-gray-200 text-black'  // Friend's messages
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            ))}
                        </div>

                        {/* Message Input */}
                        <div className='flex gap-2'>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className='flex-1 mt-1 border p-2 rounded-xl'
                                rows="1"
                            />
                            <button
                                onClick={sendMessage}
                                className='self-start px-4 py-2 mt-1 bg-black text-white rounded-md hover:bg-gray-800'
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>

                {/* <div className='row'>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} className='border border p-1 me-2 rounded-xl' rows="4" cols="50"></textarea>
                    <button onClick='' className='rounded-md p-1 mt-3 bg-black text-white'>Send message</button>
                </div> */}
            </div>
        </div >
    );
};

export default Home;
