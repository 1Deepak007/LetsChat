import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import { Link, useParams } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import { LuSend } from "react-icons/lu";
import { LuSmile } from "react-icons/lu";
import { FaWindowClose } from "react-icons/fa";
import { FaUserCircle } from "react-icons/fa";
import { LuMessageCircleMore } from "react-icons/lu";

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
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const decodedToken = jwtDecode(token);

    const { _id } = useParams();
    // console.log('----------->selected user`s _id : ',_id);
    // console.log('.......current user ',currentUser._id);


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
            setCurrentUser({ ...response.data, password: '**********' });
        } catch (error) {
            console.error("Error fetching user data:", error);
        }

    };
    console.log('current user : ', currentUser)

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
        console.log("Fetching messages between:", userId, "and", selectedFrndId);
        setIsLoading(true);
        if (selectedFrndId && userId) {
            try {
                const response = await axios.get(`http://localhost:5000/api/chat/messages`, {
                    headers: { Authorization: `Bearer ${token}` },
                    params: {
                        sender: userId,
                        receiver: selectedFrndId
                    }
                });

                // Ensure messages is always an array
                if (Array.isArray(response.data)) {
                    setMessages(response.data);
                } else {
                    setMessages([]); // Set to empty array if response is not an array
                }
            } catch (error) {
                console.error(`Error fetching messages: ${error.message}.`);
                setError(`Unable to get messages: ${error.message}.`);
            } finally {
                setIsLoading(false);
            }
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
        console.log("Selected friend:", friendId, "Current user:", currentUserId);
        fetchMessages(currentUserId, friendId); // Fetch messages when selecting a friend
    };

    const logout = () => {
        setToken("")
        localStorage.removeItem('token');
    }

    const addEmoji = (emojiObject) => {
        setMessage(prevMessage => prevMessage + emojiObject.emoji);
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
            // console.log('Socket disconnected');
        };
    }, [token, selectedFrndId]);

    useEffect(() => {
        if (_id) {
            // console.log(`_id : ${_id}. current user id : ${decodedToken.id}`)
            // setCurrentUserId(_id);
            setSelectedFrndId(_id)
            fetchMessages(decodedToken.id, _id);
        }
    }, [_id])

    // Fetch User Profile & Friends
    useEffect(() => {
        if (!token || !isTokenValid(token)) return;

        const decodedToken = jwtDecode(token);
        setCurrentUserId(decodedToken.id);

        fetchUserProfile(decodedToken.id);
        fetchFriends(decodedToken.id);
    }, [token]);


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
            // Emit the 'join' event after successful connection
            newSocket.emit('join', decodedToken.id); // Emit the 'join' event
        });
    
        // Listen for new messages (same as before)
        newSocket.on("newMessage", (newMessage) => {
            // ... (your existing message handling logic)
        });
    
        // *** New: Friend request event listeners ***
        newSocket.on('friendRequestRejected', (data) => {
            console.log("Friend Request Rejected:", data.message);
            // Update UI: Remove friend request from the list (using data.relatedUserId)
            setFriends(prevFriends => prevFriends.filter(friend => friend._id !== data.relatedUserId)); // Example, adapt to your data structure.
            // Optionally, fetch updated friend requests or notifications.
        });
    
        newSocket.on('friendRequestAccepted', (data) => {
            console.log("Friend Request Accepted:", data.message);
            // Update UI: Remove friend request, add friend to the list (using data.relatedUserId)
            setFriends(prevFriends => [...prevFriends, {_id: data.relatedUserId}]); // Example, adapt to your data structure.
            // Optionally, fetch updated friend requests or notifications.
        });
    
        return () => {
            newSocket.off("newMessage");
            newSocket.off('friendRequestRejected'); // Clean up the listener
            newSocket.off('friendRequestAccepted'); // Clean up the listener
            newSocket.disconnect();
        };
    }, [token, selectedFrndId, decodedToken.id]); // Add decodedToken.id as a dependency
    

    return (
        <div className='mt-2 max-w-4xl mx-auto px-1 md:mt-8 md:px-4 h-[100%]'>
            <div className='flex justify-between items-center mb-8 bg-gradient-to-r from-purple-600 to-blue-500 p-4 rounded-xl shadow-lg'>
                <div className='flex flex-col items-center'>
                    <div className='w-12 h-12 rounded-full overflow-hidden'>
                        {/* <img src={''} alt="Profile Picture" className='w-full h-full' /> */}
                        <FaUserCircle className='w-full h-full text-white' />
                    </div>
                    <h1 className='md:text-lg font-bold text-center text-white'>{currentUser?.username?.toUpperCase() || 'UNKNOWN USER'}</h1>
                </div>
                <div>
                    <h2 className='md:text-5xl font-bold text-white flex gap-4'>
                        Let's Chat
                        <LuMessageCircleMore className='w-8 h-8 md:w-12 md:h-12 text-white' />
                    </h2>
                </div>
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

            <div className='bg-white rounded-xl shadow-xl p-1 md:p-6 md:h-[calc(100vh-20rem)]'>
                <div className='flex flex-row md:flex-row justify-between items-start md:items-center gap-4 mb-2'>

                {currentUser && currentUser.notifications && currentUser.notifications.map((notification, index) => (
  <div key={index}>
    {notification.type === 'friendRequestRejected' && (
      <p>{notification.message}</p>
    )}
    {notification.type === 'friendRequestAccepted' && (
      <p>{notification.message}</p>
    )}
    {/* Other notification types */}
  </div>
))}

                    <div className='md:w-full flex md:w-1/2 space-y-4 md:p-6'>
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
                                value={selectedFrndId} // Set the value to selectedFrndId
                                className='w-[60%] p-2 mt-2 ms-2 md:w-full md:px-4 md:py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none'
                            >
                                <option value="">Select a friend to chat 👇</option>
                                {friends.map((friend) => (


                                    <option
                                        key={friend.userId}
                                        value={friend.userId}
                                        className="py-2"
                                    >
                                        {console.log('Friend : ', friend)}
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
                    <div className='md:me-4 sm:flex mt-1 me-2 md:mt-1 md:me-1 '>
                        <Link
                            to="/friends"
                            className='flex md:flex w-10 h-10 md:w-20 md:w-auto md:py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-2 justify-center'
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="md:h-10 md:w-16 h-8 p-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </Link>
                    </div>
                </div>
                {selectedFrndId ? (
                    <div className='space-y-2 md:space-y-4'>
                        <div className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl p-4 h-[calc(100vh-15rem)] md:h-[calc(80vh-8rem)] overflow-y-auto shadow-inner">
                            <div className="flex flex-col gap-4">
                                {
                                    Array.isArray(messages) && messages.length > 0 ? (
                                        Object.entries(messages.reduce((acc, msg) => {
                                            const dateKey = new Date(msg.timestamp).toLocaleDateString();
                                            if (!acc[dateKey]) {
                                                acc[dateKey] = [];
                                            }
                                            acc[dateKey].push(msg); // Add the message to the corresponding date array
                                            return acc;
                                        }, {})).map(([date, messages]) => (
                                            <div key={date}>
                                                <div className="text-center text-gray-500 font-bold my-2">
                                                    {date}
                                                </div>
                                                {messages.map((msg, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`max-w-[55%] mt-2.5 shadow p-3 rounded-2xl break-words ${msg.sender === currentUserId
                                                            ? 'ml-auto bg-purple-600 text-white shadow-md'
                                                            : 'mr-auto bg-white text-gray-800 shadow-md'
                                                            }`}
                                                    >
                                                        <div className='text-sm md:text-base'>{msg.content}</div>
                                                        <div className={`text-xs mt-1 ${msg.sender === currentUserId ? 'text-purple-100' : 'text-gray-500'
                                                            }`}>
                                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-500 font-bold my-2">
                                            Conversation empty
                                        </div>
                                    )
                                }
                            </div>
                        </div>

                        <div className="relative flex flex-wrap gap-3 w-full items-end">
                            {/* Emoji Picker Button */}
                            <button
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="px-2 py-2 bg-gray-100 border border-gray-300 rounded-full hover:bg-gray-200 transition-all"
                            >
                                <LuSmile className="text-xl text-gray-600" />
                            </button>

                            {/* Emoji Picker - Positioned Just Above Textarea */}
                            {showEmojiPicker && (
                                <div className="absolute bottom-full left-0 mb-2 z-10 bg-white shadow-lg rounded-lg p-2">
                                    {/* Close Button */}
                                    <button
                                        onClick={() => setShowEmojiPicker(false)}
                                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                    >
                                        <FaWindowClose />
                                    </button>

                                    <div className='w-[20%] h-[20%]'>
                                        <EmojiPicker onEmojiClick={addEmoji} />
                                    </div>
                                </div>
                            )}

                            {/* Message Input */}
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="flex-1 px-4 py-2 md:py-3 border border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all resize-none w-full sm:w-auto"
                                rows="1"
                                placeholder="Type your message here..."
                            />

                            {/* Send Button */}
                            <button
                                onClick={sendMessage}
                                className="self-start ps-1 pe-2.5 py-2 md:py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all duration-300"
                            >
                                <LuSend className="inline ms-2" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className='text-center py-12 bg-gray-50 rounded-xl h-full'>
                        <div className='text-2xl text-gray-500 mb-4 my-[20vh]'>👋 Select a friend to start chatting!</div>
                        <div className='text-gray-400'>Your conversations will appear here</div>
                    </div>
                )}
            </div>
        </div>


    );
};

export default Home;


