// Sidebar.jsx (Only the dropdown content)
import React from 'react';
import Notifications from './Notifications';
import FriendRequests from './FriendRequests';

const Sidebar = ({ isOpen, onClose, notifications, friendRequests, handleAcceptRequest, handleRejectRequest, token }) => {

    if (!isOpen) {
        return null; // Don't render if not open
    }

    return (
        <div className="absolute right-0 mt-2 w-64 me-5 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-y-auto max-h-screen md:max-h-[80vh]">
            <div className="flex flex-col h-full">
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Notifications */}
                {/* {notifications.length > 0 && (
                    <div className="p-4">
                        <h2 className="text-lg font-semibold mb-2">Notifications</h2>
                        <div className="overflow-y-auto max-h-48">
                            <Notifications notifications={notifications} />
                        </div>
                    </div>
                )} */}

                {/* Friend Requests */}
                {friendRequests.length > 0 && (
                    <div className="p-4">
                        <h2 className="text-lg font-semibold mb-2">Friend Requests</h2>
                        <div className="overflow-y-auto max-h-48 mb-2">
                            <FriendRequests
                                friendRequests={friendRequests}
                                handleAcceptRequest={handleAcceptRequest}
                                handleRejectRequest={handleRejectRequest}
                                token={token}
                            />
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {notifications.length === 0 && friendRequests.length === 0 && (
                    <div className="flex items-center justify-center h-full p-4">
                        <p className="text-gray-500">No notifications or friend requests yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;