import { useState } from 'react';
import { LogIn, Loader2 } from 'lucide-react';
import { useLogin } from '../../hooks/useAuth';
import logoImg from '../../assets/logo.jpg';
import DevLoginHints from '../../components/DevLoginHints';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { mutate: userLogin, isPending, error } = useLogin();

    const handleSubmit = (e) => {
        e.preventDefault();
        userLogin({ username, password });
    };

    const errorMessage =
        error?.response?.data?.message ??
        (error ? 'Login failed. Please try again.' : null);

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <div className="flex flex-col items-center mb-8">
                    <img
                        src={logoImg}
                        alt="Happy Home Logo"
                        className="w-32 h-32 object-contain mb-4"
                    />
                    <h1 className="text-3xl font-bold text-gray-800">Happy Home</h1>
                    <p className="text-gray-600 mt-1">Retail Management System</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                            placeholder="Enter username"
                            required
                            disabled={isPending}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                            placeholder="Enter password"
                            required
                            disabled={isPending}
                        />
                    </div>

                    {errorMessage && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            {errorMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all flex items-center justify-center gap-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isPending ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <LogIn size={20} />
                        )}
                        {isPending ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <DevLoginHints onFill={(u, p) => { setUsername(u); setPassword(p); }} />
            </div>
        </div>
    );
}
