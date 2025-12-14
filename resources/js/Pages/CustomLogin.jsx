import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
// Placeholder images - replace with actual images
const bg = '/images/bg.jpg'; // You can add your background image to public/images/
const logo = '/images/logo.png'; // You can add your logo to public/images/
const google = '/images/google.png'; // You can add Google logo to public/images/

export default function CustomLogin({ status, canResetPassword }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    setData({
      ...data,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    post(route('login'), {
      onFinish: () => reset('password'),
      onError: (errors) => {
        if (errors.email) {
          setError(errors.email);
        } else if (errors.password) {
          setError(errors.password);
        } else {
          setError('Login failed. Please check your credentials.');
        }
      }
    });
  };

  return (
    <Head title="Log in">
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600"
        style={{ backgroundImage: bg ? `url(${bg})` : 'none' }}
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
              {logo ? (
                <img
                  src={logo}
                  alt="University Logo"
                  className="w-24 h-24"
                />
              ) : (
                <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">U</span>
                </div>
              )}
            </div>
            
            {status && (
              <div className="mb-4 text-sm font-medium text-green-600 text-center">
                {status}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={data.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
                {errors.email && (
                  <div className="text-red-500 text-sm mt-1">{errors.email}</div>
                )}
              </div>
              <div className="mb-4">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={data.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
                {errors.password && (
                  <div className="text-red-500 text-sm mt-1">{errors.password}</div>
                )}
              </div>
              
              <div className="mb-4 block">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={data.remember}
                    onChange={(e) => setData('remember', e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Remember me
                  </span>
                </label>
              </div>
              
              {error && <div className="error-message text-red-500 mb-4 text-center">{error}</div>}
              
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
              className="w-full flex items-center justify-center bg-white border border-gray-300 py-3 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition duration-300"
            >
              {google ? (
                <img
                  src={google}
                  alt="Google logo"
                  className="w-5 h-5 mr-2"
                />
              ) : (
                <div className="w-5 h-5 mr-2 bg-red-500 rounded"></div>
              )}
              Sign in with Google
            </button>
            
            <div className="text-center mt-4">
              {canResetPassword && (
                <a href={route('password.request')} className="text-orange-500 hover:underline">
                  Forgot Password <span className="font-bold">Click here</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </Head>
  );
}
