import React, { useEffect } from 'react';
import { FaRegBell } from "react-icons/fa";

const Notifications = ({ notifications }) => {
    console.log('notifications', notifications);

    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
            @keyframes marquee {
                0% { transform: translateX(100%); }
                100% { transform: translateX(-100%); }
            }

            .animate-marquee {
                display: inline-block;
                white-space: nowrap;
                animation: marquee 8s linear infinite;
            }

            .animate-marquee:hover {
                animation-play-state: paused;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return (
        <div className="md:w-1/4 md:pl-8 mt-8 md:mt-0">
            <div className='text-center py-12 px-6 bg-white rounded-2xl shadow-lg hover:shadow-md transition-shadow duration-300'>
                <h2 className='text-3xl font-bold text-purple-700 mb-4'>Notifications</h2>
                <div className='space-y-2'>
                    {notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <div
                                key={notification._id?.$oid || notification._id}
                                className="bg-white p-4 rounded-lg shadow-md mb-4 last:mb-0 border border-gray-200 transition-transform hover:scale-[1.02]"
                            >
                                {/* Notification Header */}
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="flex-shrink-0">
                                        <FaRegBell className="size-10 text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-500 truncate">
                                            {new Date(notification.timestamp).toLocaleString().slice(0, 9)}
                                        </p>
                                    </div>
                                </div>

                                {/* Notification Message with Marquee Effect */}
                                <div className="relative overflow-hidden w-full">
                                    <p className="text-lg font-medium text-gray-800 animate-marquee">
                                        {notification.message}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">No new notifications</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
