import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Fetch friends list (already friends)
export const fetchFriendsList = async (user_id, token) => {
    try {
        const response = await axios.get(`http://localhost:5000/api/friends/get-friends/${user_id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        // Ensure friends is always an array
        const data = response.data;
        return Array.isArray(data) ? data : [data];
    } catch (error) {
        console.error('Error fetching friends:', error);
        return [];
    }
};

// Validate token
export const isTokenValid = (token) => {
    try {
        const decoded = JSON.parse(atob(token.split(".")[1])); // Decode payload
        return decoded.exp * 1000 > Date.now(); // Compare expiry with current time
    } catch (error) {
        return false;
    }
};

// Find friend by username
export const fetchFriendByUsername = async (userId, friendname, token) => {
    try {
        const response = await axios.get(`http://localhost:5000/api/friends/find-friend-by-username/${friendname}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        // Ensure friends is always an array
        const data = response.data;
        console.log('Friend by username :', data);

        // if (data.friends.includes(userId)) {
        //     console.log('Request already sent');
        // }

        return Array.isArray(data) ? data : [data];
        // return response
    } catch (error) {
        console.error('Error fetching friends:', error);
        return [];
    }
};

// Send friend request
export const sendFriendRequest = async (friendId, token) => {
    try {
        const response = await axios.post(
            `http://localhost:5000/api/friends/send-request/${friendId}`,
            {},
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        console.log(friendId, token);
        console.log('Friend request sent:', response);
        return response.data;
    } catch (error) {
        console.error('Error sending friend request:', error);
        throw error;
    }
};

// Get LoggedIn User Profile 
export const getUserProfile = async (userId, token) => {
    try {
        const response = await axios.get(`http://localhost:5000/api/profile/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
}
