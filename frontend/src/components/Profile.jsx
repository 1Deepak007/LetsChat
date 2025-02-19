import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import toast styles
import axios from 'axios'; // For making API requests
import { jwtDecode } from 'jwt-decode';
import { fetchFriendsList } from './functions/friends';
import { isTokenValid } from './functions/friends';

const ProfileSchema = Yup.object().shape({
    firstName: Yup.string().required('First Name is required'),
    lastName: Yup.string(),
    username: Yup.string().required('Username is required'),
    currentLocation: Yup.string(),
    hometown: Yup.string(),
    profession: Yup.string(),
    hobbies: Yup.string(), // Consider a better way to handle multiple hobbies (e.g., array)
    favoritePlaces: Yup.string(), // Same as hobbies
    bio: Yup.string(),
});

const Profile = ({ token }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);


    const fetchUserProfile = async (userId) => {
        if (!token || !isTokenValid(token)) {
            console.error("Token is missing or expired.");
            return;
        }

        try {
            const response = await axios.get(`http://localhost:5000/api/profile/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCurrentUser({ ...response.data, password: '**********' });
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };
    console.log('current user : ',currentUser)


    useEffect(() => {
        if (!token || !isTokenValid(token)) return;

        const decodedToken = jwtDecode(token);
        console.log(decodedToken);
        setCurrentUserId(decodedToken.id);

        fetchUserProfile(decodedToken.id);
        fetchFriendsList(decodedToken.id);
    }, [token]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // const token = localStorage.getItem('token'); 
                const response = await axios.get(`http://localhost:5000/api/profile/${currentUserId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setUser(response.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put('/api/profile/update-profile', values, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setUser(response.data.user); // Update user state with the returned data
            toast.success('Profile updated successfully!'); // Display success toast
        } catch (err) {
            console.error("Update profile error:", err);
            toast.error('Error updating profile.'); // Display error toast
        } finally {
            setSubmitting(false);
        }
    };

    const handleProfilePictureChange = async (event) => {
        const file = event.target.files[0];
        const formData = new FormData();
        formData.append('profilePicture', file);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.put('/api/profile/update-profile-picture', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data', // Important for file uploads
                },
            });
            setUser(response.data.user);
            toast.success('Profile picture updated!');
        } catch (error) {
            toast.error("Error updating profile picture");
            console.error("Error updating profile picture", error);
        }
    };

    if (loading) {
        return <div>Loading...</div>; // Or a nice spinner
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!user) {
        return <div>User not found.</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Profile</h2>

            <div className="mb-4">
                <img
                    src={user.profilePicture || 'default_profile_image.jpg'} // Provide a default image
                    alt="Profile"
                    className="w-32 h-32 rounded-full mx-auto mb-2"
                />
                <input type="file" onChange={handleProfilePictureChange} className="block mx-auto" />
            </div>

            <Formik
                initialValues={{
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    username: user.username || '',
                    currentLocation: user.currentLocation || '',
                    hometown: user.hometown || '',
                    profession: user.profession || '',
                    hobbies: user.hobbies ? user.hobbies.join(',') : '', // Convert array to comma-separated string for input
                    favoritePlaces: user.favoritePlaces ? user.favoritePlaces.join(',') : '',
                    bio: user.bio || '',
                }}
                validationSchema={ProfileSchema}
                onSubmit={handleSubmit}
                enableReinitialize // Important: This makes sure form values are updated when user data changes
            >
                {({ isSubmitting }) => (
                    <Form className="space-y-4">
                        {/* Example field (repeat for other fields) */}
                        <div>
                            <label htmlFor="firstName" className="block text-gray-700 font-bold mb-2">First Name</label>
                            <Field
                                type="text"
                                name="firstName"
                                id="firstName"
                                className="border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <ErrorMessage name="firstName" component="div" className="text-red-500" />
                        </div>
                        {/* Add more fields here */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </Form>
                )}
            </Formik>
            <ToastContainer /> {/* Include the ToastContainer */}
        </div>
    );
};

export default Profile;