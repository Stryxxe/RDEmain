import { Head, Link, useForm, router } from '@inertiajs/react';
import { useRef, useEffect } from 'react';
import bg from '../../../assets/bg.png';

export default function VerifyOtp({ email, status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: email || '',
        otp: '',
    });

    const inputRefs = useRef([]);

    useEffect(() => {
        // Focus first input on mount
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const handleOtpChange = (index, e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 1);
        
        if (value) {
            const newOtp = data.otp.split('');
            newOtp[index] = value;
            const updatedOtp = newOtp.join('').slice(0, 6);
            setData('otp', updatedOtp);
            
            // Auto-focus next input
            if (index < 5 && inputRefs.current[index + 1]) {
                inputRefs.current[index + 1].focus();
            }
        } else {
            // Handle backspace
            const newOtp = data.otp.split('');
            newOtp[index] = '';
            setData('otp', newOtp.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !data.otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData.length === 6) {
            setData('otp', pastedData);
            inputRefs.current[5]?.focus();
        }
    };

    const submit = (e) => {
        e.preventDefault();
        if (data.otp.length === 6) {
            post('/password/verify-otp');
        }
    };

    const handleResend = (e) => {
        e.preventDefault();
        router.post('/password/resend-otp', { email });
    };

    return (
        <>
            <Head title="Verify OTP" />
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
                        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                            Verify
                        </h2>
                        <p className="text-sm text-gray-600 mb-6 text-center">
                            Your code was sent to you via email
                        </p>

                        {status && (
                            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm text-center">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit}>
                            <input type="hidden" name="email" value={email} />
                            
                            <div className="flex justify-center gap-2 mb-6">
                                {[0, 1, 2, 3, 4, 5].map((index) => (
                                    <input
                                        key={index}
                                        ref={(el) => (inputRefs.current[index] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength="1"
                                        value={data.otp[index] || ''}
                                        onChange={(e) => handleOtpChange(index, e)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        onPaste={handlePaste}
                                        className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        required
                                    />
                                ))}
                            </div>

                            {errors.otp && (
                                <p className="mb-4 text-sm text-red-600 text-center">{errors.otp}</p>
                            )}

                            <button
                                type="submit"
                                disabled={processing || data.otp.length !== 6}
                                className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? 'Verifying...' : 'Verify'}
                            </button>
                        </form>

                        <div className="text-center mt-6">
                            <p className="text-sm text-gray-600">
                                Didn't receive code?{' '}
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    className="text-orange-500 hover:text-orange-600 underline font-semibold"
                                >
                                    Request again
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

