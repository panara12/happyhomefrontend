import { useMemo, useState } from 'react';
import { Search, Shield, Users, Computer, Edit, Trash, Undo2 } from 'lucide-react';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/ui/Pagination';

const getRoleBadge = (userType) => {
  switch (userType) {
    case 'admin': return 'bg-purple-100 text-purple-700';
    case 'manager': return 'bg-blue-100 text-blue-700';
    case 'sales': return 'bg-green-100 text-green-700';
    case 'accounting': return 'bg-yellow-100 text-yellow-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getRoleIcon = (userType) => {
  switch (userType) {
    case 'admin': return <Shield size={18} className="text-purple-600" />;
    case 'manager': return <Users size={18} className="text-blue-600" />;
    case 'accounting': return <Computer size={18} className='text-yellow-600' />
    default: return <Users size={18} className="text-green-600" />;
  }
};

// `users` is already role/store-access filtered by the parent — this owns
// the text search, pagination, and table rendering for that access-scoped list.
export function TeamMembersTab({ users, onEditUser, onDeleteUser, onActivateUser }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = useMemo(() => users.filter(u =>
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  ), [users, searchTerm]);

  const pagination = usePagination(filteredUsers);

  return (
    <>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search team members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
        />
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Employee</th>
                <th className="px-4 py-3 text-left">Username</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-center">Role</th>
                <th className="px-4 py-3 text-left">Store</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pagination.paginatedItems.map(u => (
                <tr key={u._id ?? u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                        {u.fullName.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-800">{u.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.username}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {getRoleIcon(u.userType)}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadge(u.userType)}`}>
                        {u.userType}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{u.storeId || "admin"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      u.active === true ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {u.active === true ? 'Active' : 'Deactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-3 text-center">
                    <button className="text-blue-500 hover:text-blue-700"
                      onClick={() => onEditUser(u)}>
                      <Edit size={18} />
                    </button>
                    {
                      u.active == true ? <button className="text-red-500 hover:text-red-700"
                        onClick={() => onDeleteUser(u)}>
                        <Trash size={18} />
                      </button> :
                        <button className="text-green-500 hover:text-green-700"
                          onClick={() => onActivateUser(u)}>
                          <Undo2 size={18} />
                        </button>
                    }

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={pagination.goToPage}
        />
      </div>
    </>
  );
}
