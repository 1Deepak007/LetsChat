import React from 'react';
import { FaRegUser } from "react-icons/fa";

const FriendRequests = ({ friendRequests, handleAcceptRequest, handleRejectRequest, token }) => {
    return (
        <div className="md:w-1/4 md:pl-8 mt-8 md:mt-0">
            <div className='text-center py-12 px-6 bg-white rounded-2xl shadow-lg hover:shadow-md transition-shadow duration-300'>
                <h2 className='text-3xl font-bold text-purple-700 mb-4'>Friend Requests</h2>
                <div className='space-y-2'>
                    {friendRequests.length > 0 ? (
                        friendRequests.map((request) => (
                            <div
                                key={request.senderId}
                                className="bg-white p-4 rounded-lg shadow-md mb-4 last:mb-0"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="flex-shrink-0">
                                        <FaRegUser className="size-16 text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-lg font-medium text-gray-800 truncate">
                                            {request.username || 'Unknown User'}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate">
                                            ID: {request.senderId}..
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => handleRejectRequest(request.senderId, token)}
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleAcceptRequest(request.senderId, token)}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                    >
                                        Accept
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">No new friend requests</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FriendRequests;