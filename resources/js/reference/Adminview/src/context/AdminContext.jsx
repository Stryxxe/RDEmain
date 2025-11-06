import React, { createContext, useContext, useReducer, useEffect } from "react";
import { toast } from "react-hot-toast";

const AdminContext = createContext();

// Initial state
const initialState = {
  users: [],
  loading: false,
  error: null,
  currentUser: null,
  filters: {
    role: "all",
    status: "all",
    search: "",
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
};

// Action types
const ACTIONS = {
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  SET_USERS: "SET_USERS",
  ADD_USER: "ADD_USER",
  UPDATE_USER: "UPDATE_USER",
  DELETE_USER: "DELETE_USER",
  SET_CURRENT_USER: "SET_CURRENT_USER",
  SET_FILTERS: "SET_FILTERS",
  SET_PAGINATION: "SET_PAGINATION",
  RESET_FILTERS: "RESET_FILTERS",
};

// Reducer
function adminReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    case ACTIONS.SET_USERS:
      return {
        ...state,
        users: action.payload.users,
        pagination: { ...state.pagination, total: action.payload.total },
        loading: false,
      };

    case ACTIONS.ADD_USER:
      return {
        ...state,
        users: [action.payload, ...state.users],
        pagination: { ...state.pagination, total: state.pagination.total + 1 },
      };

    case ACTIONS.UPDATE_USER:
      return {
        ...state,
        users: state.users.map((user) =>
          user.id === action.payload.id ? action.payload : user
        ),
      };

    case ACTIONS.DELETE_USER:
      return {
        ...state,
        users: state.users.filter((user) => user.id !== action.payload),
        pagination: { ...state.pagination, total: state.pagination.total - 1 },
      };

    case ACTIONS.SET_CURRENT_USER:
      return { ...state, currentUser: action.payload };

    case ACTIONS.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };

    case ACTIONS.SET_PAGINATION:
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload },
      };

    case ACTIONS.RESET_FILTERS:
      return {
        ...state,
        filters: initialState.filters,
        pagination: { ...state.pagination, page: 1 },
      };

    default:
      return state;
  }
}

// Mock data generator
const generateMockUsers = () => {
  const roles = [
    "admin",
    "proponent",
    "central_manager",
    "rdd",
    "rde",
    "op",
    "osuoro",
  ];
  const statuses = ["active", "inactive", "pending"];
  const departments = [
    "Computer Science",
    "Engineering",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Office of the President",
    "Research and Development",
  ];

  // Create specific users for each role
  const specificUsers = [
    {
      id: "admin_1",
      firstName: "Admin",
      lastName: "User",
      email: "admin@university.edu",
      role: "admin",
      status: "active",
      department: "IT Administration",
      phone: "+1-555-0001",
      lastLogin: new Date().toISOString(),
      createdAt: new Date("2024-01-01").toISOString(),
      avatar:
        "https://ui-avatars.com/api/?name=Admin+User&background=dc2626&color=fff",
    },
    {
      id: "op_1",
      firstName: "Office",
      lastName: "President",
      email: "president@university.edu",
      role: "op",
      status: "active",
      department: "Office of the President",
      phone: "+1-555-0002",
      lastLogin: new Date().toISOString(),
      createdAt: new Date("2024-01-01").toISOString(),
      avatar:
        "https://ui-avatars.com/api/?name=Office+President&background=dc2626&color=fff",
    },
  ];

  // Generate additional random users
  const randomUsers = Array.from({ length: 48 }, (_, index) => ({
    id: `user_${index + 1}`,
    firstName: `User${index + 1}`,
    lastName: `LastName${index + 1}`,
    email: `user${index + 1}@university.edu`,
    role: roles[index % roles.length],
    status: statuses[index % statuses.length],
    department: departments[index % departments.length],
    phone: `+1-555-${String(index + 3).padStart(4, "0")}`,
    lastLogin: new Date(
      Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
    ).toISOString(),
    createdAt: new Date(
      Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
    ).toISOString(),
    avatar: `https://ui-avatars.com/api/?name=User${
      index + 1
    }&background=dc2626&color=fff`,
  }));

  return [...specificUsers, ...randomUsers];
};

// Provider component
export function AdminProvider({ children }) {
  const [state, dispatch] = useReducer(adminReducer, initialState);

  // Load mock data on mount
  useEffect(() => {
    const mockUsers = generateMockUsers();
    dispatch({
      type: ACTIONS.SET_USERS,
      payload: { users: mockUsers, total: mockUsers.length },
    });
  }, []);

  // Actions
  const actions = {
    setLoading: (loading) =>
      dispatch({ type: ACTIONS.SET_LOADING, payload: loading }),

    setError: (error) => dispatch({ type: ACTIONS.SET_ERROR, payload: error }),

    addUser: (userData) => {
      const newUser = {
        id: `user_${Date.now()}`,
        ...userData,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        avatar: `https://ui-avatars.com/api/?name=${userData.firstName}+${userData.lastName}&background=3b82f6&color=fff`,
      };
      dispatch({ type: ACTIONS.ADD_USER, payload: newUser });
      toast.success("User created successfully");
    },

    updateUser: (userId, userData) => {
      dispatch({
        type: ACTIONS.UPDATE_USER,
        payload: { id: userId, ...userData },
      });
      toast.success("User updated successfully");
    },

    deleteUser: (userId) => {
      dispatch({ type: ACTIONS.DELETE_USER, payload: userId });
      toast.success("User deleted successfully");
    },

    setCurrentUser: (user) =>
      dispatch({ type: ACTIONS.SET_CURRENT_USER, payload: user }),

    setFilters: (filters) =>
      dispatch({ type: ACTIONS.SET_FILTERS, payload: filters }),

    setPagination: (pagination) =>
      dispatch({ type: ACTIONS.SET_PAGINATION, payload: pagination }),

    resetFilters: () => dispatch({ type: ACTIONS.RESET_FILTERS }),
  };

  // Filtered and paginated users
  const getFilteredUsers = () => {
    let filtered = state.users;

    // Apply role filter
    if (state.filters.role !== "all") {
      filtered = filtered.filter((user) => user.role === state.filters.role);
    }

    // Apply status filter
    if (state.filters.status !== "all") {
      filtered = filtered.filter(
        (user) => user.status === state.filters.status
      );
    }

    // Apply search filter
    if (state.filters.search) {
      const searchTerm = state.filters.search.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.firstName.toLowerCase().includes(searchTerm) ||
          user.lastName.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          user.department.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  };

  const getPaginatedUsers = () => {
    const filtered = getFilteredUsers();
    const start = (state.pagination.page - 1) * state.pagination.limit;
    const end = start + state.pagination.limit;
    return filtered.slice(start, end);
  };

  const value = {
    ...state,
    ...actions,
    filteredUsers: getFilteredUsers(),
    paginatedUsers: getPaginatedUsers(),
    totalPages: Math.ceil(getFilteredUsers().length / state.pagination.limit),
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

// Custom hook
export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
