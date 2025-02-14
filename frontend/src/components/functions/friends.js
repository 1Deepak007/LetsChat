import axios from "axios";
import { jwtDecode } from "jwt-decode";

export const fetchFriendsList = async (userId, token) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/friends/get-friends/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log(response);
  
      // Check if response data is an array
      if (!Array.isArray(response.data)) {
        console.error("Invalid response format: expected an array");
        return [];
      }
  
      // Transform response to match expected format
      return response.data.map((friend) => ({
        _id: friend.userId, // Use _id for consistency
        userId: friend.userId,
        username: friend.username,
      }));
    } catch (error) {
      console.error("Error fetching friends:", error);
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

export const fetchFriendByUsername = async (friendname, token) => {
  try {
    let searchTerm;
    if (friendname !== null) {
      searchTerm = friendname;
    }

    console.log("search term : ", friendname);

    // Call the backend API with the search term
    const response = await axios.get(
      `http://localhost:5000/api/friends/find-friend-by-username-or-id/${friendname}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // Ensure the response data is always an array
    const data = response.data;
    console.log("Friend by username or ID:", data);

    // If the backend returns a single user, wrap it in an array
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error("Error fetching friends:", error);
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
    console.log("Friend request sent:", response);
    return response.data;
  } catch (error) {
    console.error("Error sending friend request:", error);
    throw error;
  }
};

// Get LoggedIn User Profile
export const getUserProfile = async (userId, token) => {
  try {
    const response = await axios.get(
      `http://localhost:5000/api/profile/${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

export const acceptFriendRequest = async (requestId, token) => {
  try {
    const response = await axios.post(
      `http://localhost:5000/api/friends/accept-request/${requestId}`,
      null,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response;
  } catch (error) {
    console.error(`Error accepting request. ${error}`);
    throw error;
  }
};
