import React, { useEffect, useMemo, useRef, useState } from "react";
import apiService from "../services/api";

const AsyncProponentSelect = ({ value = [], onChange, placeholder = "Search users...", disabled = false, maxSelections = 10 }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [projectRoles, setProjectRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const containerRef = useRef(null);
  const controllerRef = useRef(null);

  const selectedIds = useMemo(() => new Set((value || []).map(u => u.userID || u.id)), [value]);

  // Fetch active project roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setRolesLoading(true);
        const data = await apiService.get('/project-roles/active');
        setProjectRoles(data?.data || []);
      } catch (err) {
        console.error('Failed to load project roles', err);
      } finally {
        setRolesLoading(false);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    const onDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    const controller = new AbortController();
    controllerRef.current = controller;

    const timeout = setTimeout(async () => {
      try {
        const data = await apiService.get(`/users/search?q=${encodeURIComponent(query)}&limit=8`);
        const list = Array.isArray(data?.data) ? data.data : [];
        // Filter out already selected
        const filtered = list.filter(u => !selectedIds.has(u.userID || u.id));
        setResults(filtered);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError("Failed to search users");
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, selectedIds]);

  const addUser = (user) => {
    if (!onChange) return;
    if (value.length >= maxSelections) return;
    if (selectedIds.has(user.userID || user.id)) return;
    // Add user with null projectRoleID initially
    onChange([...(value || []), { ...user, projectRoleID: null }]);
    setQuery("");
    setOpen(false);
  };

  const removeUser = (id) => {
    if (!onChange) return;
    onChange((value || []).filter(u => (u.userID || u.id) !== id));
  };

  const updateUserRole = (id, roleId) => {
    if (!onChange) return;
    onChange((value || []).map(u => 
      (u.userID || u.id) === id ? { ...u, projectRoleID: roleId } : u
    ));
  };

  return (
    <div ref={containerRef} className="w-full">
      <div className="mb-3 space-y-2">
        {(value || []).map((user) => {
          const id = user.userID || user.id;
          const name = user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim();
          const userRole = user.role?.userRole || user.role || "";
          return (
            <div key={id} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{name}</div>
                {userRole && <div className="text-xs text-gray-500">{userRole}</div>}
              </div>
              <div className="flex-shrink-0 w-48">
                <select
                  value={user.projectRoleID || ""}
                  onChange={(e) => updateUserRole(id, e.target.value || null)}
                  className="w-full text-sm border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  disabled={rolesLoading}
                >
                  <option value="">Select role...</option>
                  {projectRoles.map((role) => (
                    <option key={role.projectRoleID} value={role.projectRoleID}>
                      {role.roleName}
                    </option>
                  ))}
                </select>
              </div>
              <button 
                type="button" 
                onClick={() => removeUser(id)} 
                className="flex-shrink-0 text-red-600 hover:text-red-800 p-1"
                aria-label="Remove"
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
        {open && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
            {loading ? (
              <div className="p-3 text-sm text-gray-500">Searching...</div>
            ) : error ? (
              <div className="p-3 text-sm text-red-600">{error}</div>
            ) : results.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">No results</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {results.map((user) => {
                  const id = user.userID || user.id;
                  const name = user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim();
                  const role = user.role?.userRole || user.role || "";
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => addUser(user)}
                        className="w-full text-left px-3 py-2 hover:bg-red-50"
                      >
                        <div className="font-medium text-gray-900">{name}</div>
                        <div className="text-xs text-gray-500">{role}</div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Add co-proponents and assign their project role. They will see this proposal in their tracker.
      </p>
    </div>
  );
};

export default AsyncProponentSelect;
