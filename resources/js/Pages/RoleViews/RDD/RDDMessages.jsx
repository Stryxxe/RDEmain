import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";
import {
    MessageCircle,
    Send,
    Search,
    RefreshCw,
    User,
    Clock,
    AlertCircle,
    X,
    Trash2,
} from "lucide-react";
import axios from "axios";
import RoleBasedLayout from "../../../Components/Layouts/RoleBasedLayout";

const axiosInstance = window.axios || axios;
if (!window.axios) {
    axiosInstance.defaults.withCredentials = true;
    axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

const RDDMessages = () => {
    const { props, url } = usePage();
    const user = props?.auth?.user;
    const searchParams = new URLSearchParams(url.split("?")[1] || "");
    
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [sendingMessage, setSendingMessage] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [startingConversation, setStartingConversation] = useState(false);

    useEffect(() => {
        if (!user) {
            router.visit("/login");
            return;
        }
        fetchConversations();
    }, [user]);

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

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get("/messages/conversations", {
                headers: { Accept: "application/json" },
                withCredentials: true,
            });
            setConversations(response.data?.data || []);
        } catch (error) {
            console.error("Error fetching conversations:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchConversation = async (otherUserId) => {
        try {
            const response = await axiosInstance.get(`/messages/conversation/${otherUserId}`, {
                headers: { Accept: "application/json" },
                withCredentials: true,
            });
            setCurrentConversation(response.data?.data || []);
        } catch (error) {
            console.error("Error fetching conversation:", error);
            setCurrentConversation([]);
        }
    };

    const handleRefresh = async () => {
        try {
            setIsRefreshing(true);
            await fetchConversations();
            if (selectedConversation) {
                await fetchMessages(selectedConversation.otherUser.userID);
            }
        } catch (error) {
            console.error("Refresh failed:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Search for users to start new conversations
    const handleSearchUsers = async (query) => {
        if (query.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        setSearchLoading(true);
        try {
            const response = await axiosInstance.get("/users/search-all", {
                params: { q: query, limit: 20 },
                headers: { Accept: "application/json" },
                withCredentials: true,
            });

            if (response.data.success && response.data.data) {
                // RDD can message anyone - backend already excludes self
                const filteredResults = response.data.data;

                setSearchResults(filteredResults);
            }
        } catch (error) {
            console.error("Error searching users:", error);
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    };

    // Start conversation with a user from search results
    const startConversationWithUser = async (searchUser) => {
        if (startingConversation) return;

        try {
            setStartingConversation(true);

            // Send initial message to create conversation
            const messageResponse = await axiosInstance.post('/messages', {
                recipientID: String(searchUser.userID),
                subject: `Message to ${searchUser.firstName} ${searchUser.lastName}`,
                content: "Hello! I would like to start a conversation with you.",
                type: 'general'
            }, {
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                withCredentials: true
            });
            
            console.log("Initial message sent to", searchUser.firstName, searchUser.lastName, ":", messageResponse.data);

            // Wait a bit for the message to be processed
            await new Promise((resolve) => setTimeout(resolve, 300));

            // Refresh conversations
            await fetchConversations();

            // Get updated conversations list
            const updatedResponse = await axiosInstance.get("/messages/conversations", {
                headers: { Accept: "application/json" },
                withCredentials: true,
            });

            if (updatedResponse.data.data) {
                setConversations(updatedResponse.data.data);

                // Find the new conversation
                const newConversation = updatedResponse.data.data.find(
                    (conv) => String(conv.otherUser.userID) === String(searchUser.userID)
                );

                if (newConversation) {
                    // Select the conversation
                    setSelectedConversation(newConversation);
                    await fetchConversation(searchUser.userID);
                }
            }

            // Clear search
            setSearchTerm("");
            setSearchResults([]);
        } catch (error) {
            console.error("Error starting conversation:", error);
            alert("Failed to start conversation. Please try again.");
        } finally {
            setStartingConversation(false);
        }
    };

    const handleConversationClick = async (conversation) => {
        setSelectedConversation(conversation);
        // Update URL without causing navigation
        const newUrl = `${url.split("?")[0]}?conversation=${conversation.otherUser.userID}`;
        window.history.pushState({}, "", newUrl);
        // Fetch the conversation messages
        await fetchConversation(conversation.otherUser.userID);
    };

    const handleDeleteConversation = async (conversation, e) => {
        e.stopPropagation();
        
        if (!window.confirm(`Are you sure you want to delete this conversation with ${conversation.otherUser.firstName} ${conversation.otherUser.lastName}? This will delete all messages.`)) {
            return;
        }
        
        try {
            await axiosInstance.delete(`/messages/conversation/${conversation.otherUser.userID}`, {
                withCredentials: true,
            });
            
            if (selectedConversation?.otherUser.userID === conversation.otherUser.userID) {
                setSelectedConversation(null);
                setCurrentConversation(null);
                window.history.pushState({}, "", url.split("?")[0]);
            }
            
            await fetchConversations();
        } catch (error) {
            console.error("Error deleting conversation:", error);
            alert("Failed to delete conversation. Please try again.");
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

        setSendingMessage(true);
        try {
            const response = await axiosInstance.post('/messages', {
                recipientID: String(selectedConversation.otherUser.userID),
                subject: `Message to ${selectedConversation.otherUser.fullName || selectedConversation.otherUser.firstName + ' ' + selectedConversation.otherUser.lastName}`,
                content: newMessage,
                type: 'reply'
            }, {
                headers: { Accept: "application/json", "Content-Type": "application/json" },
                withCredentials: true,
            });
            console.log("Message sent successfully:", response.data);
            setNewMessage("");
            await fetchConversation(selectedConversation.otherUser.userID);
            await fetchConversations();
        } catch (error) {
            console.error("Error sending message:", error);
            console.error("Error details:", error.response?.data);
            alert(`Failed to send message: ${error.response?.data?.error || error.message}`);
        } finally {
            setSendingMessage(false);
        }
    };

    const clearConversation = () => {
        setSelectedConversation(null);
        setCurrentConversation(null);
        // Clear URL parameter
        window.history.pushState({}, "", url.split("?")[0]);
    };

    const handleUserQuickSelect = (userToChat) => {
        setSelectedUser(userToChat);
        setGlobalUserSearch("");
        setGlobalUserResults([]);
        setSelectedConversation(null);
        setMessages([]);
    };

    const handleStartNewConversation = async (e) => {
        e.preventDefault();
        if (!composeMessage.trim() || !selectedUser) return;

        setSendingMessage(true);
        try {
            await axiosInstance.post('/messages', {
                recipientID: String(selectedUser.userID),
                subject: `Message to ${selectedUser.firstName} ${selectedUser.lastName}`,
                content: composeMessage,
                type: 'general'
            });
            setComposeMessage("");
            setSelectedUser(null);
            setSearchUsers("");
            fetchConversations();
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message");
        } finally {
            setSendingMessage(false);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return "Unknown time";
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const formatMessageTime = (timestamp) => {
        if (!timestamp) return "";
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = date.toDateString() === yesterday.toDateString();

        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (isYesterday) {
            return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return date.toLocaleString([], { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    const filteredConversations = conversations.filter((conv) => {
        const name = `${conv.otherUser.firstName} ${conv.otherUser.lastName}`.toLowerCase();
        return name.includes(searchTerm.toLowerCase());
    });

    const getTotalUnreadCount = () =>
        conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);

    const getConversationTime = (conv) => {
        const timestamp = conv?.latestMessage?.created_at || conv?.lastMessageAt || conv?.updated_at;
        if (!timestamp) return "No messages yet";
        return formatTime(timestamp);
    };

    const markAllAsRead = async () => {
        try {
            await axiosInstance.post('/messages/mark-all-read', {}, {
                headers: { Accept: "application/json" },
                withCredentials: true,
            });
            await fetchConversations();
            if (selectedConversation) {
                await fetchMessages(selectedConversation.otherUser.userID);
            }
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    return (
        <RoleBasedLayout>
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                                <button
                                    onClick={handleRefresh}
                                    disabled={isRefreshing}
                                    className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                                >
                                    <RefreshCw
                                        className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
                                    />
                                    <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
                                </button>
                                {getTotalUnreadCount() > 0 && (
                                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
                                        {getTotalUnreadCount()} unread
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
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
                                                            <p className="text-xs text-purple-500">
                                                                {searchUser.email}
                                                            </p>
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
                                {/* Show conversations if they exist */}
                                {conversations.length === 0 && searchTerm.length < 2 ? (
                                    <div className="p-6 text-center text-gray-500">
                                        <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                        <p className="text-sm">No conversations yet</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Use the search above to find users and start chatting
                                        </p>
                                    </div>
                                ) : conversations.length > 0 && filteredConversations.length === 0 && searchTerm.length < 2 ? (
                                    <div className="p-6 text-center text-gray-500">
                                        <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                        <p className="text-sm">No conversations match your search</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {loading ? (
                                            <div className="flex items-center justify-center h-32">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-900"></div>
                                            </div>
                                        ) : (
                                            filteredConversations.map((conv) => (
                                                <div
                                                    key={conv.otherUser.userID}
                                                    onClick={() => handleConversationClick(conv)}
                                                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                                                        selectedConversation?.otherUser.userID === conv.otherUser.userID
                                                            ? "bg-red-50 border-r-2 border-red-600"
                                                            : ""
                                                    } ${
                                                        conv.unreadCount > 0
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
                                                                    {conv.otherUser.firstName} {conv.otherUser.lastName}
                                                                </h4>
                                                                <p className="text-xs text-gray-400 truncate">
                                                                    {conv.otherUser.email}
                                                                </p>
                                                                <p className="text-xs text-gray-500 truncate">
                                                                    {conv.otherUser.role?.userRole || "User"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={(e) => handleDeleteConversation(conv, e)}
                                                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                    title="Delete conversation"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                                <span className="text-xs text-gray-400">
                                                                    {getConversationTime(conv)}
                                                                </span>
                                                            </div>
                                                            {conv.unreadCount > 0 && (
                                                                <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-semibold rounded-full">
                                                                    {conv.unreadCount}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {conv.latestMessage && (
                                                        <p className="text-xs text-gray-500 truncate ml-[52px]">
                                                            {conv.latestMessage.content}
                                                        </p>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
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
                                                    {selectedConversation.otherUser.fullName || 
                                                     `${selectedConversation.otherUser.firstName} ${selectedConversation.otherUser.lastName}`}
                                                </h2>
                                                <p className="text-xs text-gray-500">
                                                    {selectedConversation.otherUser.email}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {selectedConversation.otherUser.role?.userRole || "User"}
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
                                <div className="flex-1 p-5 overflow-y-auto max-h-[calc(100vh-480px)]">
                                    <div className="space-y-4">
                                        {currentConversation.map((message, index) => {
                                            const isFromCurrentUser = message.senderID !== selectedConversation.otherUser.userID;
                                            const showDate = index === 0 || 
                                                new Date(message.created_at).toDateString() !== 
                                                new Date(currentConversation[index - 1].created_at).toDateString();

                                            return (
                                                <div key={message.id}>
                                                    {showDate && (
                                                        <div className="flex justify-center my-4">
                                                            <span className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                                                {new Date(message.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className={`flex ${isFromCurrentUser ? "justify-end" : "justify-start"}`}>
                                                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                                            isFromCurrentUser
                                                                ? "bg-red-600 text-white"
                                                                : "bg-gray-100 text-gray-900"
                                                        }`}>
                                                            <p className="text-sm whitespace-pre-wrap">
                                                                {message.content}
                                                            </p>
                                                            <p className={`text-xs mt-1 ${
                                                                isFromCurrentUser ? "text-red-100" : "text-gray-500"
                                                            }`}>
                                                                {formatMessageTime(message.created_at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Reply Section */}
                                <div className="p-4 border-t border-gray-200 bg-gray-50">
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                                                Reply
                                            </label>
                                            <textarea
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm resize-none"
                                                placeholder="Type your reply here..."
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                onClick={sendMessage}
                                                disabled={!newMessage.trim() || sendingMessage}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                            >
                                                <Send size={16} />
                                                {sendingMessage ? "Sending..." : "Send Reply"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex items-center justify-center">
                                <div className="text-center text-gray-500">
                                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                    <p className="text-lg mb-2 font-semibold">No conversation selected</p>
                                    <p className="text-sm text-gray-400">
                                        Choose a conversation from the list or search for users to start chatting
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </RoleBasedLayout>
    );
};

export default RDDMessages;
