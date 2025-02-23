import axios from "axios";
import { jwtDecode } from "jwt-decode";

// Validate token
export const isTokenValid = (token) => {
  try {
    const decoded = JSON.parse(atob(token.split(".")[1])); // Decode payload
    return decoded.exp * 1000 > Date.now(); // Compare expiry with current time
  } catch (error) {
    return false;
  }
};

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
      _id: friend._id, // Use _id from the API response
      firstname: friend.firstname,
      lastname: friend.lastname,
      username: friend.username,
      profilePicture: friend.profilePicture,
    }));
  } catch (error) {
    console.error("Error fetching friends:", error);
    return [];
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
  console.log(friendId, token);
  try {
    const response = await axios.post(
      `http://localhost:5000/api/friends/send-request/${friendId}`,
      {}, // Empty body (if no data is required)
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

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

export const acceptFriendRequest = async (senderId, token) => {
  try {
    const response = await axios.post(
      `http://localhost:5000/api/friends/accept-request/${senderId}`,
      null,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response;
  } catch (error) {
    console.error(`Error accepting request. ${error}`);
    throw error;
  }
};

export const rejectFriendRequest = async (requestId, token) => {
  try {
    const response = await axios.put(
      `http://localhost:5000/api/friends/reject-request/${requestId}`,
      null,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response;
  } catch (error) {
    console.error(`Error rejecting request. ${error}`);
    throw error;
  }
};

export const unfriend = async (_id, token) => {
  console.log("_id : ", _id);
  console.log("token : ", token);
  try {
    const response = await axios.delete(
      `http://localhost:5000/api/friends/unfriend/${_id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response;
  } catch (error) {
    console.error(`Error : unable to unfriend. ${error}`);
  }
};
