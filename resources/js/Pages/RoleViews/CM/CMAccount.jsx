import React, { useState, useEffect } from "react";
import { router, Link } from "@inertiajs/react";
import { User, Mail, Building, Shield, Save, LogOut } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import RoleBasedLayout from "../../../Components/Layouts/RoleBasedLayout";
import AppLayout from "../../../Components/Layouts/AppLayout";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import AvatarUpload from "../../../Components/AvatarUpload";

const CMAccount = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        department: "",
        role: "",
        researchCenter: "",
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    
    // Password change state
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");

    // Validate authentication on mount
    useEffect(() => {
        if (!user) {
            router.visit("/login");
            return;
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            // Handle department name - check both 'name' and 'departmentName'
            const departmentName =
                user.department?.name ||
                user.department?.departmentName ||
                user.department ||
                "";

            setFormData({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                email: user.email || "",
                department: departmentName,
                role: user.role?.userRole || "",
                researchCenter: departmentName,
            });
        }
    }, [user]);

    // Auto-dismiss success message after 3 seconds
    useEffect(() => {
        if (message && message.includes("successfully")) {
            const timer = setTimeout(() => {
                setMessage("");
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handlePasswordChange = async () => {
        setPasswordError("");
        setPasswordSuccess("");

        // Validation
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setPasswordError("All fields are required");
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError("New passwords do not match");
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setPasswordError("New password must be at least 8 characters");
            return;
        }

        try {
            const response = await window.axios.post("/api/user/change-password", {
                current_password: passwordData.currentPassword,
                new_password: passwordData.newPassword,
                new_password_confirmation: passwordData.confirmPassword,
            });

            if (response.data.success) {
                setPasswordSuccess("Password changed successfully!");
                setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                });
                setTimeout(() => {
                    setChangingPassword(false);
                    setPasswordSuccess("");
                }, 2000);
            }
        } catch (error) {
            setPasswordError(
                error.response?.data?.message || "Failed to change password. Please try again."
            );
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage("");

            const response = await window.axios.put(
                "/api/user",
                {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                },
                {
                    headers: { Accept: "application/json" },
                    withCredentials: true,
                }
            );

            if (response.data) {
                setMessage("Profile updated successfully!");
                setEditing(false);
            }
        } catch (error) {
            setMessage("Failed to update profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">
                        Loading account information...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full -m-2 sm:-m-4 md:-m-6 lg:-m-8">
            <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 pt-6 pb-2">
                <Breadcrumbs items={[
                    { label: 'Account Settings', href: null }
                ]} />
            </div>
            {/* Header Section - Constrained Width with more top spacing */}
            <div className="max-w-6xl mx-auto mb-8 px-2 sm:px-4 md:px-6 lg:px-8 pt-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Account Settings
                </h1>
                <p className="text-gray-600">
                    Manage your account information and preferences
                </p>
            </div>

            {/* Message Section - Constrained Width */}
            {message && (
                <div className="max-w-6xl mx-auto mb-6 px-2 sm:px-4 md:px-6 lg:px-8">
                    <div
                        className={`p-4 rounded-lg ${
                            message.includes("successfully")
                                ? "bg-green-50 border border-green-200 text-green-800"
                                : "bg-red-50 border border-red-200 text-red-800"
                        }`}
                    >
                        {message}
                    </div>
                </div>
            )}

            {/* Content Section - Centered with consistent width */}
            <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Avatar Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full">
                        <div className="flex flex-col items-center space-y-4">
                            <AvatarUpload
                                currentAvatar={user?.avatar}
                                firstName={formData.firstName}
                                lastName={formData.lastName}
                                onSuccess={(avatar) => setMessage("Avatar updated successfully!")}
                                onError={(error) => setMessage(error)}
                            />
                            <div className="text-center">
                                <h3 className="text-xl font-semibold text-gray-900">
                                    {formData.firstName} {formData.lastName}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">{formData.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Profile Information */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold text-gray-900">
                                Profile Information
                            </h2>
                            <button
                                onClick={() => setEditing(!editing)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                {editing ? "Cancel" : "Edit Profile"}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-base font-medium text-gray-700 mb-2">
                                    <User className="inline w-4 h-4 mr-2" />
                                    First Name
                                </label>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "firstName",
                                                e.target.value
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    />
                                ) : (
                                    <p className="text-gray-900 py-2 text-base">
                                        {formData.firstName || "Not specified"}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-base font-medium text-gray-700 mb-2">
                                    <User className="inline w-4 h-4 mr-2" />
                                    Last Name
                                </label>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "lastName",
                                                e.target.value
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    />
                                ) : (
                                    <p className="text-gray-900 py-2 text-base">
                                        {formData.lastName || "Not specified"}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-base font-medium text-gray-700 mb-2">
                                    <Mail className="inline w-4 h-4 mr-2" />
                                    Email Address
                                </label>
                                {editing ? (
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) =>
                                            handleInputChange(
                                                "email",
                                                e.target.value
                                            )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    />
                                ) : (
                                    <p className="text-gray-900 py-2 text-base">
                                        {formData.email || "Not specified"}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-base font-medium text-gray-700 mb-2">
                                    <Building className="inline w-4 h-4 mr-2" />
                                    Department
                                </label>
                                <p className="text-gray-900 py-2 text-base">
                                    {formData.department || "Not specified"}
                                </p>
                            </div>

                            <div>
                                <label className="block text-base font-medium text-gray-700 mb-2">
                                    <Shield className="inline w-4 h-4 mr-2" />
                                    Role
                                </label>
                                <p className="text-gray-900 py-2 text-base">
                                    {formData.role || "Not specified"}
                                </p>
                            </div>

                            <div>
                                <label className="block text-base font-medium text-gray-700 mb-2">
                                    <Building className="inline w-4 h-4 mr-2" />
                                    Research Center
                                </label>
                                <p className="text-gray-900 py-2 text-base">
                                    {formData.researchCenter || "Not specified"}
                                </p>
                            </div>
                        </div>

                        {editing && (
                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Security Settings */}
                    <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            Security Settings
                        </h2>

                        {!changingPassword ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                    <div>
                                        <h3 className="text-base font-medium text-gray-900">
                                            Change Password
                                        </h3>
                                        <p className="text-base text-gray-500">
                                            Update your password to keep your
                                            account secure
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setChangingPassword(true)}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Change
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {passwordError && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-sm text-red-600">{passwordError}</p>
                                    </div>
                                )}
                                
                                {passwordSuccess && (
                                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <p className="text-sm text-green-600">{passwordSuccess}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) =>
                                            setPasswordData({
                                                ...passwordData,
                                                currentPassword: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="Enter current password"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) =>
                                            setPasswordData({
                                                ...passwordData,
                                                newPassword: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="Enter new password (min. 8 characters)"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) =>
                                            setPasswordData({
                                                ...passwordData,
                                                confirmPassword: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="Confirm new password"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={handlePasswordChange}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                    >
                                        Update Password
                                    </button>
                                    <button
                                        onClick={() => {
                                            setChangingPassword(false);
                                            setPasswordData({
                                                currentPassword: "",
                                                newPassword: "",
                                                confirmPassword: "",
                                            });
                                            setPasswordError("");
                                            setPasswordSuccess("");
                                        }}
                                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Logout Section */}
                    <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                            Account Actions
                        </h2>

                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                            <div>
                                <h3 className="text-base font-medium text-gray-900">
                                    Sign Out
                                </h3>
                                <p className="text-base text-gray-500">
                                    Sign out of your account on this device
                                </p>
                            </div>
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                onBefore={() =>
                                    localStorage.removeItem(
                                        "dismissedNotifications"
                                    )
                                }
                                className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

CMAccount.layout = (page) => (
    <AppLayout>
        <RoleBasedLayout roleName="Center Manager">{page}</RoleBasedLayout>
    </AppLayout>
);

export default CMAccount;
