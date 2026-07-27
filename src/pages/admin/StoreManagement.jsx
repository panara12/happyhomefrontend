import { useState } from 'react';
import { Plus, Edit2, Trash2, MapPin, Phone, User, Search } from 'lucide-react';

export default function StoreManagement({ user }) {
  const [stores, setStores] = useState([
    {
      id: 1,
      name: 'Main Store - MG Road',
      location: 'MG Road, Bangalore',
      phone: '+91 98765 43210',
      manager: 'Store Manager 1',
      status: 'Active',
      inventory: 450
    },
    {
      id: 2,
      name: 'Branch Store - Indiranagar',
      location: 'Indiranagar, Bangalore',
      phone: '+91 98765 43211',
      manager: 'Store Manager 2',
      status: 'Active',
      inventory: 320
    },
    {
      id: 3,
      name: 'Branch Store - Whitefield',
      location: 'Whitefield, Bangalore',
      phone: '+91 98765 43212',
      manager: 'Not Assigned',
      status: 'Active',
      inventory: 280
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    phone: '',
    manager: ''
  });

  const handleAddStore = () => {
    if (formData.name && formData.location) {
      setStores([...stores, {
        id: stores.length + 1,
        ...formData,
        status: 'Active',
        inventory: 0
      }]);
      setFormData({ name: '', location: '', phone: '', manager: '' });
      setShowAddModal(false);
    }
  };

  const handleDeleteStore = (id) => {
    if (confirm('Are you sure you want to delete this store?')) {
      setStores(stores.filter(store => store.id !== id));
    }
  };

  const filteredStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.location.toLowerCase().includes(searchTerm.toLowerCase());
    // Managers can only see their own store
    const matchesStore = user.role === 'admin' || (user.storeId && store.id === user.storeId);
    return matchesSearch && matchesStore;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Store Management</h2>
          <p className="text-gray-600 mt-1">{user.role === 'admin' ? 'Manage all your retail stores' : 'View store information'}</p>
        </div>
        {user.role === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg"
          >
            <Plus size={20} />
            Add New Store
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search stores by name or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStores.map(store => (
          <div key={store.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{store.name}</h3>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                  store.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {store.status}
                </span>
              </div>
              {user.role === 'admin' && (
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600">
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteStore(store.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-500 mt-1" />
                <span className="text-gray-700">{store.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-gray-500" />
                <span className="text-gray-700">{store.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <User size={18} className="text-gray-500" />
                <span className="text-gray-700">{store.manager}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Items</span>
                <span className="text-lg font-bold text-amber-600">{store.inventory}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Store Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Add New Store</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="e.g., Branch Store - Location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="Full address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Manager</label>
                <input
                  type="text"
                  value={formData.manager}
                  onChange={(e) => setFormData({...formData, manager: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="Manager name"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStore}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all"
              >
                Add Store
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}