import { useState } from 'react';
import { LogIn, Loader2, MapPin } from 'lucide-react';
import { useLogin } from '../../hooks/useAuth';
import logoImg from '../../assets/logo.jpg';
import DevLoginHints from '../../components/DevLoginHints';

function getCurrentPosition() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve({ latitude: null, longitude: null, geoError: 'Geolocation is not supported by this browser.' });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resolve({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    geoError: null,
                });
            },
            (err) => {
                const message =
                    err?.code === 1
                        ? 'Location access denied. Please enable location and try again.'
                        : 'Unable to get your location. Please enable location and try again.';
                resolve({ latitude: null, longitude: null, geoError: message });
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0,
            }
        );
    });
}

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState(null);
    const [locating, setLocating] = useState(false);
    const { mutate: userLogin, isPending, error, reset } = useLogin();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError(null);
        reset?.();

        setLocating(true);
        const { latitude, longitude } = await getCurrentPosition();
        setLocating(false);

        const payload = { username, password };
        if (latitude != null && longitude != null) {
            payload.latitude = latitude;
            payload.longitude = longitude;
        }

        userLogin(payload, {
            onError: (err) => {
                setLocalError(err?.response?.data?.message || 'Login failed. Please try again.');
            },
        });
    };

    const busy = isPending || locating;
    const errorMessage =
        localError ||
        error?.response?.data?.message ||
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
                            disabled={busy}
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
                            disabled={busy}
                        />
                    </div>

                    <p className="text-xs text-gray-500 flex items-start gap-1.5">
                        <MapPin size={14} className="mt-0.5 shrink-0 text-amber-600" />
                        Sales and manager logins require location within 200m of your assigned store.
                    </p>

                    {errorMessage && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            {errorMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={busy}
                        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all flex items-center justify-center gap-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {busy ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <LogIn size={20} />
                        )}
                        {locating ? 'Getting location...' : isPending ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <DevLoginHints onFill={(u, p) => { setUsername(u); setPassword(p); }} />
            </div>
        </div>
    );
}
