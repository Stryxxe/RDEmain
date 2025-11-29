import React, { useState, useEffect } from "react";
import { usePage, router } from "@inertiajs/react";
import { FiSave, FiEdit2, FiShield } from "react-icons/fi";
import AdminLayout from "../../../Components/Layouts/AdminLayout";
import AvatarUpload from "../../../Components/AvatarUpload";
import axios from "axios";

const Profile = () => {
    const { auth } = usePage().props;
    const currentUser = auth?.user;

    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        email: "",
        avatar: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [password, setPassword] = useState({ current: "", new: "", confirm: "" });

    useEffect(() => {
        if (currentUser) {
            const avatarUrl = currentUser.avatar 
                ? `${window.location.origin}/storage/${currentUser.avatar}`
                : `https://ui-avatars.com/api/?name=${encodeURIComponent((currentUser.firstName || "") + " " + (currentUser.lastName || ""))}&background=3b82f6&color=fff`;
            
            setProfile({
                firstName: currentUser.firstName || "",
                lastName: currentUser.lastName || "",
                email: currentUser.email || "",
                avatar: avatarUrl,
            });
        }
    }, [currentUser]);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPassword((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await axios.put("/user", {
                firstName: profile.firstName,
                lastName: profile.lastName,
                email: profile.email,
            });

            setSuccess("Profile updated successfully!");
            setIsEditing(false);
            
            // Update avatar with new name
            setProfile(prev => ({
                ...prev,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.firstName + " " + profile.lastName)}&background=3b82f6&color=fff`,
            }));

            // Reload to update auth state (updates header/user display)
            router.reload({ only: ['auth'] });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (password.new !== password.confirm) {
            setError("New passwords do not match");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            await axios.post("/user/change-password", {
                current_password: password.current,
                new_password: password.new,
                new_password_confirmation: password.confirm,
            });

            setSuccess("Password changed successfully!");
            setPassword({ current: "", new: "", confirm: "" });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to change password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
                        <p className="mt-1 text-sm text-gray-600">Manage your account settings and preferences</p>
                    </div>
                </div>

                {/* Success/Error Messages */}
                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                        {success}
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="admin-card space-y-8">
                    {/* Profile Header */}
                    <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center sm:gap-6">
                        <AvatarUpload
                            currentAvatar={currentUser?.avatar}
                            firstName={profile.firstName}
                            lastName={profile.lastName}
                            onSuccess={(avatar) => {
                                setSuccess("Avatar updated successfully!");
                                setProfile(prev => ({ ...prev, avatar }));
                            }}
                            onError={(error) => setError(error)}
                        />
                        <div className="mt-4 sm:mt-0">
                            <h3 className="text-xl font-semibold text-gray-900 break-words max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                                {profile.firstName} {profile.lastName}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1 break-words">{profile.email}</p>
                        </div>
                        <div className="flex-1 sm:text-right sm:ml-auto mt-4 sm:mt-0">
                            {isEditing ? (
                                <div className="flex gap-2 justify-center sm:justify-end">
                                    <button 
                                        onClick={() => {
                                            setIsEditing(false);
                                            setError("");
                                            setSuccess("");
                                        }} 
                                        className="admin-button-secondary text-sm"
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSaveProfile} 
                                        className="admin-button-primary flex items-center space-x-2 text-sm"
                                        disabled={loading}
                                    >
                                        <FiSave className="w-4 h-4" />
                                        <span>{loading ? "Saving..." : "Save"}</span>
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => {
                                        setIsEditing(true);
                                        setError("");
                                        setSuccess("");
                                    }} 
                                    className="admin-button-primary flex items-center space-x-2 text-sm"
                                >
                                    <FiEdit2 className="w-4 h-4" />
                                    <span>Edit</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                <input type="text" name="firstName" value={profile.firstName} onChange={handleProfileChange} disabled={!isEditing} className="admin-input disabled:bg-gray-50 disabled:text-gray-500 w-full" maxLength={50} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <input type="text" name="lastName" value={profile.lastName} onChange={handleProfileChange} disabled={!isEditing} className="admin-input disabled:bg-gray-50 disabled:text-gray-500 w-full" maxLength={50} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input type="email" name="email" value={profile.email} onChange={handleProfileChange} disabled={!isEditing} className="admin-input disabled:bg-gray-50 disabled:text-gray-500 w-full" maxLength={100} />
                        </div>
                    </div>

                    {/* Change Password */}
                    <div className="border-t pt-2">
                        <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                            <FiShield className="w-5 h-5 mr-2 text-red-600" />
                            Change Password
                        </h3>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                <input type="password" name="current" value={password.current} onChange={handlePasswordChange} className="admin-input" placeholder="Enter current password" />
                            </div>
                            <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                                <div className="flex flex-col">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <input type="password" name="new" value={password.new} onChange={handlePasswordChange} className="admin-input w-full" placeholder="Enter new password" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                    <input type="password" name="confirm" value={password.confirm} onChange={handlePasswordChange} className="admin-input w-full" placeholder="Re-enter new password" />
                                </div>
                            </div>
                            <div className="pt-2">
                                <button 
                                    onClick={handleChangePassword} 
                                    className="admin-button-primary"
                                    disabled={loading}
                                >
                                    {loading ? "Updating..." : "Update Password"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Profile;