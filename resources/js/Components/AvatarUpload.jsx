import React, { useState } from "react";
import { FiCamera } from "react-icons/fi";
import { router } from "@inertiajs/react";
import axios from "axios";

const AvatarUpload = ({ currentAvatar, firstName, lastName, onSuccess, onError }) => {
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent((firstName || "") + " " + (lastName || ""))}&background=3b82f6&color=fff`;
    
    const displayAvatar = avatarPreview || (currentAvatar 
        ? `${window.location.origin}/storage/${currentAvatar}`
        : defaultAvatar);

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (2MB)
            if (file.size > 3072 * 1024) {
                onError && onError("Image size should not exceed 3MB");
            return;
        }

        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/jpg', 'image/gif'].includes(file.type)) {
            onError && onError("Only JPEG, PNG, JPG, and GIF images are allowed");
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Upload avatar
        setLoading(true);

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await axios.post("/user/avatar", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            onSuccess && onSuccess(response.data.avatar);
            setAvatarPreview(null);

            // Reload to update auth state
            setTimeout(() => {
                router.reload({ only: ['auth'] });
            }, 1000);
        } catch (err) {
            onError && onError(err.response?.data?.message || "Failed to upload avatar");
            setAvatarPreview(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative inline-block">
            <img 
                className="w-32 h-32 rounded-full border-4 border-gray-200 object-cover" 
                src={displayAvatar} 
                alt="Profile" 
            />
            <input
                type="file"
                id="avatar-upload"
                accept="image/jpeg,image/png,image/jpg,image/gif"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={loading}
            />
            <label
                htmlFor="avatar-upload"
                className={`absolute bottom-0 right-0 w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 shadow-lg cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <FiCamera className="w-5 h-5" />
            </label>
        </div>
    );
};

export default AvatarUpload;
