import React, { useEffect, useState } from 'react'
import { FaRegUser } from "react-icons/fa";

import {
    isTokenValid,
    fetchFriendsList,
    fetchFriendByUsername,
    sendFriendRequest,
    getUserProfile,
    acceptFriendRequest,
} from '../functions/friends';


const FriendRequests = ({ token }) => {

    const [friendRequests, setFriendRequests] = useState([]);

    // Handle accepting a friend request
    const handleAcceptRequest = (async (requestId) => {
        if (!requestId) return;

        try {
            await acceptFriendRequest(requestId, token);
            console.log('Request accepted successfully');
            // Update the friend requests state
            setFriendRequests(prev => prev.filter(id => id !== requestId));
        } catch (error) {
            console.error('Error accepting friend request:', error);
        }
    }, [token]);



    return (
        <div>
            <h2>friend requests</h2>
            {/* Right Side: Friend Requests Panel (Conditional Rendering) */}
            {friendRequests.length > 0 && ( // Only render if there are friend requests
                <div className="md:w-1/4 md:pl-8 mt-8 md:mt-0"> {/* Added padding and margin for spacing */}
                    <div className='text-center py-12 px-6 bg-white rounded-2xl shadow-lg hover:shadow-md transition-shadow duration-300'>
                        <h2 className='text-3xl font-bold text-purple-700 mb-4'>Friend Requests</h2>
                        <div className='space-y-2'>
                            {friendRequests.map((request) => (
                                <div
                                    key={request.senderId} // Use userId as unique key
                                    className="bg-white p-4 rounded-lg shadow-md mb-4 last:mb-0"
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        {/* User Avatar */}
                                        <div className="flex-shrink-0">
                                            <FaRegUser className="size-16 text-gray-400" />
                                        </div>

                                        {/* User Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-lg font-medium text-gray-800 truncate">
                                                {request.username || 'Unknown User'}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate">
                                                ID: {request.senderId}.. {/* Truncated user ID */}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            // onClick={() => handleRejectRequest(request)}
                                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleAcceptRequest(request)}
                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                        >
                                            Accept
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default FriendRequests