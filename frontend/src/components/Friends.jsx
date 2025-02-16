import React, { useEffect, useState, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { IoMdPersonAdd } from 'react-icons/io';
import { FaRegMessage } from "react-icons/fa6";
import { FaRegUser } from "react-icons/fa";
import { LuSmile } from "react-icons/lu";
import {
    isTokenValid,
    fetchFriendsList,
    fetchFriendByUsername,
    sendFriendRequest,
    getUserProfile,
    acceptFriendRequest,
    rejectFriendRequest
} from './functions/friends';
import Notifications from './SubComponents/Notifications';
import FriendRequests from './SubComponents/FriendRequests';

const Friends = ({ token }) => {
    const navigate = useNavigate();
    const [alreadyFriends, setAlreadyFriends] = useState([]);
    const [friends, setFriends] = useState([]);
    const [friendname, setFriendname] = useState('');
    const [userId, setUserId] = useState('');
    const [userProfile, setUserProfile] = useState(null);
    const [friendRequests, setFriendRequests] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!token || !isTokenValid(token)) {
            navigate('/login');
            return;
        }

        const decodedToken = jwtDecode(token);
        setUserId(decodedToken.id);
    }, [token, navigate]);

    const handleAcceptRequest = useCallback(async (requestId, token) => {
        if (!requestId || !token) return;

        try {
            await acceptFriendRequest(requestId, token);
            setFriendRequests((prev) => prev.filter((req) => req.senderId !== requestId));
        } catch (error) {
            console.error('Error accepting friend request:', error);
        }
    }, []);

    const handleRejectRequest = useCallback(async (requestId, token) => {
        if (!requestId || !token) return;
        try {
            await rejectFriendRequest(requestId, token);
            setFriendRequests((prev) => prev.filter((req) => req.senderId !== requestId));
        } catch (error) {
            console.error('Error rejecting friend request:', error);
        }
    }, []);

    // Handle searching for friends by username
    const handleSearch = async () => {
        if (friendname === userProfile.username) return; // Prevent searching for self
        if (!friendname.trim()) {
            setFriends(alreadyFriends); // Reset to alreadyFriends when search is empty
            return;
        }

        try {
            const foundFriends = await fetchFriendByUsername(friendname, token);
            setFriends(foundFriends);
        } catch (error) {
            console.error('Error searching for friends:', error);
            alert('Failed to search for friends. Please try again.');
        }
    };

    // Handle sending a friend request
    const handleSendFriendRequest = async (friendId, token) => {
        console.log('token',token);
        console.log('friendId', friendId);
        const friend = friends.find((friend) => friend._id === friendId);
        if (!friend) return;

        if (friend.friendRequests.includes(userId)) {
            alert('Friend request already sent.');
            return;
        }

        if (friend.friends.includes(userId)) {
            alert('You are already friends with this person.');
            return;
        }

        try {
            await sendFriendRequest(friendId, token);
            alert('Friend request sent successfully!');

            // Update the friends list to remove the user after sending the request
            // setFriends(
            //     (prevFriends) => prevFriends.filter((friend) => friend._id !== friendId)
            // );
            setFriends((prevFriends) => {
                return prevFriends.map((friend) => {
                    if (friend._id === friendId) {
                        return { ...friend, requestSent: true }; // Add a 'requestSent' flag
                    }
                    return friend;
                });
            });
        } catch (error) {
            console.error('Failed to send friend request:', error);
            alert('Failed to send friend request. Please try again.');
        }
    };

    useEffect(() => {
        if (!userId || !token) return;

        const fetchData = async () => {
            try {
                const [friendsList, user] = await Promise.all([
                    fetchFriendsList(userId, token),
                    getUserProfile(userId, token),
                ]);

                setAlreadyFriends(friendsList);
                setFriends(friendsList);
                setUserProfile(user);
                setNotifications(user.notifications || []);

                if (user.friendRequests && user.friendRequests.length > 0) {
                    const formattedRequests = user.friendRequests.map((request) => ({
                        senderId: request.userId.toString(),
                        username: request.username,
                        timestamp: request.timestamp || new Date(),
                    }));
                    setFriendRequests(formattedRequests);
                } else {
                    setFriendRequests([]);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, userId]);

    console.log('Notifications : ',Notifications)

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <>
            <div className='text-center mb-3 md:mb-8'>
                <div className='flex items-center justify-between md:mt-6 px-4 md:px-8'>
                    <div className="flex-grow pt-3 md:pt-0">
                        <h2 className='text-center text-2xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent animate-gradient mx-auto'>
                            Find Your Friends <span className='ml-3 animate-bounce'>👥</span>
                        </h2>
                    </div>
                    <Link
                        to='/'
                        className='bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 md:px-4 py-2 rounded-full hover:from-purple-600 hover:to-blue-500 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105'
                    >
                        <svg
                            xmlns='http://www.w3.org/2000/svg'
                            className='md:h-6 md:w-6 w-5 h-5'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                            />
                        </svg>
                        <span className='text-sm md:text-base'>Home</span>
                    </Link>
                </div>
                <p className='text-gray-500 mt-2 mx-auto'>
                    Connect with friends using their unique ID
                </p>
            </div>

            <div className="max-w-7xl mx-auto px-2 md:py-8 py-0 flex flex-col md:flex-row">
                <div className={friendRequests.length > 0 ? "md:w-3/4" : "w-full"}>
                    <div className='flex flex-col items-center gap-4 md:mb-12'>
                        <div className='w-full max-w-2xl relative'>
                            <input
                                type='text'
                                value={friendname}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFriendname(value);
                                    if (value === '') {
                                        setFriends(alreadyFriends); // Reset to alreadyFriends when input is cleared
                                    }
                                }}
                                className='w-full px-6 py-3 rounded-2xl border border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all outline-none pr-24'
                                placeholder="Enter friend's username..."
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button
                                onClick={handleSearch}
                                className='absolute right-2 top-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5'
                            >
                                <svg
                                    xmlns='http://www.w3.org/2000/svg'
                                    className='inline ml-2 h-5 w-5'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                >
                                    <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className='mt-8'>
                        {friends.length === 0 && friendname === '' ? (
                            <div className='text-center py-12 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300'>
                                <h2 className='text-2xl font-bold text-purple-600 underline decoration-wavy decoration-purple-300'>
                                    {alreadyFriends.length > 0 ? "Already Friends" : "No Friends Found"}
                                </h2>
                                {alreadyFriends.length === 0 ? (
                                    <div className='mt-8'>
                                        <div className='text-6xl mb-6 text-gray-300'>😕</div>
                                        <h3 className='text-xl text-gray-600 font-semibold'>No friends found</h3>
                                        <p className='text-gray-400 mt-2'>Try searching with a different username or ID</p>
                                    </div>
                                ) : (
                                    <div className="container mx-auto p-4">
                                        <div className={`grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 ${alreadyFriends.length > 10 ? 'xl:grid-cols-5' : 'xl:grid-cols-4'}`}>
                                            {alreadyFriends.map((friend) => (
                                                <div key={`alreadyFriend-${friend._id}`} className="w-full bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                                                    {/* ... (dropdown and profile content remain the same) ... */}
                                                    <h2>dropsow</h2>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {friends.map((friend) => (
                                    <div key={`friend-${friend.userId}`}
                                        className="bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 flex flex-row items-center md:flex-col md:max-w-sm transition-shadow duration-300 hover:bg-gray-100"
                                    >
                                        {/* Avatar for Small Screens (Left) & Large Screens (Top) */}
                                        <div className="ms-0 w-40 h-full p-0 md:w-full md:h-40 rounded-s-lg md:rounded-tl-lg md:rounded-bl-lg md:rounded-none bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold">
                                            {friend.username.charAt(0).toUpperCase()}
                                        </div>

                                        {/* Content */}
                                        <div className="p-2 flex flex-col">
                                            <div className='flex justify-between'>
                                                <h3 className="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-gray-600">
                                                    {friend.username.charAt(0).toUpperCase() + friend.username.slice(1)}
                                                </h3>
                                                <Link to={`/home/${friend.userId}`}>
                                                    <FaRegMessage className="text-3xl md:text-xl self-end hover:text-blue-600 hover:bg-text-200 " />
                                                </Link>
                                            </div>

                                            <p className="mb-3 text-sm font-normal text-gray-700 dark:text-gray-400">
                                                User ID: {friend.userId}
                                            </p>

                                            {/* Action Buttons */}
                                            {alreadyFriends.some(f => f.userId === friend.userId) ? (
                                                <button className="w-full py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors duration-300 flex items-center justify-center gap-2">
                                                    Already Friends
                                                </button>
                                            ) : friendRequests.some(req => req.senderId === friend.userId) ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                                                    <p className="text-xs text-gray-500">Friend Request Sent</p>
                                                </div>
                                            ) : (
                                                <button onClick={() => handleSendFriendRequest(friend._id, token)} className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300 flex items-center justify-center gap-2">
                                                    Add Friend
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                        )}
                    </div>
                </div>

                {/* Notifications and Friend Requests */}
                {notifications.length > 0 && <Notifications notifications={notifications} />}
                {friendRequests.length > 0 && (
                    <FriendRequests
                        friendRequests={friendRequests}
                        handleAcceptRequest={handleAcceptRequest}
                        handleRejectRequest={handleRejectRequest}
                        token={token}
                    />
                )}
            </div>
        </>
    );
};

export default Friends;