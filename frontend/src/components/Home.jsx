import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';


const Home = ({ token, setToken }) => {
    const [message, setMessage] = useState("");
    const [friends, setFriends] = useState([]);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedFrndId, setSelectedFrndId] = useState("");
    const [currentUserId, setCurrentUserId] = useState(null);
    const [socket, setSocket] = useState(null);

    const seledtedUser = useRef('');
    const updateSelectedUser = () => {
        seledtedUser.current = setSelectedFrndId
    }

    // Function to check token validity
    const isTokenValid = (token) => {
        try {
            const decoded = JSON.parse(atob(token.split(".")[1])); // Decode payload
            return decoded.exp * 1000 > Date.now(); // Compare expiry with current time
        } catch (error) {
            return false;
        }
    };

    // Fetch User Profile
    const fetchUserProfile = async (userId) => {
        if (!token || !isTokenValid(token)) {
            console.error("Token is missing or expired.");
            return;
        }

        try {
            const response = await axios.get(`http://localhost:5000/api/profile/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCurrentUser(response.data);
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    // Fetch Friends List
    const fetchFriends = async (userId) => {
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

    // Fetch Messages between the current user and the selected friend
    const fetchMessages = async (userId, selectedFrndId) => {
        if (!selectedFrndId) return;
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
    };

    // Send Message
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

    // Handle Friend Selection
    const handleSelectFriend = (e) => {
        const friendId = e.target.value;
        setSelectedFrndId(friendId);
        fetchMessages(currentUserId, friendId); // Fetch messages when selecting a friend
    };

    // Initialize Socket Connection
    useEffect(() => {
        if (!token) {
            console.error("No token found.");
            return;
        }

        const newSocket = io('http://localhost:5000', {
            transports: ['websocket', 'polling'],
            withCredentials: true,
            auth: { token }
        });

        setSocket(newSocket);

        newSocket.on("connect", () => {
            console.log("Connected to socket.io server");
        });

        // Listen for new messages
        newSocket.on("newMessage", (newMessage) => {
            if (
                (newMessage.sender === selectedFrndId && newMessage.receiver === currentUserId) ||
                (newMessage.sender === currentUserId && newMessage.receiver === selectedFrndId)
            ) {
                setMessages(prev => [...prev, newMessage]);
            }
        });

        return () => {
            newSocket.off("newMessage");
            newSocket.disconnect();
            console.log('Socket disconnected');
        };
    }, [token, selectedFrndId]);

    // Fetch User Profile & Friends
    useEffect(() => {
        if (!token || !isTokenValid(token)) return;

        const decodedToken = jwtDecode(token);
        setCurrentUserId(decodedToken.id);

        fetchUserProfile(decodedToken.id);
        fetchFriends(decodedToken.id);
    }, [token]);

    return (
        <div className='mt-3'>
            <div className='flex justify-between items-center'>
                <h1 className='text-xl text-center underline mb-2 mx-auto'>Welcome to LetsChat</h1>
                <button onClick={() => setToken("")} className='bg-red-500 text-white p-1 rounded-full ml-auto mr-5'>Logout</button>
            </div>

            {/* <FriendList friends={friends} handleSelectFriend={handleSelectFriend} token={token} /> */}
            <div className='p-5 pt-3'>
                <div className='row'>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    {isLoading && <p>Loading...</p>}

                    <select onChange={handleSelectFriend} className='bg-black text-white rounded-md p-2 mb-2 w-1/3'>
                        <option value="">Select a friend to chat</option>
                        {friends.map((friend) => (
                            <option key={friend._id} value={friend._id}>{friend.username}</option>
                        ))}
                    </select>

                    {
                        selectedFrndId ? (
                            <div>
                                <div className="flex flex-col gap-2 h-96 overflow-y-auto mb-4 p-2 border rounded">
                                    {messages.map((msg, idx) => (
                                        <div key={idx} className={`max-w-[70%] p-2 rounded-lg break-words ${msg.sender === currentUserId ? 'ml-auto bg-blue-500 text-white' : 'mr-auto bg-gray-200 text-black'}`}>
                                            {msg.content}
                                        </div>
                                    ))}
                                </div>

                                <div className='flex gap-2'>
                                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} className='flex-1 mt-1 border p-2 rounded-xl' rows="1" />
                                    <button onClick={sendMessage} className='self-start px-4 py-2 mt-1 bg-black text-white rounded-md hover:bg-gray-800'>Send</button>
                                </div>
                            </div>)
                            :
                            (<div>
                                <h2>Select a friend to start a chat.</h2>
                            </div>)
                    }
                </div>
            </div>
        </div>
    );
};

export default Home;
