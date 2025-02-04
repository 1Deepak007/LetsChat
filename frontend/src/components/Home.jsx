import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import { Link } from 'react-router-dom';
import { LuSend } from "react-icons/lu";


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

    const logout = () => {
        setToken("")
        localStorage.removeItem('token');
    }

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
        // <div className="mt-0 bg-gray-900 text-white min-h-screen p-5">
        //     {/* Header Section */}
        //     <div className="flex justify-between items-center mb-4">
        //         <h1 className="text-2xl font-bold underline text-center mx-auto">
        //             Welcome to LetsChat
        //         </h1>
        //         <button
        //             onClick={logout}
        //             className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full transition duration-300"
        //         >
        //             Logout
        //         </button>
        //     </div>

        //     {/* Friend Selection and Chat Interface */}
        //     <div className="p-5 pt-3">
        //         {/* Error and Loading States */}
        //         {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        //         {isLoading && <p className="text-gray-400 text-sm mb-2">Loading...</p>}

        //         {/* Friend Selection Dropdown */}
        //         <div className="flex justify-between items-center mb-4">
        //             <div className="flex-1">
        //                 <select
        //                     onChange={handleSelectFriend}
        //                     className="bg-gray-800 text-white rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        //                 >
        //                     <option value="">Select a friend to chat</option>
        //                     {friends.map((friend) => (
        //                         <option key={friend._id} value={friend._id}>
        //                             {friend.username}
        //                         </option>
        //                     ))}
        //                 </select>
        //             </div>
        //             <div className="flex-1 flex justify-end">
        //                 <Link
        //                     to="/friends"
        //                     className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition duration-300"
        //                 >
        //                     Friends List
        //                 </Link>
        //             </div>
        //         </div>

        //         {/* Chat Interface */}
        //         {selectedFrndId ? (
        //             <div>
        //                 {/* Message Display Area */}
        //                 <div className="flex flex-col gap-2 h-96 overflow-y-auto mb-4 p-2 border border-gray-700 rounded-lg bg-gray-800">
        //                     {messages.map((msg, idx) => (
        //                         <div
        //                             key={idx}
        //                             className={`max-w-[70%] p-3 rounded-lg break-words ${msg.sender === currentUserId
        //                                 ? "ml-auto bg-blue-600 text-white"
        //                                 : "mr-auto bg-gray-700 text-gray-300"
        //                                 }`}
        //                         >
        //                             {msg.content}
        //                         </div>
        //                     ))}
        //                 </div>

        //                 {/* Message Input Area */}
        //                 <div className="flex gap-2">
        //                     <textarea
        //                         value={message}
        //                         onChange={(e) => setMessage(e.target.value)}
        //                         className="flex-1 mt-1 bg-gray-800 text-white border border-gray-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        //                         rows="1"
        //                         placeholder="Type your message..."
        //                     />
        //                     <button
        //                         onClick={sendMessage}
        //                         className="self-start px-4 py-2 mt-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-300"
        //                     >
        //                         Send
        //                     </button>
        //                 </div>
        //             </div>
        //         ) : (
        //             <div className="text-center text-gray-400">
        //                 <h2 className="text-xl font-semibold">Select a friend to start a chat.</h2>
        //             </div>
        //         )}
        //     </div>
        // </div>

        <div className='mt-8 max-w-4xl mx-auto px-4'>
            <div className='flex justify-between items-center mb-8 bg-gradient-to-r from-purple-600 to-blue-500 p-4 rounded-xl shadow-lg'>
                <h1 className='text-3xl font-bold text-center text-white mx-auto'>Welcome to Let'sChat 💬</h1>
                <button
                    onClick={logout}
                    className='bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-full hover:bg-white/30 transition-all duration-300 flex items-center gap-2'
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                </button>
            </div>

            <div className='bg-white rounded-xl shadow-xl p-6'>
                <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8'>
                    <div className='w-full md:w-1/2 space-y-4'>
                        {error && (
                            <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg'>
                                {error}
                            </div>
                        )}
                        {isLoading && (
                            <div className='flex items-center justify-center space-x-2 text-gray-600'>
                                <div className='w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin' />
                                <span>Loading friends...</span>
                            </div>
                        )}

                        {friends.length > 0 ? (
                            <select
                                onChange={handleSelectFriend}
                                className='w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none'
                            >
                                <option value="">Select a friend to chat 👇</option>
                                {friends.map((friend) => (
                                    <option
                                        key={friend._id}
                                        value={friend._id}
                                        className="py-2"
                                    >
                                        {friend.username}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <span className='text-gray-500 text-sm flex items-center gap-1 bg-gray-100 px-3 py-2 rounded-md'>
                                🤷 No friends found! Try adding some.
                            </span>

                        )}

                    </div>

                    <Link
                        to="/friends"
                        className='w-full md:w-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-2 justify-center'
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Find Friends
                    </Link>
                </div>

                {selectedFrndId ? (
                    <div className='space-y-6'>
                        <div className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl p-4 h-96 overflow-y-auto shadow-inner">
                            <div className="flex flex-col gap-4">
                                {messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`max-w-[85%] p-3 rounded-2xl break-words ${msg.sender === currentUserId
                                            ? 'ml-auto bg-purple-600 text-white shadow-md'
                                            : 'mr-auto bg-white text-gray-800 shadow-md'
                                            }`}
                                    >
                                        <div className='text-sm'>{msg.content}</div>
                                        <div className={`text-xs mt-1 ${msg.sender === currentUserId ? 'text-purple-100' : 'text-gray-500'
                                            }`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className='flex gap-3'>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className='flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all resize-none'
                                rows="2"
                                placeholder="Type your message here..."
                            />
                            <button
                                onClick={sendMessage}
                                className='self-start px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all duration-300'
                            >
                                Send
                                <LuSend className='inline ms-2' />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className='text-center py-12 bg-gray-50 rounded-xl'>
                        <div className='text-2xl text-gray-500 mb-4'>👋 Select a friend to start chatting!</div>
                        <div className='text-gray-400'>Your conversations will appear here</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
