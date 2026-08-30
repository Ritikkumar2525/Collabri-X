import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import useAuthStore from '../store/authStore';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });

    const navigate = useNavigate();
    const { register, googleLogin, isLoading, error, token, clearError } = useAuthStore();

    const googleSignUp = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            // Exchange access token for user info, then send to our backend
            try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await res.json();
                // Send user info to our backend for JWT creation
                await googleLogin(null, userInfo);
            } catch (err) {
                useAuthStore.setState({ error: 'Google Signup was unsuccessful. Try again.' });
            }
        },
        onError: () => {
            useAuthStore.setState({ error: 'Google Signup was unsuccessful. Try again.' });
        },
    });

    useEffect(() => {
        if (token) {
            navigate('/dashboard');
        }
        return () => clearError();
    }, [token, navigate, clearError]);

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await register(formData);
    };

    return (
        <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-dark relative overflow-hidden">
            {/* Subtle background separation */}
            <div className="absolute top-0 left-0 w-full h-1 bg-red-accent z-10" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-accent/20 rounded-full blur-3xl opacity-50" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-red-accent/20 rounded-full blur-3xl opacity-50" />

            <div className="w-full max-w-md space-y-8 bg-dark-lighter p-10 rounded-[2rem] shadow-xl shadow-black/50/50 border border-white/5 relative z-20 transition-all">
                <div className="text-center">
                    <h2 className="text-3xl font-light tracking-tight text-white mb-2">
                        Create your workspace
                    </h2>
                    <p className="text-sm text-gray-500 font-medium">
                        Start a persistent space for your team's ideas.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-dark border border-white/10 text-gray-400 px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-center w-full mb-4">
                        <button
                            type="button"
                            onClick={() => googleSignUp()}
                            className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl border border-white/10 bg-dark/50 hover:bg-dark hover:border-white/20 transition-all text-sm font-medium text-white"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign in with Google
                        </button>
                    </div>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs font-medium uppercase">
                            <span className="bg-dark-lighter px-2 text-gray-500 tracking-widest">or sign up with email</span>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-1.5 focus-within:trangray-x-1 transition-transform">
                            <label htmlFor="name" className="block text-xs font-medium text-gray-500 uppercase tracking-widest pl-1">
                                Full Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="relative block w-full rounded-xl border-0 py-3 px-4 text-white ring-1 ring-inset ring-gray-200 placeholder:text-gray-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6 bg-dark/50 transition-all outline-none"
                                placeholder="Your name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-1.5 focus-within:trangray-x-1 transition-transform">
                            <label htmlFor="email" className="block text-xs font-medium text-gray-500 uppercase tracking-widest pl-1">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="relative block w-full rounded-xl border-0 py-3 px-4 text-white ring-1 ring-inset ring-gray-200 placeholder:text-gray-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6 bg-dark/50 transition-all outline-none"
                                placeholder="you@company.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-1.5 focus-within:trangray-x-1 transition-transform">
                            <label htmlFor="password" className="block text-xs font-medium text-gray-500 uppercase tracking-widest pl-1">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="relative block w-full rounded-xl border-0 py-3 px-4 text-white ring-1 ring-inset ring-gray-200 placeholder:text-gray-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6 bg-dark/50 transition-all outline-none"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex w-full justify-center rounded-xl bg-red-accent py-3.5 px-4 text-sm font-medium text-white hover:bg-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 shadow-lg shadow-red-600/20 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] mb-3"
                        >
                            {isLoading ? 'Creating account...' : 'Sign up'}
                        </button>
                        <p className="text-[10px] text-center text-gray-500 font-medium uppercase tracking-widest">
                            Free to start • No credit card required
                        </p>
                    </div>
                </form>

                <div className="text-center mt-6 pt-2 border-t border-white/5">
                    <p className="text-sm text-gray-500 font-medium">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-red-accent hover:text-red-500 transition-colors">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
