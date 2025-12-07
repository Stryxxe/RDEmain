import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";
// Removed context dependencies to avoid hook errors in Inertia layouts
import {
    MessageCircle,
    Send,
    Search,
    RefreshCw,
    User,
    Clock,
    AlertCircle,
    Trash2,
} from "lucide-react";
import AutoRefreshControls from "../Components/AutoRefreshControls";
import RefreshStatusIndicator from "../Components/RefreshStatusIndicator";
import axios from "axios";
import RoleBasedLayout from "../Components/Layouts/RoleBasedLayout";
import { AuthProvider } from "../contexts/AuthContext";
import { MessageProvider, useMessages } from "../contexts/MessageContext";
import { NotificationProvider } from "../contexts/NotificationContext";

// Use window.axios which has session-based auth configured, or configure this instance
const axiosInstance = window.axios || axios;
if (!window.axios) {
    axiosInstance.defaults.withCredentials = true;
    axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

const Messages = () => {
    const { url, props } = usePage();
    const searchParams = new URLSearchParams(url.split("?")[1] || "");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const [sendingMessage, setSendingMessage] = useState(false);
    const [availableCM, setAvailableCM] = useState(null);
    const [cmLoading, setCmLoading] = useState(false);
    const [showCompose, setShowCompose] = useState(false);
    const [composeData, setComposeData] = useState({
        recipient: "",
        subject: "",
        type: "general",
        content: "",
    });
    const [startingConversation, setStartingConversation] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    const user = props?.auth?.user;
    const {
        conversations,
        currentConversation,
        fetchConversations,
        fetchConversation,
        setCurrentConversation,
        sendMessage,
        markAllAsRead,
        fetchAvailableCM,
        fetchMessages,
        fetchSentMessages,
        fetchUnreadCount,
        clearAllMessages,
        refreshAllMessages,
        isRefreshing,
        lastRefresh,
        loading,
    } = useMessages();

    // Validate authentication on mount
    useEffect(() => {
        if (!user) {
            router.visit("/login");
            return;
        }
    }, [user]);

    // Check if user is a proponent
    const isProponent = user?.role?.userRole === "Proponent";

    // Fetch available CM for proponents
    useEffect(() => {
        if (isProponent) {
            setCmLoading(true);
            fetchAvailableCM()
                .then((data) => {
                    setAvailableCM(data);
                    setCmLoading(false);
                })
                .catch((error) => {
                    setCmLoading(false);
                });
        }
    }, [isProponent, fetchAvailableCM]);

    // Restore conversation from URL parameter after conversations are loaded
    useEffect(() => {
        if (conversations.length > 0 && !selectedConversation) {
            const conversationId = searchParams.get("conversation");
            if (conversationId) {
                const conversation = conversations.find(
                    (conv) =>
                        String(conv.otherUser.userID) === String(conversationId)
                );
                if (conversation) {
                    setSelectedConversation(conversation);
                    fetchConversation(conversation.otherUser.userID);
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversations, url]);

    const formatTime = (timestamp) => {
        if (!timestamp) return "Unknown time";

        const now = new Date();
        let notificationDate;

        // Handle different timestamp formats
        if (typeof timestamp === "string") {
            // Try parsing as ISO string first
            notificationDate = new Date(timestamp);

            // If that fails, try parsing as a different format
            if (isNaN(notificationDate.getTime())) {
                // Try parsing as Unix timestamp (if it's a number string)
                const numTimestamp = parseFloat(timestamp);
                if (!isNaN(numTimestamp)) {
                    notificationDate = new Date(numTimestamp * 1000); // Convert from seconds to milliseconds
                }
            }
        } else if (typeof timestamp === "number") {
            // Handle Unix timestamp (in seconds)
            notificationDate = new Date(timestamp * 1000);
        } else {
            notificationDate = new Date(timestamp);
        }

        // Check if the date is valid
        if (isNaN(notificationDate.getTime())) {
            return "Unknown time";
        }

        const diff = now - notificationDate;
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;

        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const formatMessageTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
        } else {
            return date.toLocaleDateString([], {
                month: "short",
                day: "numeric",
            });
        }
    };

    const filteredConversations = conversations.filter((conversation) => {
        // For proponents, show conversations with CM and RDD (administrators)
        if (isProponent) {
            const otherUserRole = conversation.otherUser?.role?.userRole;
            const isAllowedRole = otherUserRole === "CM" || otherUserRole === "RDD" || otherUserRole === "Admin";
            if (!isAllowedRole) return false;
        }

        const searchLower = searchTerm.toLowerCase();
        const otherUserName = conversation.otherUser?.fullName || "Unknown";
        const latestMessageContent = conversation.latestMessage?.content || "";
        const latestMessageSubject = conversation.latestMessage?.subject || "";

        return (
            otherUserName.toLowerCase().includes(searchLower) ||
            latestMessageContent.toLowerCase().includes(searchLower) ||
            latestMessageSubject.toLowerCase().includes(searchLower)
        );
    });

    const handleConversationClick = async (conversation) => {
        setSelectedConversation(conversation);
        // Update URL without causing navigation - just update the query parameter
        const newUrl = `${url.split("?")[0]}?conversation=${
            conversation.otherUser.userID
        }`;
        window.history.pushState({}, "", newUrl);
        // Fetch the conversation messages
        await fetchConversation(conversation.otherUser.userID);
    };

    const handleDeleteConversation = async (conversation, e) => {
        e.stopPropagation(); // Prevent conversation selection
        
        if (!window.confirm(`Are you sure you want to delete this conversation with ${conversation.otherUser.fullName || conversation.otherUser.firstName + ' ' + conversation.otherUser.lastName}? This will delete all messages.`)) {
            return;
        }
        
        try {
            await axiosInstance.delete(`/messages/conversation/${conversation.otherUser.userID}`, {
                withCredentials: true,
            });
            
            // Clear selected conversation if it was the one deleted
            if (selectedConversation?.otherUser.userID === conversation.otherUser.userID) {
                setSelectedConversation(null);
                setCurrentConversation(null);
                window.history.pushState({}, "", url.split("?")[0]);
            }
            
            // Refresh conversations
            await fetchConversations();
        } catch (error) {
            console.error("Error deleting conversation:", error);
            alert("Failed to delete conversation. Please try again.");
        }
    };

    // Search for users (CM and RDD for proponents)
    const handleSearchUsers = async (query) => {
        if (query.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        setSearchLoading(true);
        try {
            const response = await axiosInstance.get("/users/search", {
                params: { q: query, limit: 10 },
                headers: { Accept: "application/json" },
                withCredentials: true,
            });

            if (response.data.success && response.data.data) {
                // Proponents can search for CM and RDD users
                const filteredResults = response.data.data.filter((searchUser) => {
                    const userRole = searchUser.role?.toLowerCase();
                    
                    // Exclude self
                    if (searchUser.userID === user?.userID) {
                        return false;
                    }

                    // Proponents can chat with CM and RDD
                    if (userRole === "cm" || userRole === "rdd") {
                        return true;
                    }
                    return false;
                });

                setSearchResults(filteredResults);
            }
        } catch (error) {
            console.error("Error searching users:", error);
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const startConversationWithUser = async (targetUser) => {
        try {
            setStartingConversation(true);

            // Create a conversation by sending an initial message
            await sendMessage(
                String(targetUser.userID),
                "New Conversation",
                "Hello! I would like to start a conversation with you.",
                "general"
            );

            // Wait a bit for the message to be processed
            await new Promise((resolve) => setTimeout(resolve, 300));

            // Refresh conversations
            await fetchConversations();

            // Get updated conversations list
            const updatedResponse = await axiosInstance.get(
                "/messages/conversations",
                {
                    headers: { Accept: "application/json" },
                    withCredentials: true,
                }
            );

            if (updatedResponse.data.data) {
                // Update the conversations in the context
                const newConversation = updatedResponse.data.data.find(
                    (conv) =>
                        String(conv.otherUser.userID) === String(targetUser.userID)
                );

                if (newConversation) {
                    // Select the conversation
                    setSelectedConversation(newConversation);
                    await fetchConversation(targetUser.userID);
                    setSearchTerm("");
                    setSearchResults([]);
                }
            }
        } catch (error) {
            console.error("Error starting conversation:", error);
            alert("Failed to start conversation. Please try again.");
        } finally {
            setStartingConversation(false);
        }
    };

    const handleComposeMessage = async () => {
        // Placeholder: close modal for now as recipient lookup is not implemented here
        setShowCompose(false);
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || sendingMessage)
            return;

        setSendingMessage(true);
        try {
            const recipientID = String(selectedConversation.otherUser.userID);

            const result = await sendMessage(
                recipientID,
                `Re: ${selectedConversation.latestMessage.subject}`,
                newMessage,
                "reply"
            );

            setNewMessage("");

            // Refresh the conversation to show the new message
            await fetchConversation(recipientID);

            // Message sent successfully (no popup)
        } catch (error) {
            // Show error feedback
            const errorMessage =
                error.response?.data?.error ||
                error.message ||
                "Failed to send message. Please try again.";
            alert(`Failed to send message: ${errorMessage}`);
        } finally {
            setSendingMessage(false);
        }
    };

    const getTotalUnreadCount = () => {
        return conversations.reduce(
            (total, conversation) => total + conversation.unreadCount,
            0
        );
    };

    const clearConversation = () => {
        setSelectedConversation(null);
        setCurrentConversation(null);
        // Update URL without causing navigation
        const baseUrl = url.split("?")[0];
        window.history.pushState({}, "", baseUrl);
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                            <p className="text-sm text-gray-600 mt-1">Communicate with reviewers, center managers, and administrators</p>
                        </div>
                        <button
                            onClick={async () => {
                                await refreshAllMessages();
                                if (selectedConversation) {
                                    await fetchConversation(
                                        selectedConversation.otherUser.userID
                                    );
                                }
                            }}
                            disabled={isRefreshing}
                            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 whitespace-nowrap"
                        >
                            <RefreshCw
                                className={`w-4 h-4 ${
                                    isRefreshing ? "animate-spin" : ""
                                }`}
                            />
                            <span className="hidden sm:inline">
                                {isRefreshing ? "Refreshing..." : "Refresh"}
                            </span>
                        </button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {getTotalUnreadCount() > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                            >
                                Mark All as Read
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Conversations List */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        {/* Search */}
                        <div className="p-4 border-b border-gray-200">
                            <div className="relative">
                                <Search
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                    size={16}
                                />
                                <input
                                    type="text"
                                    placeholder="Search conversations or users..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        handleSearchUsers(e.target.value);
                                    }}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                                />
                            </div>
                        </div>

                        {/* Conversations List */}
                        <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
                            {/* Show search results when searching */}
                            {searchTerm.length >= 2 && searchResults.length > 0 && (
                                <div className="p-4 border-b border-gray-200 bg-purple-50">
                                    <p className="text-xs text-purple-700 mb-3 font-semibold">
                                        Search Results ({searchResults.length})
                                    </p>
                                    <div className="space-y-2">
                                        {searchResults.map((searchUser) => (
                                            <div
                                                key={searchUser.userID}
                                                className="p-3 bg-white rounded-lg border border-purple-200"
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
                                                        <User className="w-4 h-4 text-purple-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-semibold text-purple-900">
                                                            {searchUser.firstName} {searchUser.lastName}
                                                        </h4>
                                                        <p className="text-xs text-purple-600">
                                                            {searchUser.role}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        startConversationWithUser(searchUser)
                                                    }
                                                    disabled={startingConversation}
                                                    className="w-full px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                                >
                                                    {startingConversation
                                                        ? "Starting..."
                                                        : "Chat"}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Show "No search results" when search returns empty */}
                            {searchTerm.length >= 2 &&
                                searchLoading === false &&
                                searchResults.length === 0 && (
                                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                                        <p className="text-xs text-gray-600 text-center">
                                            No users found matching "{searchTerm}"
                                        </p>
                                    </div>
                                )}

                            {/* Show loading state */}
                            {searchLoading && (
                                <div className="p-4 border-b border-gray-200 bg-gray-50">
                                    <p className="text-xs text-gray-600 text-center">
                                        Searching...
                                    </p>
                                </div>
                            )}

                            {/* Show "Start Conversation" when there are no conversations at all */}
                            {conversations.length === 0 && !loading && !isRefreshing && (
                                <>
                                    {/* Proponent: Show CM to start conversation */}
                                    {isProponent && availableCM && (
                                        <div className="p-4 border-b border-gray-200 bg-blue-50">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                                                    <User className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-semibold text-blue-900">
                                                        {
                                                            availableCM.cm
                                                                .fullName
                                                        }
                                                    </h4>
                                                    <p className="text-xs text-blue-600">
                                                        Center Manager -{" "}
                                                        {
                                                            availableCM.cm
                                                                .department
                                                                ?.name
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-blue-700 mb-3">
                                                You can start a conversation
                                                with your department's Center
                                                Manager.
                                            </p>
                                            <button
                                                onClick={async (e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();

                                                    // Prevent double clicks
                                                    if (startingConversation)
                                                        return;

                                                    try {
                                                        setStartingConversation(
                                                            true
                                                        );

                                                        // Create a conversation by sending an initial message
                                                        await sendMessage(
                                                            String(
                                                                availableCM.cm
                                                                    .userID
                                                            ),
                                                            "New Conversation",
                                                            "Hello! I would like to start a conversation with you.",
                                                            "general"
                                                        );

                                                        // Wait a bit for the message to be processed
                                                        await new Promise(
                                                            (resolve) =>
                                                                setTimeout(
                                                                    resolve,
                                                                    300
                                                                )
                                                        );

                                                        // Wait for conversations to refresh
                                                        await fetchConversations();

                                                        // Refetch conversations directly to get the updated list
                                                        const response =
                                                            await axiosInstance.get(
                                                                "/messages/conversations",
                                                                {
                                                                    headers: {
                                                                        Accept: "application/json",
                                                                    },
                                                                    withCredentials: true,
                                                                }
                                                            );

                                                        const updatedConversations =
                                                            response.data
                                                                .data || [];

                                                        // Find the new conversation
                                                        const newConversation =
                                                            updatedConversations.find(
                                                                (conv) =>
                                                                    String(
                                                                        conv
                                                                            .otherUser
                                                                            .userID
                                                                    ) ===
                                                                    String(
                                                                        availableCM
                                                                            .cm
                                                                            .userID
                                                                    )
                                                            );

                                                        if (newConversation) {
                                                            // Select the conversation
                                                            setSelectedConversation(
                                                                newConversation
                                                            );
                                                            await fetchConversation(
                                                                availableCM.cm
                                                                    .userID
                                                            );
                                                        }
                                                    } catch (error) {
                                                        console.error(
                                                            "Error starting conversation:",
                                                            error
                                                        );
                                                        alert(
                                                            "Failed to start conversation. Please try again."
                                                        );
                                                    } finally {
                                                        setStartingConversation(
                                                            false
                                                        );
                                                    }
                                                }}
                                                disabled={startingConversation}
                                                className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {startingConversation
                                                    ? "Starting..."
                                                    : "Start Conversation"}
                                            </button>
                                        </div>
                                    )}

                                    {/* Empty state when no conversations */}
                                    <div className="p-6 text-center text-gray-500">
                                        <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                        <p className="text-sm">
                                            {isProponent
                                                ? "No conversations with Center Managers"
                                                : "No conversations found"}
                                        </p>
                                        {isProponent && availableCM && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                Use the "Start Conversation"
                                                button above to begin
                                            </p>
                                        )}
                                        {!isProponent && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                Start a new conversation by
                                                composing a message
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Show conversations if they exist */}
                            {conversations.length > 0 &&
                            filteredConversations.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">
                                    <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">
                                        No conversations match your search
                                    </p>
                                </div>
                            ) : conversations.length > 0 &&
                              filteredConversations.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {filteredConversations.map(
                                        (conversation) => (
                                            <div
                                                key={
                                                    conversation.otherUser
                                                        .userID
                                                }
                                                onClick={() =>
                                                    handleConversationClick(
                                                        conversation
                                                    )
                                                }
                                                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                                                    selectedConversation
                                                        ?.otherUser.userID ===
                                                    conversation.otherUser
                                                        .userID
                                                        ? "bg-red-50 border-r-2 border-red-600"
                                                        : ""
                                                } ${
                                                    conversation.unreadCount > 0
                                                        ? "bg-blue-50"
                                                        : ""
                                                }`}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                            <User className="w-5 h-5 text-gray-500" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                                                                {
                                                                    conversation
                                                                        .otherUser
                                                                        .fullName
                                                                }
                                                            </h4>
                                                            <p className="text-xs text-gray-400 truncate">
                                                                {conversation
                                                                    .otherUser
                                                                    .email}
                                                            </p>
                                                            <p className="text-xs text-gray-500 truncate">
                                                                {conversation
                                                                    .otherUser
                                                                    .role
                                                                    ?.userRole ||
                                                                    "User"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => handleDeleteConversation(conversation, e)}
                                                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Delete conversation"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                        <span className="text-xs text-gray-500">
                                                            {formatTime(
                                                                conversation
                                                                    .latestMessage
                                                                    .created_at
                                                            )}
                                                        </span>
                                                        {conversation.unreadCount >
                                                            0 && (
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-1 line-clamp-1">
                                                    {
                                                        conversation
                                                            .latestMessage
                                                            .subject
                                                    }
                                                </p>
                                                <p className="text-xs text-gray-500 line-clamp-1">
                                                    {conversation.latestMessage.content?.substring(
                                                        0,
                                                        60
                                                    ) +
                                                        (conversation
                                                            .latestMessage
                                                            .content?.length >
                                                        60
                                                            ? "..."
                                                            : "")}
                                                </p>
                                                {conversation.unreadCount >
                                                    0 && (
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                                            {
                                                                conversation.unreadCount
                                                            }{" "}
                                                            unread
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            {
                                                                conversation.totalMessages
                                                            }{" "}
                                                            messages
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* Conversation Detail */}
                <div className="lg:col-span-2">
                    {selectedConversation && currentConversation ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
                            {/* Conversation Header */}
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-gray-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold text-gray-900">
                                                {
                                                    selectedConversation
                                                        .otherUser.fullName
                                                }
                                            </h2>
                                            <p className="text-xs text-gray-500">
                                                {selectedConversation.otherUser
                                                    .email}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {selectedConversation.otherUser
                                                    .role?.userRole || "User"}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={clearConversation}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                        title="Close conversation"
                                    >
                                        <svg
                                            className="w-6 h-6"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 p-6 overflow-y-auto max-h-96">
                                <div className="space-y-4">
                                    {currentConversation.map(
                                        (message, index) => {
                                            const isFromCurrentUser =
                                                message.senderID !==
                                                selectedConversation.otherUser
                                                    .userID;
                                            const showDate =
                                                index === 0 ||
                                                new Date(
                                                    message.created_at
                                                ).toDateString() !==
                                                    new Date(
                                                        currentConversation[
                                                            index - 1
                                                        ].created_at
                                                    ).toDateString();

                                            return (
                                                <div key={message.id}>
                                                    {showDate && (
                                                        <div className="flex justify-center my-4">
                                                            <span className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                                                {new Date(
                                                                    message.created_at
                                                                ).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div
                                                        className={`flex ${
                                                            isFromCurrentUser
                                                                ? "justify-end"
                                                                : "justify-start"
                                                        }`}
                                                    >
                                                        <div
                                                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                                                isFromCurrentUser
                                                                    ? "bg-red-600 text-white"
                                                                    : "bg-gray-100 text-gray-900"
                                                            }`}
                                                        >
                                                            <p className="text-sm whitespace-pre-wrap">
                                                                {
                                                                    message.content
                                                                }
                                                            </p>
                                                            <p
                                                                className={`text-xs mt-1 ${
                                                                    isFromCurrentUser
                                                                        ? "text-red-100"
                                                                        : "text-gray-500"
                                                                }`}
                                                            >
                                                                {formatMessageTime(
                                                                    message.created_at
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            </div>

                            {/* Reply Section */}
                            <div className="p-6 border-t border-gray-200">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Reply
                                        </label>
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) =>
                                                setNewMessage(e.target.value)
                                            }
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                            placeholder="Type your reply here..."
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={
                                                !newMessage.trim() ||
                                                sendingMessage
                                            }
                                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Send size={16} />
                                            {sendingMessage
                                                ? "Sending..."
                                                : "Send Reply"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-96 flex items-center justify-center">
                            <div className="text-center text-gray-500">
                                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>Select a conversation to view</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Compose Message Modal */}
            {showCompose && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Compose Message
                                </h3>
                                <button
                                    onClick={() => setShowCompose(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg
                                        className="w-6 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    To
                                </label>
                                <input
                                    type="text"
                                    value={composeData.recipient}
                                    onChange={(e) =>
                                        setComposeData({
                                            ...composeData,
                                            recipient: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    placeholder="Enter recipient name or email"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    value={composeData.subject}
                                    onChange={(e) =>
                                        setComposeData({
                                            ...composeData,
                                            subject: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    placeholder="Enter message subject"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Message Type
                                </label>
                                <select
                                    value={composeData.type}
                                    onChange={(e) =>
                                        setComposeData({
                                            ...composeData,
                                            type: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="general">General</option>
                                    <option value="review">Review</option>
                                    <option value="revision">Revision</option>
                                    <option value="meeting">Meeting</option>
                                    <option value="status">Status</option>
                                    <option value="security">Security</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Message
                                </label>
                                <textarea
                                    value={composeData.content}
                                    onChange={(e) =>
                                        setComposeData({
                                            ...composeData,
                                            content: e.target.value,
                                        })
                                    }
                                    rows={6}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    placeholder="Type your message here..."
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setShowCompose(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleComposeMessage}
                                disabled={
                                    !composeData.recipient.trim() ||
                                    !composeData.subject.trim() ||
                                    !composeData.content.trim()
                                }
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={16} />
                                Send Message
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

Messages.layout = (page) => (
    <AuthProvider>
        <MessageProvider>
            <NotificationProvider>
                <RoleBasedLayout>{page}</RoleBasedLayout>
            </NotificationProvider>
        </MessageProvider>
    </AuthProvider>
);

export default Messages;
