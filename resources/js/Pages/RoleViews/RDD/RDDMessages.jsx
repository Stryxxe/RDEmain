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
} from "lucide-react";
import axios from "axios";
import RDDLayout from "../../../Components/Layouts/RDDLayout";

const axiosInstance = window.axios || axios;
if (!window.axios) {
    axiosInstance.defaults.withCredentials = true;
    axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

const RDDMessages = () => {
    const { props } = usePage();
    const user = props?.auth?.user;
    
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [sendingMessage, setSendingMessage] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // New message compose
    const [searchUsers, setSearchUsers] = useState("");
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [composeMessage, setComposeMessage] = useState("");
    
    // Quick user search
    const [globalUserSearch, setGlobalUserSearch] = useState("");
    const [globalUserResults, setGlobalUserResults] = useState([]);

    useEffect(() => {
        if (!user) {
            router.visit("/login");
            return;
        }
        fetchConversations();
    }, [user]);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get("/messages/conversations");
            setConversations(response.data?.data || []);
        } catch (error) {
            console.error("Error fetching conversations:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (otherUserId) => {
        try {
            const response = await axiosInstance.get(`/messages/conversation/${otherUserId}`);
            setMessages(response.data?.data || []);
        } catch (error) {
            console.error("Error fetching messages:", error);
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

    const searchAllUsers = async (query) => {
        if (!query || query.length < 2) {
            return [];
        }
        
        try {
            const response = await axiosInstance.get("/users/search-all", {
                params: { q: query, limit: 20 }
            });
            return response.data?.data || [];
        } catch (error) {
            console.error("Error searching users:", error);
            return [];
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            const runSearch = async () => {
                const results = await searchAllUsers(searchUsers);
                setAvailableUsers(results);
            };
            runSearch();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchUsers]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const runSearch = async () => {
                const results = await searchAllUsers(globalUserSearch);
                setGlobalUserResults(results);
            };
            runSearch();
        }, 300);
        return () => clearTimeout(timer);
    }, [globalUserSearch]);

    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
        fetchMessages(conversation.otherUser.userID);
        setSelectedUser(null);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        setSendingMessage(true);
        try {
            await axiosInstance.post('/messages', {
                recipientID: String(selectedConversation.otherUser.userID),
                subject: `Message to ${selectedConversation.otherUser.firstName} ${selectedConversation.otherUser.lastName}`,
                content: newMessage,
                type: 'reply'
            });
            setNewMessage("");
            fetchMessages(selectedConversation.otherUser.userID);
            fetchConversations();
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message");
        } finally {
            setSendingMessage(false);
        }
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

    return (
        <RDDLayout>
            <div className="max-w-6xl mx-auto px-4 py-6">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
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
                            </div>
                            <p className="text-gray-600">
                                Communicate with researchers and team members
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {getTotalUnreadCount() > 0 && (
                                <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
                                    {getTotalUnreadCount()} unread
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Conversations List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-4 border-b border-gray-200">
                                <label className="block text-xs font-medium text-gray-600 mb-2">
                                    Search users to chat
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Type a name or email..."
                                        value={globalUserSearch}
                                        onChange={(e) => setGlobalUserSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                                    />
                                    {globalUserSearch.length >= 2 && (
                                        <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {globalUserResults.length > 0 ? (
                                                globalUserResults.map((u) => (
                                                    <button
                                                        key={u.userID}
                                                        onClick={() => handleUserQuickSelect(u)}
                                                        className="w-full p-3 hover:bg-gray-50 text-left flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                            <User className="w-4 h-4 text-gray-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-gray-900 text-sm truncate">
                                                                {u.firstName} {u.lastName}
                                                            </div>
                                                            <div className="text-xs text-gray-500 truncate">
                                                                {u.role?.userRole || "User"}
                                                            </div>
                                                        </div>
                                                        <span className="text-xs text-red-800 bg-red-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                            Chat
                                                        </span>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="p-3 text-sm text-gray-500">No users found</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 border-b border-gray-100">
                                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Recent Conversations
                                </h3>
                            </div>

                            <div className="max-h-96 overflow-y-auto">
                                {loading ? (
                                    <div className="flex items-center justify-center h-32">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-900"></div>
                                    </div>
                                ) : filteredConversations.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                                        <MessageCircle className="w-12 h-12 mb-2" />
                                        <p>No conversations yet</p>
                                    </div>
                                ) : (
                                    filteredConversations.map((conv) => (
                                        <button
                                            key={conv.otherUser.userID}
                                            onClick={() => handleSelectConversation(conv)}
                                            className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left ${
                                                selectedConversation?.otherUser.userID === conv.otherUser.userID
                                                    ? "bg-red-50 border-l-4 border-l-red-900"
                                                    : ""
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                                    <User className="w-5 h-5 text-red-900" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h3 className="font-semibold text-gray-900 truncate">
                                                            {conv.otherUser.firstName} {conv.otherUser.lastName}
                                                        </h3>
                                                        <span className="text-xs text-gray-500 ml-2">
                                                            {getConversationTime(conv)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 truncate">
                                                        {conv.otherUser.role?.userRole || "User"}
                                                    </p>
                                                    {conv.unreadCount > 0 && (
                                                        <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-red-600 rounded-full mt-1">
                                                            {conv.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
                            {selectedUser ? (
                                // New Message Compose
                                <div className="flex-1 flex flex-col">
                                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                                        <h2 className="text-lg font-semibold text-gray-900">New Message</h2>
                                        <button
                                            onClick={() => {
                                                setSelectedUser(null);
                                                setSearchUsers("");
                                                setComposeMessage("");
                                            }}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="p-4 border-b border-gray-200">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            To:
                                        </label>
                                        {selectedUser ? (
                                            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                                <User className="w-4 h-4 text-red-900" />
                                                <span className="flex-1">
                                                    {selectedUser.firstName} {selectedUser.lastName}
                                                    {selectedUser.role?.userRole && (
                                                        <span className="text-sm text-gray-600 ml-2">
                                                            ({selectedUser.role.userRole})
                                                        </span>
                                                    )}
                                                </span>
                                                <button
                                                    onClick={() => setSelectedUser(null)}
                                                    className="p-1 hover:bg-red-100 rounded"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <input
                                                    type="text"
                                                    placeholder="Search users..."
                                                    value={searchUsers}
                                                    onChange={(e) => setSearchUsers(e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                                />
                                                {availableUsers.length > 0 && (
                                                    <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                                                        {availableUsers.map((u) => (
                                                            <button
                                                                key={u.userID}
                                                                onClick={() => {
                                                                    setSelectedUser(u);
                                                                    setSearchUsers("");
                                                                }}
                                                                className="w-full p-3 hover:bg-gray-50 transition-colors text-left flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                                                            >
                                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                                    <User className="w-4 h-4 text-gray-600" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-gray-900">
                                                                        {u.firstName} {u.lastName}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {u.email} • {u.role?.userRole || "User"}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    <div className="flex-1 p-4">
                                        <textarea
                                            value={composeMessage}
                                            onChange={(e) => setComposeMessage(e.target.value)}
                                            placeholder="Type your message..."
                                            className="w-full h-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="p-4 border-t border-gray-200">
                                        <button
                                            onClick={handleStartNewConversation}
                                            disabled={!selectedUser || !composeMessage.trim() || sendingMessage}
                                            className="w-full px-6 py-3 bg-red-900 text-white rounded-lg hover:bg-red-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                        >
                                            {sendingMessage ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4" />
                                                    Send Message
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : selectedConversation ? (
                                // Selected Conversation View
                                <>
                                    <div className="p-4 border-b border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                                <User className="w-5 h-5 text-red-900" />
                                            </div>
                                            <div>
                                                <h2 className="font-semibold text-gray-900">
                                                    {selectedConversation.otherUser.firstName} {selectedConversation.otherUser.lastName}
                                                </h2>
                                                <p className="text-sm text-gray-600">
                                                    {selectedConversation.otherUser.role?.userRole || "User"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                        {messages.length === 0 ? (
                                            <div className="flex items-center justify-center h-full text-gray-500">
                                                <p>No messages yet. Start the conversation!</p>
                                            </div>
                                        ) : (
                                            messages.map((msg, index) => (
                                                <div
                                                    key={index}
                                                    className={`flex ${
                                                        msg.senderID === user.userID
                                                            ? "justify-end"
                                                            : "justify-start"
                                                    }`}
                                                >
                                                    <div
                                                        className={`max-w-[70%] rounded-lg p-3 ${
                                                            msg.senderID === user.userID
                                                                ? "bg-red-900 text-white"
                                                                : "bg-gray-100 text-gray-900"
                                                        }`}
                                                    >
                                                        <p className="whitespace-pre-wrap break-words">
                                                            {msg.content}
                                                        </p>
                                                        <p
                                                            className={`text-xs mt-1 ${
                                                                msg.senderID === user.userID
                                                                    ? "text-red-200"
                                                                    : "text-gray-500"
                                                            }`}
                                                        >
                                                            {formatMessageTime(msg.created_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder="Type a message..."
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                                disabled={sendingMessage}
                                            />
                                            <button
                                                type="submit"
                                                disabled={!newMessage.trim() || sendingMessage}
                                                className="px-6 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                            >
                                                {sendingMessage ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                ) : (
                                                    <Send className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                // No Conversation Selected
                                <div className="flex-1 flex items-center justify-center text-gray-500">
                                    <div className="text-center">
                                        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                        <p className="text-lg mb-2">No conversation selected</p>
                                        <p className="text-sm">
                                            Choose a conversation or start a new one
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </RDDLayout>
    );
};

export default RDDMessages;
