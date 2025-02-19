import React from "react";

const FriendRequests = ({ friendRequests, handleAcceptRequest, handleRejectRequest, token }) => {


    console.log(friendRequests)

    const accept=(senderId , token)=>{
        console.log(senderId)
        console.log(token)
        handleAcceptRequest(senderId, token)
    }
    return (
        <ul className="list-none p-0">
            {friendRequests.map((request) => (
                <li key={request._id} className="bg-white border border-gray-200 rounded-md p-3 mb-2 shadow flex items-center justify-between">
                    <div>
                        <div className="flex-grow">
                            <p className="text-sm text-gray-700">
                                {request.username} sent you a friend request.
                            </p>
                        </div>
                        <div className="flex space-x-2 mt-2">
                            <button
                                // onClick={() => handleAcceptRequest(request._id, token)}
                                onClick={() => accept(request.senderId, token)}
                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-xs"
                            >
                                Accept
                            </button>
                            <button
                                onClick={() => handleRejectRequest(request._id, token)}
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </li>
            ))}
            {friendRequests.length === 0 && (
                <p className="text-gray-500">No friend requests.</p>
            )}
        </ul>
    );
};

export default FriendRequests;