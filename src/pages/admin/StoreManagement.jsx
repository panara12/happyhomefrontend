import { useCallback, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, MapPin, Phone, User, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useGetAllStores, useAddStore, useUpdateStore } from '../../hooks/useStore';
import { useSelector } from 'react-redux';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/ui/Pagination';
import Modal, {
  modalInputClass,
  modalLabelClass,
  modalSecondaryBtnClass,
  modalPrimaryBtnClass,
} from '../../components/ui/Modal';

const EMPTY_ARRAY = [];

const emptyForm = {
  name: '',
  address: '',
  number: '',
  gstNumber: '',
  status: 'active',
};

export default function StoreManagement() {
  const user = useSelector((state) => state.app.userInfo);
  const role = user?.userType || user?.role || '';
  const userStoreId = user?.storeId;

  const {
    data: storeResponse,
    isLoading: storeLoading,
    isError: isStoreError,
    error: storeError,
  } = useGetAllStores();

  const addStoreMutation = useAddStore();
  const updateStoreMutation = useUpdateStore();

  const stores = storeResponse?.stores ?? EMPTY_ARRAY;
  const managers = storeResponse?.managers ?? EMPTY_ARRAY;

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  const resetAddForm = () => setFormData(emptyForm);

  const handleAddStore = async () => {
    if (!formData.name || !formData.address) {
      toast.error('Store name and address are required');
      return;
    }

    try {
      await addStoreMutation.mutateAsync({
        name: formData.name.trim(),
        address: formData.address.trim(),
        number: formData.number,
        gstNumber: formData.gstNumber.trim(),
      });
      resetAddForm();
      setShowAddModal(false);
    } catch {
      // toast handled by useApiMutation
    }
  };

  const openEdit = (store) => {
    setEditingStore(store);
    setEditForm({
      name: store.name || '',
      address: store.address || '',
      number: store.number ?? '',
      gstNumber: store.gstNumber || '',
      status: store.status || 'active',
    });
  };

  const closeEdit = () => {
    setEditingStore(null);
    setEditForm(emptyForm);
  };

  const handleUpdateStore = () => {
    if (!editingStore?.storeId) return;
    if (!editForm.name.trim() || !editForm.address.trim()) {
      toast.error('Store name and address are required');
      return;
    }

    updateStoreMutation.mutate(
      {
        id: editingStore.storeId,
        name: editForm.name.trim(),
        address: editForm.address.trim(),
        number: editForm.number,
        gstNumber: editForm.gstNumber.trim(),
        status: editForm.status,
      },
      {
        onSuccess: () => closeEdit(),
      }
    );
  };

  const handleDeleteStore = () => {
    if (confirm('Are you sure you want to delete this store?')) {
      toast.error('Delete is not yet available');
    }
  };

  const filteredStores = useMemo(() => stores.filter((store) => {
    const matchesSearch =
      store.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStore = role === 'admin' || (userStoreId && store.storeId === userStoreId);
    return matchesSearch && matchesStore;
  }), [stores, searchTerm, role, userStoreId]);

  const managerInfo = useCallback((storeId) => {
    return managers
      .filter((manager) => manager.storeId === storeId)
      .map((manager) => manager.fullName)
      .join(', ');
  }, [managers]);

  const storesPagination = usePagination(filteredStores);

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
            {role === 'admin' ? 'Manage all your retail stores' : 'View store information'}
          </p>
        </div>
        {role === 'admin' && (
          <button
            type="button"
            onClick={() => {
              resetAddForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg"
          >
            <Plus size={20} />
            Add New Store
          </button>
        )}
      </div>

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
              {role === 'admin' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(store)}
                    className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                    title="Edit store"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteStore(store.storeId)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                    title="Delete store"
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
                <span className="text-gray-700">{managerInfo(store.storeId) || '—'}</span>
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

      {showAddModal && (
        <Modal
          title="Add New Store"
          size="sm"
          onClose={() => {
            resetAddForm();
            setShowAddModal(false);
          }}
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  resetAddForm();
                  setShowAddModal(false);
                }}
                className={modalSecondaryBtnClass}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddStore}
                disabled={addStoreMutation.isPending}
                className={modalPrimaryBtnClass}
              >
                {addStoreMutation.isPending ? 'Adding…' : 'Add Store'}
              </button>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-y-3">
            <div>
              <label className={modalLabelClass}>Store Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={modalInputClass}
                placeholder="e.g., Branch Store - Location"
              />
            </div>
            <div>
              <label className={modalLabelClass}>Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={modalInputClass}
                placeholder="Full address"
              />
            </div>
            <div>
              <label className={modalLabelClass}>Phone</label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                className={modalInputClass}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <div>
              <label className={modalLabelClass}>GST Number</label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                className={modalInputClass}
                placeholder="GST Number"
              />
            </div>
          </div>
        </Modal>
      )}

      {editingStore && (
        <Modal
          title={`Edit Store — ${editingStore.storeId}`}
          size="sm"
          onClose={closeEdit}
          footer={
            <>
              <button type="button" onClick={closeEdit} className={modalSecondaryBtnClass}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStore}
                disabled={updateStoreMutation.isPending}
                className={modalPrimaryBtnClass}
              >
                {updateStoreMutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-y-3">
            <div>
              <label className={modalLabelClass}>Store Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className={modalInputClass}
              />
            </div>
            <div>
              <label className={modalLabelClass}>Address</label>
              <input
                type="text"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className={modalInputClass}
              />
            </div>
            <div>
              <label className={modalLabelClass}>Phone</label>
              <input
                type="text"
                value={editForm.number}
                onChange={(e) => setEditForm({ ...editForm, number: e.target.value })}
                className={modalInputClass}
              />
            </div>
            <div>
              <label className={modalLabelClass}>GST Number</label>
              <input
                type="text"
                value={editForm.gstNumber}
                onChange={(e) => setEditForm({ ...editForm, gstNumber: e.target.value })}
                className={modalInputClass}
              />
            </div>
            <div>
              <label className={modalLabelClass}>Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className={modalInputClass}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
