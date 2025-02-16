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
import Empty_message from '../assets/icons/Empty_message.gif';
import { RxCross2 } from "react-icons/rx";

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

    // message
    const [selectedMessages, setSelectedMessages] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
    const contextMenuRef = useRef(null);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });


    const decodedToken = jwtDecode(token);

    const { _id } = useParams();

    useEffect(() => {
        if (_id && currentUserId) {
            setSelectedFrndId(_id);
            fetchMessages(currentUserId, _id);
        }
    }, [_id, currentUserId]);

    const isTokenValid = (token) => {
        try {
            const decoded = jwtDecode(token);
            return decoded.exp * 1000 > Date.now();
        } catch (error) {
            return false;
        }
    };

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

    const fetchMessages = async (userId, selectedFrndId) => {
        if (!selectedFrndId) return;

        console.log("Fetching messages between:", userId, "and", selectedFrndId);
        setIsLoading(true);

        const token = localStorage.getItem("token");
        if (!token) {
            console.error("No authentication token found.");
            setError("Authentication required. Please log in again.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post(
                `http://localhost:5000/api/chat/messages/`,
                { senderId: userId, receiverId: selectedFrndId }, // sending data in body (req.body)
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessages(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error(`Error fetching messages: ${error.response?.data?.message || error.message}`);
            setError(`Unable to get messages: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsLoading(false);
        }
    };


    const handleSelectFriend = (e) => {
        const friendId = e.target.value;
        console.log('friendId : ', friendId);
        setSelectedFrndId(friendId);
    };

    // Send Message
    const sendMessage = async () => {
        if (!message.trim() || !selectedFrndId) return;

        const newMessage = {
            content: message,
            sender: decodedToken.id,  // Ensure correct user ID
            receiver: selectedFrndId,
            // timestamp: new Date().toISOString()
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

    const handleDeleteMessages = async () => {
        if (selectedMessages.length === 0) {
            alert("No messages selected to delete.");
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("No token found");
            }

            const deletePromises = selectedMessages.map(async (messageId) => {
                await axios.delete('http://localhost:5000/api/chat/deletemessage', {
                    headers: { Authorization: `Bearer ${token}` },
                    data: { messageId, userId: currentUserId },
                });
            });

            await Promise.all(deletePromises); // Wait for all delete requests to complete

            setMessages(messages.filter((msg) => !selectedMessages.includes(msg._id)));
            setSelectedMessages([]);  // Clear selected messages
            if (socket) {
                selectedMessages.forEach(messageId => {
                    socket.emit('messageDeleted', messageId);
                })
            }


        } catch (error) {
            console.error("Error deleting messages:", error);

            if (axios.isAxiosError(error)) {
                if (error.response) {
                    // *** KEY CHANGE HERE ***
                    const errorMessage = error.response.data.message || "An error occurred"; // Extract the message
                    setError(errorMessage);  // Set the extracted message

                } else if (error.request) {
                    setError("No response from server.");
                } else {
                    setError(error.message || "An error occurred");
                }
            } else {
                setError(error.message || "An error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedFrndId && currentUserId) {
            fetchMessages(currentUserId, selectedFrndId);
        }
    }, [selectedFrndId, currentUserId]);

    const handleContextMenu = (e, msg) => {
        e.preventDefault(); // Prevent default context menu
        setSelectedMessages([msg._id]); // Select the message for deletion
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setIsContextMenuOpen(true);
    };

    const handleMessageClick = (msg) => {
        if (selectedMessages.includes(msg._id)) {
            setSelectedMessages(selectedMessages.filter((id) => id !== msg._id));
        } else {
            setSelectedMessages([...selectedMessages, msg._id]);
        }
    };


    useEffect(() => {
        const handleClick = (e) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
                setIsContextMenuOpen(false);
            }
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

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

    const emojiPickerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    console.log('friends : ', friends);

    return (
        <>
            <div className="flex flex-col min-h-screen md:min-h-full">
                <div className='mt-2 max-w-4xl mx-auto px-1 md:mt-8 md:px-4 w-full'>
                    <div className="flex justify-between items-center mb-2 bg-gradient-to-r from-purple-600 to-blue-500 p-2 md:p-6 rounded-xl shadow-lg">
                        {/* Profile Section */}
                        <div className="flex flex-col items-center gap-1">
                            {/* Profile Picture */}
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-white/20 flex items-center justify-center shadow-md">
                                <FaUserCircle className="w-8 h-8 md:w-10 md:h-10 text-white" />
                            </div>
                            {/* Username */}
                            <h1 className="text-xs md:text-sm font-bold text-white text-center">
                                {currentUser?.username?.toUpperCase() || "UNKNOWN USER"}
                            </h1>
                        </div>

                        {/* Chat Title */}
                        <div className="flex items-center gap-2 md:gap-4">
                            <h2 className="text-md md:text-4xl font-bold text-white">Let's Chat</h2>
                            <LuMessageCircleMore className="w-6 h-6 md:w-10 md:h-10 text-white" />
                        </div>

                        <div className="">
                            {/* Logout Button */}
                        <button
                            onClick={logout}
                            className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 md:px-6 md:py-3 rounded-full hover:bg-white/30 transition-all duration-300 flex items-center gap-2 shadow-md"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 md:h-5 md:w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                            </svg>
                            <span className="text-sm md:text-base">Logout</span>
                        </button>
                        </div>
                    </div>






                    <div className="bg-white rounded-xl shadow-xl md:p-2 md:p-6 flex-grow">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-0 mb-4">
                            {/* Notifications */}

                            <div className='flex justify-between w-full'>
                                {/* Friend Selection Dropdown */}
                                <div className="w-1/2">
                                    {friends.length > 0 ? (
                                        <select
                                            onChange={handleSelectFriend}
                                            value={selectedFrndId}
                                            className="w-full p-2 md:p-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all bg-white shadow-sm"
                                        >
                                            <option value="">Select a friend to chat</option>
                                            {friends.map((friend) => (
                                                <option key={friend._id} value={friend.userId} className="py-2">
                                                    {friend.username}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className="text-gray-500 text-sm bg-gray-100 px-3 py-2 rounded-md">
                                            No friends found! Try adding some.
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-end justify-end w-1/2">
                                    <Link
                                        to="/friends"
                                        className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 shadow-md"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-6 h-6"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                            />
                                        </svg>
                                    </Link>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {currentUser?.notifications?.map((notification, index) => (
                                    <div key={index} className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                                        {notification.message}
                                    </div>
                                ))}


                            </div>

                            {/* Error and Loading States */}
                            <div className="flex items-center ">
                                {error && (
                                    <div className="flex items-center bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg">
                                        <span>{error}</span>
                                        <button onClick={() => setError(null)} className="ml-2">
                                            <RxCross2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                                {isLoading && (
                                    <div className="flex items-center justify-center space-x-2 text-gray-600">
                                        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                        <span>Loading friends...</span>
                                    </div>
                                )}



                            </div>
                        </div>


                        <div className="flex-grow">
                            {/* Chat Messages Section */}
                            {selectedFrndId ? (
                                <div className="space-y-2 md:space-y-4 md:pb-2">
                                    {/* Messages Container */}
                                    <div className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl ps-3 pe-3 p-1 h-[calc(100vh-15rem)] md:h-[calc(80vh-8rem)] overflow-y-auto shadow-inner">
                                        {/* Messages */}
                                        {Array.isArray(messages) && messages.length > 0 ? (
                                            Object.entries(
                                                messages.reduce((acc, msg) => {
                                                    const dateKey = new Date(msg.timestamp).toLocaleDateString();
                                                    if (!acc[dateKey]) acc[dateKey] = [];
                                                    acc[dateKey].push(msg);
                                                    return acc;
                                                }, {})
                                            ).map(([date, messages]) => (
                                                <div key={date} className="mb-1 md:mb-4">
                                                    {/* Date Separator */}
                                                    <div className="text-center text-gray-500 font-medium text-sm mb-2">
                                                        {date}
                                                    </div>

                                                    {/* Messages */}
                                                    {messages.map((msg, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`relative group ${selectedMessages.includes(msg._id) ? "bg-blue-50 rounded-lg" : ""
                                                                }`}
                                                            onClick={() => handleMessageClick(msg)}
                                                            onContextMenu={(e) => handleContextMenu(e, msg)}
                                                        >
                                                            <div
                                                                className={`max-w-[75%] md:max-w-[55%] mt-2 shadow p-3 rounded-2xl break-words ${msg.sender === currentUserId
                                                                    ? "ml-auto bg-purple-600 text-white"
                                                                    : "mr-auto bg-white text-gray-800"
                                                                    }`}
                                                            >
                                                                {selectedMessages.includes(msg._id) && (
                                                                    <div
                                                                        className="absolute top-2 right-2 cursor-pointer"
                                                                        onClick={() => {
                                                                            handleDeleteMessages();
                                                                            setSelectedMessages(selectedMessages.filter(id => id !== msg._id));
                                                                        }}
                                                                    >
                                                                        <RxCross2 size={20} className="text-gray-600 hover:text-gray-800" />
                                                                    </div>
                                                                )}
                                                                <div className="text-sm md:text-base">{msg.content}</div>
                                                                <div
                                                                    className={`text-xs mt-1 ${msg.sender === currentUserId ? "text-purple-200" : "text-gray-500"
                                                                        }`}
                                                                >
                                                                    {msg.timestamp ? new Intl.DateTimeFormat('en-US', {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                        hour12: true
                                                                    }).format(new Date(msg.timestamp)) : 'Invalid Time'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full">
                                                <span className="text-3xl md:text-5xl text-gray-500 font-bold mb-4">
                                                    Conversation Empty 🤷
                                                </span>
                                                <img
                                                    src={Empty_message}
                                                    alt="Empty Conversation"
                                                    className="w-48 h-48 md:w-64 md:h-64 mt-4"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-xl h-full">
                                    <div className="text-2xl text-gray-500 mb-4 my-[20vh]">
                                        👋 Select a friend to start chatting!
                                    </div>
                                    <div className="text-gray-400">Your conversations will appear here</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="fixed bottom-0 left-0 w-full flex flex-wrap gap-3 items-end bg-white p-2 shadow-lg rounded-t-lg">
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
        </>
    );
};

export default Home;


