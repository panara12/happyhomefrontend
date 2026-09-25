import { useCallback, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, MapPin, Phone, User, Search, Loader2, Navigation } from 'lucide-react';
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
  storeEmail: '',
  state: '',
  code: '',
  storePanNumber: '',
  latitude: '',
  longitude: '',
  status: 'active',
};

function getBrowserGps() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        });
      },
      (err) => {
        reject(
          new Error(
            err?.code === 1
              ? 'Location permission denied'
              : 'Unable to get current GPS location'
          )
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

function LocationFields({ form, setForm, locating, onGetGps }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={modalLabelClass}>Latitude</label>
          <input
            type="number"
            step="any"
            value={form.latitude}
            onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            className={modalInputClass}
            placeholder="From GPS"
          />
        </div>
        <div>
          <label className={modalLabelClass}>Longitude</label>
          <input
            type="number"
            step="any"
            value={form.longitude}
            onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            className={modalInputClass}
            placeholder="From GPS"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={onGetGps}
        disabled={locating}
        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium border border-blue-300 text-blue-800 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-60"
      >
        {locating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
        Use current GPS
      </button>
      <p className="text-xs text-gray-500">
        Stand at the store and tap Use current GPS to fill coordinates (required for sales/manager login).
      </p>
    </>
  );
}

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
  const [locating, setLocating] = useState(false);

  const resetAddForm = () => setFormData(emptyForm);

  const fillCoords = useCallback((setter, coords) => {
    setter((prev) => ({
      ...prev,
      latitude: String(coords.latitude),
      longitude: String(coords.longitude),
    }));
  }, []);

  const handleGetGps = async (setter) => {
    setLocating(true);
    try {
      const coords = await getBrowserGps();
      fillCoords(setter, coords);
      toast.success('GPS coordinates filled');
    } catch (err) {
      toast.error(err.message || 'Failed to get GPS');
    } finally {
      setLocating(false);
    }
  };

  const handleAddStore = async () => {
    if (!formData.name || !formData.address || !formData.storeEmail || !formData.state || !formData.code || !formData.storePanNumber) {
      toast.error('Store name, address, email, state, code, and PAN are required');
      return;
    }

    if (formData.latitude === '' || formData.longitude === '') {
      toast.error('Please set store GPS using Use current GPS');
      return;
    }

    try {
      await addStoreMutation.mutateAsync({
        name: formData.name.trim(),
        address: formData.address.trim(),
        number: formData.number,
        gstNumber: formData.gstNumber.trim(),
        storeEmail: formData.storeEmail.trim(),
        state: formData.state.trim(),
        code: formData.code.trim(),
        storePanNumber: formData.storePanNumber.trim(),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
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
      storeEmail: store.storeEmail || '',
      state: store.state || '',
      code: store.code || '',
      storePanNumber: store.storePanNumber || '',
      latitude: store.latitude != null ? String(store.latitude) : '',
      longitude: store.longitude != null ? String(store.longitude) : '',
      status: store.status || 'active',
    });
  };

  const closeEdit = () => {
    setEditingStore(null);
    setEditForm(emptyForm);
  };

  const handleUpdateStore = () => {
    if (!editingStore?.storeId) return;
    if (!editForm.name.trim() || !editForm.address.trim() || !editForm.storeEmail.trim() || !editForm.state.trim() || !editForm.code.trim() || !editForm.storePanNumber.trim()) {
      toast.error('Store name, address, email, state, code, and PAN are required');
      return;
    }

    if (editForm.latitude === '' || editForm.longitude === '') {
      toast.error('Please set store GPS using Use current GPS');
      return;
    }

    updateStoreMutation.mutate(
      {
        id: editingStore.storeId,
        name: editForm.name.trim(),
        address: editForm.address.trim(),
        number: editForm.number,
        gstNumber: editForm.gstNumber.trim(),
        storeEmail: editForm.storeEmail.trim(),
        state: editForm.state.trim(),
        code: editForm.code.trim(),
        storePanNumber: editForm.storePanNumber.trim(),
        status: editForm.status,
        latitude: Number(editForm.latitude),
        longitude: Number(editForm.longitude),
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
                <div>
                  <span className="text-gray-700">{store.address}</span>
                  {store.latitude != null && store.longitude != null ? (
                    <p className="text-xs text-gray-500 mt-1">
                      GPS: {Number(store.latitude).toFixed(6)}, {Number(store.longitude).toFixed(6)}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 mt-1">GPS not set — sales/manager login blocked</p>
                  )}
                </div>
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
                disabled={addStoreMutation.isPending || locating}
                className={modalPrimaryBtnClass}
              >
                {addStoreMutation.isPending || locating ? 'Saving…' : 'Add Store'}
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
            <div>
              <label className={modalLabelClass}>Store Email</label>
              <input
                type="email"
                value={formData.storeEmail}
                onChange={(e) => setFormData({ ...formData, storeEmail: e.target.value })}
                className={modalInputClass}
                placeholder="store@example.com"
              />
            </div>
            <div>
              <label className={modalLabelClass}>State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className={modalInputClass}
                placeholder="State"
              />
            </div>
            <div>
              <label className={modalLabelClass}>Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className={modalInputClass}
                placeholder="Store code"
              />
            </div>
            <div>
              <label className={modalLabelClass}>Store PAN Number</label>
              <input
                type="text"
                value={formData.storePanNumber}
                onChange={(e) => setFormData({ ...formData, storePanNumber: e.target.value })}
                className={modalInputClass}
                placeholder="PAN number"
              />
            </div>
            <LocationFields
              form={formData}
              setForm={setFormData}
              locating={locating}
              onGetGps={() => handleGetGps(setFormData)}
            />
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
                disabled={updateStoreMutation.isPending || locating}
                className={modalPrimaryBtnClass}
              >
                {updateStoreMutation.isPending || locating ? 'Saving…' : 'Save Changes'}
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
              <label className={modalLabelClass}>Store Email</label>
              <input
                type="email"
                value={editForm.storeEmail}
                onChange={(e) => setEditForm({ ...editForm, storeEmail: e.target.value })}
                className={modalInputClass}
              />
            </div>
            <div>
              <label className={modalLabelClass}>State</label>
              <input
                type="text"
                value={editForm.state}
                onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                className={modalInputClass}
              />
            </div>
            <div>
              <label className={modalLabelClass}>Code</label>
              <input
                type="text"
                value={editForm.code}
                onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                className={modalInputClass}
              />
            </div>
            <div>
              <label className={modalLabelClass}>Store PAN Number</label>
              <input
                type="text"
                value={editForm.storePanNumber}
                onChange={(e) => setEditForm({ ...editForm, storePanNumber: e.target.value })}
                className={modalInputClass}
              />
            </div>
            <LocationFields
              form={editForm}
              setForm={setEditForm}
              locating={locating}
              onGetGps={() => handleGetGps(setEditForm)}
            />
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
