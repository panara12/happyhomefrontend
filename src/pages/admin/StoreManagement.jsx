import { useCallback, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, MapPin, Phone, User, Search } from 'lucide-react';
import { useGetAllStores, useAddStore } from '../../hooks/useStore';
import {useSelector} from 'react-redux';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/ui/Pagination';

// Stable reference so the `?? EMPTY_ARRAY` fallback below doesn't hand
// useMemo/useCallback a new array (and therefore a new dep) every render.
const EMPTY_ARRAY = [];

export default function StoreManagement() {
    const user = useSelector((state) => state.app.userInfo); // Assuming you have a Redux store with auth slice
    console.log('User info from Redux:', useSelector((state) => state.app.userInfo));
    const {
        data: storeResponse,
        isLoading: storeLoading,
        isError: isStoreError,
        error: storeError,
    } = useGetAllStores();
    console.log(storeResponse)

    const addStoreMutation = useAddStore();

    // Derive directly from the query — no useEffect/local-state mirroring,
    // and this defaults to [] so nothing downstream ever sees `undefined`.
    const stores = storeResponse?.stores ?? EMPTY_ARRAY;
    const managers = storeResponse?.managers ?? EMPTY_ARRAY;
    console.log('Stores fetched:', stores);

    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        number: '',
        gstNumber: '',
    });

    const handleAddStore = async () => {
        if (!formData.name || !formData.address) return;

        try {
            await addStoreMutation.mutateAsync(formData);
            setFormData({ name: '', address: '', number: '', gstNumber: '' });
            setShowAddModal(false);
        } catch (error) {
            // TODO: surface this in the modal instead of just logging
            console.error('Failed to add store', error);
        }
    };

    const handleDeleteStore = () => {
        // Still local-only — wire up a useDeleteStore mutation the same way
        // as useAddStore once that backend route exists.
        if (confirm('Are you sure you want to delete this store?')) {
            console.warn('Delete is not yet wired to the backend');
        }
    };

    // Hooks must run unconditionally on every render, so these are computed
    // before the loading/error early returns below rather than after them.
    const filteredStores = useMemo(() => stores.filter((store) => {
        const matchesSearch =
            store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            store.address.toLowerCase().includes(searchTerm.toLowerCase());
        // Managers can only see their own store
        const matchesStore = user.userType === 'admin' || (user.storeId && store.storeId === user.storeId);
        return matchesSearch && matchesStore;
    }), [stores, searchTerm, user.userType, user.storeId]);

    const managerInfo = useCallback((storeId) => {
      return managers.filter((manager) => manager.storeId === storeId).map((manager) => manager.fullName).join(", ")
    }, [managers]);

    const storesPagination = usePagination(filteredStores);

    // Both `storeLoading` and `!user` used to be silently undefined on the
    // first render — that's what was crashing the page before any data arrived.
    if (storeLoading) {
        return <div className="text-gray-500 p-6">Loading stores…</div>;
    }

    if (isStoreError) {
        return (
            <div className="text-red-600 p-6">
                Couldn't load stores: {storeError?.response?.data?.message || 'Please try again.'}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Store Management</h2>
                    <p className="text-gray-600 mt-1">
                        {user.userType === 'admin' ? 'Manage all your retail stores' : 'View store information'}
                    </p>
                </div>
                {user.userType === 'admin' && (
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
                    placeholder="Search stores by name or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                />
            </div>

            {/* Stores Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {storesPagination.paginatedItems.map((store) => (
                    <div key={store.storeId} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">{store.name}</h3>
                                <span
                                    className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                                        store.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}
                                >
                                    {store.status}
                                </span>
                            </div>
                            {user.userType === 'admin' && (
                                <div className="flex gap-2">
                                    <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600">
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteStore(store.storeId)}
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
                                <span className="text-gray-700">{store.address}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone size={18} className="text-gray-500" />
                                <span className="text-gray-700">{store.number}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <User size={18} className="text-gray-500" />
                                <span className="text-gray-700">{managerInfo(store.storeId)}</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Total Items</span>
                                <span className="text-lg font-bold text-amber-600">{store.totalProducts}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Pagination
                page={storesPagination.page}
                totalPages={storesPagination.totalPages}
                totalItems={storesPagination.totalItems}
                pageSize={storesPagination.pageSize}
                onPageChange={storesPagination.goToPage}
            />

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
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                                    placeholder="e.g., Branch Store - Location"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                                    placeholder="Full address"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                <input
                                    type="text"
                                    value={formData.number}
                                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                                    placeholder="+91 XXXXX XXXXX"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
                                <input
                                    type="text"
                                    value={formData.gstNumber}
                                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                                    placeholder="GST Number"
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
                                disabled={addStoreMutation.isPending}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-60"
                            >
                                {addStoreMutation.isPending ? 'Adding…' : 'Add Store'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}