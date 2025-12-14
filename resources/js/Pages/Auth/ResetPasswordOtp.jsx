import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import bg from '../../../assets/bg.png';
import logo from '../../../assets/logo.png';

export default function ResetPasswordOtp({ email, status }) {
    const { data, setData, post, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post('/password/reset-otp');
    };

    return (
        <>
            <Head title="Reset Password" />
            <div
                className="fixed inset-0 min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${bg})` }}
            >
                <div className="absolute inset-0 bg-black opacity-50"></div>

                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between w-full max-w-7xl p-8 rounded-lg">
                    <div className="text-white text-center lg:text-left mb-8 lg:mb-0 lg:mr-16">
                        <h1 className="text-5xl font-bold mb-4">RESEARCH</h1>
                        <h1 className="text-5xl font-bold mb-4">PROPOSAL</h1>
                        <h1 className="text-5xl font-bold">MANAGEMENT</h1>
                        <p className="text-sm mt-8">
                            © 2025 University of Southeastern Philippines. All rights reserved.
                        </p>
                    </div>

                    <div className="bg-white bg-opacity-90 p-8 rounded-xl shadow-lg w-full max-w-md">
                        <div className="flex justify-center mb-6">
                            <img
                                src={logo}
                                alt="University Logo"
                                className="w-24 h-24"
                            />
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                            Reset Password
                        </h2>
                        <p className="text-sm text-gray-600 mb-6 text-center">
                            Create a new password for <strong>{email}</strong>
                        </p>

                        {status && (
                            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm text-center">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit}>
                            <div className="mb-4">
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        placeholder="New Password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                                        autoComplete="new-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <div className="mt-2 text-sm text-red-600">{errors.password}</div>
                                )}
                                <p className="mt-1 text-xs text-gray-500">Password must be at least 8 characters</p>
                            </div>

                            <div className="mb-4">
                                <div className="relative">
                                    <input
                                        type={showPasswordConfirmation ? 'text' : 'password'}
                                        name="password_confirmation"
                                        placeholder="Confirm New Password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                                        autoComplete="new-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPasswordConfirmation ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                                {errors.password_confirmation && (
                                    <div className="mt-2 text-sm text-red-600">{errors.password_confirmation}</div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-300 disabled:opacity-50"
                                disabled={processing}
                            >
                                {processing ? 'Resetting Password...' : 'Reset Password'}
                            </button>
                        </form>

                        <div className="text-center mt-6">
                            <Link
                                href="/login"
                                className="text-gray-600 hover:text-gray-800 underline text-sm"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}



