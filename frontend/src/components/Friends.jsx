import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import React, { useEffect, useState } from 'react';
import { IoMdPersonAdd } from 'react-icons/io';
import { isTokenValid, fetchFriendsList, fetchFriendByUsername, sendFriendRequest, getUserProfile } from './functions/friends';
import { Link, useNavigate } from 'react-router-dom';
import { FaRegMessage } from "react-icons/fa6";

const Friends = ({ token }) => {
    const navigate = useNavigate()

    const [alreadyFriends, setAlreadyFriends] = useState([]);
    const [friends, setFriends] = useState([]);
    const [friendname, setFriendname] = useState('');
    const [userId, setUserId] = useState('');
    const [userProfile, setUserProfile] = useState(null);


    // Fetch friends in friendslist (already friends) and user profile
    useEffect(() => {
        if (!token || !isTokenValid(token)) return;

        const decodedToken = jwtDecode(token);
        setUserId(decodedToken.id);

        const fetchData = async () => {
            try {
                const friendsList = await fetchFriendsList(decodedToken.id, token);
                setAlreadyFriends(friendsList);

                const user = await getUserProfile(decodedToken.id, token);
                setUserProfile(user);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [token, userId]); // Added userId to dependency array

    console.log('alreadyFriends : ', alreadyFriends)

    const handleSearch = async () => {
        if (!friendname.trim()) return;

        try {
            const foundFriends = await fetchFriendByUsername(friendname, token);
            setFriends(foundFriends);
        } catch (error) {
            console.error('Error searching for friends:', error);
            alert('Failed to search for friends. Please try again.');
        }
    };
    console.log('Friends : ', friends)

    const handleSendFriendRequest = async (friendId) => {
        if (friends[0].friendRequests.includes(userId)) {
            alert('Friend request already sent.')
            return;
        }
        else if (friends[0].friends.includes(userId)) {
            alert('You are already friends with this person.')
            return;
        }
        else {
            try {
                await sendFriendRequest(friendId, token);
                alert('Friend request sent successfully!');
                // Optionally, update the friends list to reflect the sent request
                const updatedFriends = friends.filter(friend => friend._id !== friendId);
                setFriends(updatedFriends);
            } catch (error) {
                console.error('Failed to send friend request:', error);
                alert('Failed to send friend request. Please try again.');
            }
        }
    };

    return (
        <div className='max-w-4xl mx-auto px-4 py-8'>
            <div className='text-center mb-8 '>
                <div className='items-center mt-3 flex justify-between'>
                    <h2 className='mx-auto text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent'>
                        Find Your Friends
                        <span className='ml-3'>👥</span>
                    </h2>
                    <Link to='/'
                        className='bg-blue-400/90 backdrop-blur-sm text-white px-6 py-2 rounded-full hover:bg-black/70 transition-all duration-300 flex items-center gap-2'
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>
                            Home
                        </span>
                    </Link>
                </div>
                <div className="items-center mt-3">
                    <p className='text-gray-500 mt-2 mx-auto'>
                        Connect with friends using their unique ID
                    </p>
                </div>
            </div>

            <div className='flex flex-col items-center gap-4 mb-12'>
                <div className='w-full max-w-2xl relative'>
                    <input
                        type='text'
                        value={friendname}
                        onChange={(e) => {
                            const value = e.target.value;
                            setFriendname(value);
                            if (value === "") {
                                setFriends([]);
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
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                        </svg>
                    </button>
                </div>
            </div>

            <div className='mt-8'>
                {friends.length === 0 && friendname === "" ? (
                    <div className='text-center py-12 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300'>
                        <h2 className='text-2xl font-bold text-purple-600 underline decoration-wavy decoration-purple-300'>
                            Already Friends
                        </h2>
                        {alreadyFriends.length === 0 ? (
                            <div className='mt-8'>
                                <div className='text-6xl mb-6 text-gray-300'>😕</div>
                                <h3 className='text-xl text-gray-600 font-semibold'>No friends found</h3>
                                <p className='text-gray-400 mt-2'>Try searching with a different username or ID</p>
                            </div>
                        ) : (
                            <div className='mt-8 space-y-4'>
                                {alreadyFriends.map((friend, index) => (
                            <div
                                key={`${friend._id}_${index}`}
                                className='flex items-center justify-center bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300'
                            >
                                <span className='text-lg text-gray-700 font-medium'>{friend.username}</span>
                                <div className='flex'>
                                    <button onClick={() => { navigate(`/home/${friend._id}`) }} className='text-black p-2 flex'>
                                        <span className='ml-2 text-sm text-gray-500'>Say Hi..</span>
                                        <FaRegMessage/>
                                    </button>
                                </div>
                            </div>
                        ))}
                                {/* {alreadyFriends.map((friend) => (
                                    <div
                                        key={friend._id}
                                        className='flex items-center justify-center bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300'
                                    >
                                        <span className='text-lg text-gray-700 font-medium'>{friend.username}</span>
                                        <div className='flex'>
                                            <button onClick={() => { navigate(`/home/${friend._id}`) }} className='text-black p-2 flex'>
                                                <span className='ml-2 text-sm text-gray-500'>👋Say Hi..</span>
                                                <FaRegMessage/>
                                            </button>
                                        </div>
                                    </div>
                                ))} */}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {friends.map((friend) => (
                            <div
                                key={friend._id}
                                className='bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100'
                            >
                                <div className='flex flex-col items-center'>
                                    <div className='w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xl mb-4'>
                                        {friend.username.charAt(0).toUpperCase()}
                                    </div>
                                    <h3 className='text-lg font-semibold text-gray-800 mb-2'>{friend.username}</h3>
                                    <p className='text-sm text-gray-500 mb-4'>User ID: {friend._id.slice(0, 8)}...</p>
                                    {friend.friends.some(f => f._id === userId) ? (
                                        <button
                                            className="w-full py-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-colors duration-300 flex items-center justify-center gap-2"
                                        >
                                            Already Friends
                                        </button>
                                    ) : friend.friendRequests.includes(userId) ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                                            <p className="text-xs text-gray-500">Friend Request Sent</p>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleSendFriendRequest(friend._id)}
                                            className="w-full py-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-colors duration-300 flex items-center justify-center gap-2"
                                        >
                                            <IoMdPersonAdd className="text-xl" />
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
    );
};

export default Friends;






