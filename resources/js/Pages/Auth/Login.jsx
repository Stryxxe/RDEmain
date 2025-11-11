import { Head, Link, useForm } from '@inertiajs/react';
import bg from '../../../assets/bg.png';
import logo from '../../../assets/logo.png';
import google from '../../../assets/google.png';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Log in" />
            <div
                className="min-h-screen flex items-center justify-center bg-cover bg-center"
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
                        
                        {status && (
                            <div className="mb-4 text-sm font-medium text-green-600 text-center">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit}>
                            <div className="mb-4">
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    autoComplete="username"
                                    required
                                />
                                {errors.email && (
                                    <div className="mt-2 text-sm text-red-600">{errors.email}</div>
                                )}
                            </div>
                            
                            <div className="mb-4">
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    autoComplete="current-password"
                                    required
                                />
                                {errors.password && (
                                    <div className="mt-2 text-sm text-red-600">{errors.password}</div>
                                )}
                            </div>
                            
                            <button
                                type="submit"
                                className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-300 disabled:opacity-50"
                                disabled={processing}
                            >
                                {processing ? 'Logging in...' : 'Log In'}
                            </button>
                        </form>
                        
                        <div className="text-center my-4">
                            <span className="text-gray-600">or</span>
                        </div>
                        
                        <button
                            type="button"
                            className="w-full flex items-center justify-center bg-white border border-gray-300 py-3 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition duration-300"
                        >
                            <img
                                src={google}
                                alt="Google logo"
                                className="w-5 h-5 mr-2"
                            />
                            Sign in with Google
                        </button>
                        
                        <div className="text-center mt-4">
                            {canResetPassword && (
                                <Link
                                    href="/forgot-password"
                                    className="text-orange-500 hover:underline"
                                >
                                    Forgot Password <span className="font-bold">Click here</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
