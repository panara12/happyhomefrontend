import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Edit2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/ui/Pagination';
import Modal, {
  modalInputClass,
  modalLabelClass,
  modalSecondaryBtnClass,
  modalSelectClass,
} from '../../components/ui/Modal';
import { useAddLead, useGetAllLeads, useUpdateLead } from '../../hooks/useLead';
import { useGetAllStores } from '../../hooks/useStore';

const emptyForm = {
  product_name: '',
  customer_name: '',
  phone: '',
  storeId: '',
};

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function userLabel(user) {
  if (!user) return '—';
  if (typeof user === 'string') return user;
  return user.fullName || user.username || '—';
}

const THEME = {
  amber: {
    primaryBtn: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700',
    focusRing: 'focus:ring-amber-500',
    accent: 'text-amber-600',
  },
};

export default function LeadManagement({ user: userProp }) {
  const reduxUser = useSelector((state) => state.app.userInfo);
  const user = userProp || reduxUser;
  const theme = THEME.amber;
  const isAdmin = user?.userType === 'admin';

  const { data: storesData, isLoading: storesLoading } = useGetAllStores({ enabled: isAdmin });
  const stores = storesData?.stores ?? [];

  const { data, isLoading, isError } = useGetAllLeads({ limit: 100 });
  const leads = useMemo(() => data?.leads || [], [data?.leads]);

  const { mutate: addLead, isPending: isAdding } = useAddLead();
  const { mutate: updateLead, isPending: isUpdating } = useUpdateLead();

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formData, setFormData] = useState({
    ...emptyForm,
    storeId: !isAdmin && user?.storeId ? String(user.storeId) : '',
  });

  const getStoreName = (storeId) =>
    stores.find((s) => String(s.storeId) === String(storeId))?.name || storeId || '—';

  const filteredLeads = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(
      (lead) =>
        lead.product_name?.toLowerCase().includes(q) ||
        lead.customer_name?.toLowerCase().includes(q) ||
        lead.phone?.toLowerCase().includes(q) ||
        String(lead.storeId || '').toLowerCase().includes(q) ||
        getStoreName(lead.storeId).toLowerCase().includes(q)
    );
  }, [leads, searchTerm, stores]);

  const pagination = usePagination(filteredLeads);

  const openCreate = () => {
    setEditingLead(null);
    setFormData({
      ...emptyForm,
      storeId: !isAdmin && user?.storeId ? String(user.storeId) : '',
    });
    setShowModal(true);
  };

  const openEdit = (lead) => {
    setEditingLead(lead);
    setFormData({
      product_name: lead.product_name || '',
      customer_name: lead.customer_name || '',
      phone: lead.phone || '',
      storeId: lead.storeId ? String(lead.storeId) : '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLead(null);
    setFormData({
      ...emptyForm,
      storeId: !isAdmin && user?.storeId ? String(user.storeId) : '',
    });
  };

  const handleSubmit = () => {
    if (!formData.product_name.trim() || !formData.customer_name.trim() || !formData.phone.trim()) {
      toast.error('Please fill product name, customer name, and phone number.');
      return;
    }

    const resolvedStoreId = isAdmin
      ? String(formData.storeId || '').trim()
      : String(user?.storeId || formData.storeId || '').trim();

    if (!resolvedStoreId) {
      toast.error(isAdmin ? 'Please select a store.' : 'Store is missing for your account.');
      return;
    }

    const payload = {
      product_name: formData.product_name.trim(),
      customer_name: formData.customer_name.trim(),
      phone: formData.phone.trim(),
      storeId: resolvedStoreId,
    };

    if (editingLead) {
      updateLead(
        { _id: editingLead._id, ...payload },
        { onSuccess: () => closeModal() }
      );
      return;
    }

    addLead(payload, { onSuccess: () => closeModal() });
  };

  useEffect(() => {
    if (!showModal) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showModal]);

  const isSaving = isAdding || isUpdating;
  const subtitle = isAdmin
    ? 'View and manage leads across all stores'
    : `Leads for your store${user?.storeId ? ` (${getStoreName(user.storeId)})` : ''}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Leads</h2>
          <p className="text-gray-600 mt-1">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className={`inline-flex items-center justify-center gap-2 px-5 py-3 text-white rounded-lg font-medium shadow ${theme.primaryBtn}`}
        >
          <Plus size={18} />
          Add Lead
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Leads</p>
          <p className={`text-2xl font-bold mt-1 ${theme.accent}`}>{leads.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
            <UserPlus size={20} />
          </div>
          <div>
            <p className="text-gray-600 text-sm">Showing</p>
            <p className="text-lg font-semibold text-gray-800">{filteredLeads.length} records</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isAdmin ? 'Search product, customer, phone, or store...' : 'Search product, customer, or phone...'}
              className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${theme.focusRing}`}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading leads...</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-600">Failed to load leads. Please try again.</div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No leads found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    {isAdmin && <th className="px-4 py-3 font-medium">Store</th>}
                    <th className="px-4 py-3 font-medium">Product Name</th>
                    <th className="px-4 py-3 font-medium">Customer Name</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 font-medium">Created By</th>
                    <th className="px-4 py-3 font-medium">Updated</th>
                    <th className="px-4 py-3 font-medium">Updated By</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pagination.paginatedItems.map((lead) => (
                    <tr key={lead._id} className="hover:bg-gray-50">
                      {isAdmin && (
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          <div className="font-medium">{getStoreName(lead.storeId)}</div>
                          <div className="text-xs text-gray-500">{lead.storeId || '—'}</div>
                        </td>
                      )}
                      <td className="px-4 py-3 font-medium text-gray-800">{lead.product_name}</td>
                      <td className="px-4 py-3 text-gray-700">{lead.customer_name}</td>
                      <td className="px-4 py-3 text-gray-700">{lead.phone}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(lead.createdAt)}</td>
                      <td className="px-4 py-3 text-gray-600">{userLabel(lead.created_by)}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(lead.updatedAt)}</td>
                      <td className="px-4 py-3 text-gray-600">{userLabel(lead.updated_by)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(lead)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-100">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                pageSize={pagination.pageSize}
                onPageChange={pagination.goToPage}
              />
            </div>
          </>
        )}
      </div>

      {showModal && (
        <Modal
          title={editingLead ? 'Update Lead' : 'Add Lead'}
          onClose={closeModal}
          size="md"
          footer={
            <>
              <button type="button" onClick={closeModal} className={modalSecondaryBtnClass}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving || (isAdmin && storesLoading)}
                className={`w-full sm:w-48 px-4 py-2.5 text-white rounded-lg transition-all text-sm font-medium text-center shrink-0 disabled:opacity-60 ${theme.primaryBtn}`}
              >
                {isSaving ? 'Saving...' : editingLead ? 'Update Lead' : 'Create Lead'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            {isAdmin && (
              <div>
                <label className={modalLabelClass}>Store</label>
                <select
                  value={formData.storeId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, storeId: e.target.value }))}
                  className={modalSelectClass}
                  required
                >
                  <option value="">Select store</option>
                  {stores.map((store) => (
                    <option key={store.storeId} value={String(store.storeId)}>
                      {store.name} ({store.storeId})
                    </option>
                  ))}
                </select>
                {storesLoading && (
                  <p className="text-xs text-gray-500 mt-1">Loading stores...</p>
                )}
                {!storesLoading && stores.length === 0 && (
                  <p className="text-xs text-red-600 mt-1">No stores found. Add a store first.</p>
                )}
              </div>
            )}
            <div>
              <label className={modalLabelClass}>Product Name</label>
              <input
                type="text"
                value={formData.product_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, product_name: e.target.value }))}
                className={modalInputClass}
                placeholder="Enter product name"
              />
            </div>
            <div>
              <label className={modalLabelClass}>Customer Name</label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, customer_name: e.target.value }))}
                className={modalInputClass}
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <label className={modalLabelClass}>Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                className={modalInputClass}
                placeholder="Enter phone number"
              />
            </div>
            {editingLead && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100 text-xs text-gray-500">
                <p>Created: {formatDate(editingLead.createdAt)} by {userLabel(editingLead.created_by)}</p>
                <p>Updated: {formatDate(editingLead.updatedAt)} by {userLabel(editingLead.updated_by)}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
