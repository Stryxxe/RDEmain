import { Head, Link, useForm, router } from '@inertiajs/react';
import { useEffect } from 'react';
import bg from '../../../assets/bg.png';
import logo from '../../../assets/logo.png';

export default function ForgotPasswordOtp({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/password/request-otp');
    };

    return (
        <>
            <Head title="Forgot Password" />
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
                            Forgot Password?
                        </h2>
                        <p className="text-sm text-gray-600 mb-6 text-center">
                            Enter your email address and we'll send you a One-Time Password (OTP) to reset your password.
                        </p>

                        {status && (
                            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm text-center">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit}>
                            <div className="mb-4">
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email Address"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    autoComplete="email"
                                    required
                                />
                                {errors.email && (
                                    <div className="mt-2 text-sm text-red-600">{errors.email}</div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-300 disabled:opacity-50"
                                disabled={processing}
                            >
                                {processing ? 'Sending OTP...' : 'Send OTP'}
                            </button>
                        </form>

                        <div className="text-center mt-6">
                            <Link
                                href="/login"
                                className="text-orange-500 hover:text-orange-600 underline font-semibold transition duration-300"
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



