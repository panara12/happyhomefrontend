// DEV ONLY — remove this component before going to production

const DEV_USERS = [
    { label: 'Admin',      userType: 'admin',      username: 'admin_home',    password: 'demo123' },
    { label: 'Manager',    userType: 'manager',    username: 'storemanager1', password: 'demo123' },
    { label: 'Sales',      userType: 'sales',      username: 'sales11',       password: 'demo123' },
    { label: 'Accounting', userType: 'accounting', username: 'accounting11',  password: 'demo123' },
];

const BADGE_COLORS = {
    admin:      'bg-purple-100 text-purple-700 border-purple-200',
    manager:    'bg-blue-100   text-blue-700   border-blue-200',
    sales:      'bg-amber-100  text-amber-700  border-amber-200',
    accounting: 'bg-green-100  text-green-700  border-green-200',
};

export default function DevLoginHints({ onFill }) {
    return (
        <div className="mt-6 border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Dev quick-fill — remove in production
            </p>
            <div className="grid grid-cols-2 gap-2">
                {DEV_USERS.map((u) => (
                    <button
                        key={u.username}
                        type="button"
                        onClick={() => onFill(u.username, u.password)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left hover:opacity-80 transition-opacity ${BADGE_COLORS[u.userType]}`}
                    >
                        <span className="text-xs font-semibold">{u.label}</span>
                        <span className="text-xs text-gray-500 truncate">{u.username}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
