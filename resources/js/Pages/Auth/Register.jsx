import React, { useState, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import bg from '../../../assets/bg.png';
import logo from '../../../assets/logo.png';
import axios from 'axios';

const axiosInstance = window.axios || axios;
if (!window.axios) {
    axiosInstance.defaults.withCredentials = true;
    axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

export default function Register() {
    const [step, setStep] = useState('role'); // 'role' or 'form'
    const [selectedRole, setSelectedRole] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [researchCenters, setResearchCenters] = useState([]);
    const [filteredResearchCenters, setFilteredResearchCenters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: '',
        department: '',
        researchCenter: '',
    });

    // Fetch departments and research centers
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [deptResponse, rcResponse] = await Promise.all([
                    axiosInstance.get('/public/departments', {
                        headers: { Accept: 'application/json' },
                        withCredentials: true,
                    }).catch(err => {
                        console.error('Error fetching departments:', err);
                        return { data: { success: false, data: [] } };
                    }),
                    axiosInstance.get('/public/research-centers', {
                        headers: { Accept: 'application/json' },
                        withCredentials: true,
                    }).catch(err => {
                        console.error('Error fetching research centers:', err);
                        return { data: { success: false, data: [] } };
                    }),
                ]);

                if (deptResponse.data && deptResponse.data.success) {
                    setDepartments(deptResponse.data.data || []);
                } else {
                    setDepartments([]);
                }
                
                if (rcResponse.data && rcResponse.data.success) {
                    const centers = rcResponse.data.data || [];
                    setResearchCenters(centers);
                    setFilteredResearchCenters(centers);
                } else {
                    setResearchCenters([]);
                    setFilteredResearchCenters([]);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setDepartments([]);
                setResearchCenters([]);
                setFilteredResearchCenters([]);
            }
        };

        if (step === 'form') {
            fetchData();
        }
    }, [step]);

    // Filter research centers when department changes and auto-select if only one
    useEffect(() => {
        if (data.department && researchCenters.length > 0) {
            const selectedDept = departments.find(
                (d) =>
                    (d.name || d.departmentName) === data.department ||
                    String(d.departmentID || d.id) === String(data.department)
            );

            if (selectedDept) {
                const departmentID = selectedDept.departmentID || selectedDept.id;
                const filtered = researchCenters.filter(
                    (rc) => String(rc.departmentID) === String(departmentID)
                );
                setFilteredResearchCenters(filtered);

                // Auto-select research center if only one exists (like admin side)
                if (filtered.length === 1) {
                    const centerName = filtered[0].name || filtered[0].centerName;
                    setData('researchCenter', centerName);
                } else if (filtered.length === 0) {
                    setData('researchCenter', '');
                } else {
                    // If multiple centers, don't auto-select but keep current selection if it's still valid
                    const currentCenter = filtered.find(
                        (rc) => (rc.name || rc.centerName) === data.researchCenter
                    );
                    if (!currentCenter) {
                        setData('researchCenter', '');
                    }
                }
            }
        } else {
            setFilteredResearchCenters(researchCenters);
            if (!data.department) {
                setData('researchCenter', '');
            }
        }
    }, [data.department, departments, researchCenters, setData]);

    const handleRoleSelect = (role) => {
        const roleMap = {
            'Proponent': 'proponent',
            'Center Manager': 'central_manager',
            'RDD Staff': 'rdd',
        };
        setSelectedRole(role);
        setData('role', roleMap[role]);
        setStep('form');
    };

    const handleDepartmentChange = (e) => {
        const deptValue = e.target.value;
        setData('department', deptValue);
        
        // Find the selected department
        const selectedDept = departments.find(
            (d) =>
                (d.name || d.departmentName) === deptValue ||
                String(d.departmentID || d.id) === String(deptValue)
        );

        if (selectedDept && researchCenters.length > 0) {
            const departmentID = selectedDept.departmentID || selectedDept.id;
            // Filter research centers for this department
            const filteredCenters = researchCenters.filter(
                (rc) => String(rc.departmentID) === String(departmentID)
            );
            setFilteredResearchCenters(filteredCenters);
            
            // Auto-select the first linked research center if only one exists (like admin side)
            if (filteredCenters.length === 1) {
                const centerName = filteredCenters[0].name || filteredCenters[0].centerName;
                setData('researchCenter', centerName);
            } else if (filteredCenters.length === 0) {
                // Clear research center if no centers for this department
                setData('researchCenter', '');
            } else {
                // Multiple centers available, clear selection
                setData('researchCenter', '');
            }
        } else {
            // If no department selected, clear research centers and selection
            setFilteredResearchCenters([]);
            setData('researchCenter', '');
        }
    };

    const handleResearchCenterChange = (e) => {
        const centerValue = e.target.value;
        setData('researchCenter', centerValue);

        // Auto-select department if research center is selected
        if (centerValue) {
            const selectedCenter = researchCenters.find(
                (rc) =>
                    (rc.name || rc.centerName) === centerValue ||
                    String(rc.centerID || rc.id) === String(centerValue)
            );

            if (selectedCenter && selectedCenter.departmentID) {
                const linkedDept = departments.find(
                    (d) =>
                        String(d.departmentID || d.id) ===
                        String(selectedCenter.departmentID)
                );

                if (linkedDept) {
                    const deptName = linkedDept.name || linkedDept.departmentName;
                    setData('department', deptName);
                    // Filter research centers for the linked department
                    const filtered = researchCenters.filter(
                        (rc) =>
                            String(rc.departmentID) ===
                            String(selectedCenter.departmentID)
                    );
                    setFilteredResearchCenters(filtered);
                }
            }
        }
    };

    const submit = (e) => {
        e.preventDefault();
        setError('');

        post('/register', {
            onSuccess: async () => {
                // Show popup about pending account status
                try {
                    if (window.customAlert) {
                        await window.customAlert(
                            'Your account has been registered successfully! Your account is now pending approval. You will be able to log in once an administrator activates your account.',
                            'Account Pending Approval',
                            5000
                        );
                    } else {
                        // Fallback if customAlert is not available
                        alert('Your account has been registered successfully! Your account is now pending approval. You will be able to log in once an administrator activates your account.');
                    }
                } catch (error) {
                    console.error('Error showing alert:', error);
                } finally {
                    // Redirect to login page after user acknowledges the message
                    router.visit('/login');
                }
            },
            onError: (errors) => {
                if (errors.email) {
                    setError(errors.email);
                } else if (errors.password) {
                    setError(errors.password);
                } else {
                    setError('Registration failed. Please check your information.');
                }
            },
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const roleOptions = [
        { label: 'Proponent', value: 'Proponent' },
        { label: 'Center Manager', value: 'Center Manager' },
        { label: 'RDD Staff', value: 'RDD Staff' },
    ];

    return (
        <>
            <Head title="Create Account" />
            <div
                className="fixed inset-0 min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${bg})` }}
            >
                <div className="absolute inset-0 bg-black opacity-50"></div>

                <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-3xl p-6">
                    <div className="bg-white bg-opacity-95 p-6 rounded-lg shadow-lg w-full max-w-lg">
                        <div className="flex justify-center mb-4">
                            <img
                                src={logo}
                                alt="University Logo"
                                className="w-16 h-16"
                            />
                        </div>

                        {step === 'role' ? (
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">
                                    Select Role
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                                    {roleOptions.map((role) => (
                                        <button
                                            key={role.value}
                                            type="button"
                                            onClick={() => handleRoleSelect(role.value)}
                                            className="group relative p-3 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-md shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-300 ease-in-out"
                                        >
                                            <div className="text-sm font-semibold">
                                                {role.label}
                                            </div>
                                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-md transition-opacity duration-300"></div>
                                        </button>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => router.visit('/login')}
                                    className="text-gray-600 hover:text-gray-800 underline text-xs"
                                >
                                    Already have an account? Log in
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-800">
                                        Create Account
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep('role');
                                            setSelectedRole(null);
                                            reset();
                                        }}
                                        className="text-gray-600 hover:text-gray-800 text-xs underline"
                                    >
                                        ← Back
                                    </button>
                                </div>

                                {selectedRole && (
                                    <div className="mb-3 p-2 bg-orange-100 rounded-md">
                                        <p className="text-xs text-gray-700">
                                            Registering as:{' '}
                                            <span className="font-semibold">
                                                {selectedRole}
                                            </span>
                                        </p>
                                    </div>
                                )}

                                {error && (
                                    <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-xs">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={submit}>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <input
                                                type="text"
                                                name="firstName"
                                                placeholder="First Name *"
                                                value={data.firstName}
                                                onChange={(e) =>
                                                    setData('firstName', e.target.value)
                                                }
                                                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                required
                                            />
                                            {errors.firstName && (
                                                <div className="mt-1 text-xs text-red-600">
                                                    {errors.firstName}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                name="lastName"
                                                placeholder="Last Name *"
                                                value={data.lastName}
                                                onChange={(e) =>
                                                    setData('lastName', e.target.value)
                                                }
                                                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                required
                                            />
                                            {errors.lastName && (
                                                <div className="mt-1 text-xs text-red-600">
                                                    {errors.lastName}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Email *"
                                            value={data.email}
                                            onChange={(e) =>
                                                setData('email', e.target.value)
                                            }
                                            className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            required
                                        />
                                        {errors.email && (
                                            <div className="mt-1 text-xs text-red-600">
                                                {errors.email}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <input
                                            type="password"
                                            name="password"
                                            placeholder="Password *"
                                            value={data.password}
                                            onChange={(e) =>
                                                setData('password', e.target.value)
                                            }
                                            className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            required
                                            minLength={8}
                                        />
                                        {errors.password && (
                                            <div className="mt-1 text-xs text-red-600">
                                                {errors.password}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <input
                                            type="password"
                                            name="password_confirmation"
                                            placeholder="Confirm Password *"
                                            value={data.password_confirmation}
                                            onChange={(e) =>
                                                setData(
                                                    'password_confirmation',
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            required
                                        />
                                        {errors.password_confirmation && (
                                            <div className="mt-1 text-xs text-red-600">
                                                {errors.password_confirmation}
                                            </div>
                                        )}
                                    </div>

                                    {selectedRole !== 'RDD Staff' && (
                                        <div className="mb-3">
                                            <select
                                                name="department"
                                                value={data.department}
                                                onChange={handleDepartmentChange}
                                                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                                                required
                                            >
                                                <option value="">Select Academic Unit *</option>
                                                {departments.map((dept) => (
                                                    <option
                                                        key={dept.departmentID || dept.id}
                                                        value={dept.name || dept.departmentName}
                                                    >
                                                        {dept.name || dept.departmentName}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.department && (
                                                <div className="mt-1 text-xs text-red-600">
                                                    {errors.department}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {selectedRole !== 'RDD Staff' && (
                                        <div className="mb-4">
                                            <select
                                                name="researchCenter"
                                                value={data.researchCenter || ''}
                                                onChange={handleResearchCenterChange}
                                                className={`w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                                                    !data.department 
                                                        ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                                                        : 'bg-white'
                                                }`}
                                                disabled={!data.department}
                                            >
                                                <option value="">
                                                    {data.department
                                                        ? 'Select Research Center'
                                                        : 'Select Academic Unit first'}
                                                </option>
                                                {data.department && filteredResearchCenters.map((rc) => (
                                                    <option
                                                        key={rc.centerID || rc.id}
                                                        value={rc.name || rc.centerName}
                                                    >
                                                        {rc.name || rc.centerName}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.researchCenter && (
                                                <div className="mt-1 text-xs text-red-600">
                                                    {errors.researchCenter}
                                                </div>
                                            )}
                                            {data.department &&
                                                filteredResearchCenters.length === 0 && (
                                                    <div className="mt-1 text-xs text-amber-600">
                                                        No research centers available for this
                                                        Academic Unit
                                                    </div>
                                                )}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="w-full bg-orange-500 text-white py-2 rounded-md font-semibold hover:bg-orange-600 transition duration-300 disabled:opacity-50 text-sm"
                                        disabled={processing}
                                    >
                                        {processing ? 'Creating Account...' : 'Create Account'}
                                    </button>
                                </form>

                                <div className="text-center mt-3">
                                    <button
                                        type="button"
                                        onClick={() => router.visit('/login')}
                                        className="text-gray-600 hover:text-gray-800 underline text-xs"
                                    >
                                        Already have an account? Log in
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
