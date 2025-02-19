import React, { useEffect } from 'react';
import { FaRegBell } from "react-icons/fa";

const Notifications = ({ notifications }) => {
    return (
        <ul className="list-none p-0">
            {notifications.map((notification) => (
                <li key={notification._id} className="bg-white border border-gray-200 rounded-md p-3 mb-2 shadow"> 
                    <p className="text-sm text-gray-700">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(notification.timestamp).toLocaleString()}</p>
                </li>
            ))}
            {notifications.length === 0 && <p className="text-gray-500">No notifications.</p>} 
        </ul>
    );
};



export default Notifications;