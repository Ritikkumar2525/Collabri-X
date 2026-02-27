import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../store/authStore';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const navigate = useNavigate();
    const { login, googleLogin, isLoading, error, token, clearError } = useAuthStore();

    const handleGoogleSuccess = async (credentialResponse) => {
        await googleLogin(credentialResponse.credential);
    };

    const handleGoogleError = () => {
        useAuthStore.setState({ error: 'Google Login was unsuccessful. Try again.' });
    };

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
        await login(formData);
    };

    return (
        <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
            {/* Subtle background separation */}
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600 z-10" />
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50" />

            <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 relative z-20 transition-all">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
                        Welcome back
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">
                        Continue where your team left off.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-slate-50 border border-slate-200 text-slate-600 px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-center w-full mb-4">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            useOneTap
                            theme="outline"
                            shape="pill"
                            width="100%"
                        />
                    </div>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-xs font-bold uppercase">
                            <span className="bg-white px-2 text-slate-400 tracking-widest">or continue with email</span>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                            <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="relative block w-full rounded-xl border-0 py-3 px-4 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-slate-50/50 transition-all outline-none"
                                placeholder="you@company.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                            <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="relative block w-full rounded-xl border-0 py-3 px-4 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-slate-50/50 transition-all outline-none"
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
                            className="flex w-full justify-center rounded-xl bg-indigo-600 py-3.5 px-4 text-sm font-bold text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] mb-3"
                        >
                            {isLoading ? 'Signing in...' : 'Log In'}
                        </button>
                        <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
                            Secure login • Your data stays in your workspace
                        </p>
                    </div>
                </form>

                <div className="text-center pt-2 mt-6 border-t border-slate-100">
                    <p className="text-sm text-slate-500 font-medium">
                        New here?{' '}
                        <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
