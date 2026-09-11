import { useEffect, useMemo, useState } from 'react';
import { Plus, RotateCcw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/ui/Pagination';
import AutocompleteInput from '../../components/ui/AutocompleteInput';
import Modal, {
  modalInputClass,
  modalLabelClass,
  modalSecondaryBtnClass,
  modalPrimaryBtnClass,
} from '../../components/ui/Modal';
import { useGetStoreInvoices } from '../../hooks/useInvoice';
import { useGetAllStores } from '../../hooks/useStore';
import {
  useCreateSalesReturn,
  useGetSalesReturns,
  useUpdateSalesReturnStatus,
} from '../../hooks/useSalesReturn';
import { DEFAULT_REFUND_METHOD, REFUND_METHODS } from './salesReturnConstants';

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-CA');
}

function statusLabel(status) {
  if (!status) return '';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

const emptyForm = {
  phone: '',
  reason: '',
  refundMethod: DEFAULT_REFUND_METHOD,
};

function sanitizePhone(value) {
  return String(value || '').replace(/[^\d+\-\s]/g, '');
}

export default function SalesReturn() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [invoiceQuery, setInvoiceQuery] = useState('');
  const [debouncedInvoiceQuery, setDebouncedInvoiceQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInvoiceQuery(invoiceQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [invoiceQuery]);

  const { data, isLoading } = useGetSalesReturns({ q: debouncedSearch, limit: 100 });
  const { data: storesData } = useGetAllStores();
  const { data: invoicesData } = useGetStoreInvoices({
    q: debouncedInvoiceQuery,
    status: 'approved',
    limit: 20,
    enabled: showAddModal,
  });
  const createReturnMutation = useCreateSalesReturn();
  const updateStatusMutation = useUpdateSalesReturnStatus();

  const returns = data?.salesReturns || [];
  const summary = data?.summary || { total: 0, pending: 0, approved: 0, totalRefund: 0 };
  const stores = storesData?.stores || [];
  const invoices = invoicesData?.invoices || [];

  const storeNameById = useMemo(() => {
    const map = new Map();
    stores.forEach((s) => {
      if (s.storeId) map.set(String(s.storeId), s.name || s.storeId);
    });
    return map;
  }, [stores]);

  const invoiceOptions = useMemo(() => {
    return invoices.map((inv) => ({
      id: inv._id || inv.id,
      label: inv.invoiceNumber,
      subLabel: `${inv.customerName || 'Customer'} • ${inv.customerPhone || '—'}`,
      raw: inv,
    }));
  }, [invoices]);

  const selectedStoreName = selectedInvoice?.storeId
    ? storeNameById.get(String(selectedInvoice.storeId)) || selectedInvoice.storeId
    : '';

  const resetModal = () => {
    setSelectedInvoice(null);
    setInvoiceQuery('');
    setDebouncedInvoiceQuery('');
    setFormData(emptyForm);
  };

  const handleSelectInvoice = (opt) => {
    const inv = opt.raw;
    setSelectedInvoice(inv);
    setInvoiceQuery(inv.invoiceNumber || '');
    setFormData((prev) => ({
      ...prev,
      phone: sanitizePhone(inv.customerPhone || ''),
    }));
  };

  const handleCreateReturn = () => {
    if (!selectedInvoice?._id && !selectedInvoice?.id) {
      toast.error('Please select an original invoice');
      return;
    }
    if (!formData.reason.trim()) {
      toast.error('Please enter a return reason');
      return;
    }
    if (!formData.refundMethod) {
      toast.error('Please select a refund method');
      return;
    }

    createReturnMutation.mutate(
      {
        invoiceId: selectedInvoice._id || selectedInvoice.id,
        customerPhone: formData.phone.trim(),
        reason: formData.reason.trim(),
        refundMethod: formData.refundMethod,
      },
      {
        onSuccess: () => {
          setShowAddModal(false);
          resetModal();
        },
      }
    );
  };

  const handleApproveReturn = (ret) => {
    updateStatusMutation.mutate(
      { id: ret._id || ret.id, status: 'approved' },
      { onSuccess: () => toast.success('Return approved!') }
    );
  };

  const handleRejectReturn = (ret) => {
    updateStatusMutation.mutate(
      { id: ret._id || ret.id, status: 'rejected' },
      { onSuccess: () => toast.success('Return rejected!') }
    );
  };

  const returnsPagination = usePagination(returns);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Sales Returns</h2>
          <p className="text-gray-600 mt-1">Manage customer return requests</p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetModal();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg"
        >
          <Plus size={20} />
          Create Sales Return
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Returns</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{summary.total}</p>
        </div>
        <div className="bg-orange-50 rounded-lg shadow p-4 border border-orange-200">
          <p className="text-orange-600 text-sm">Pending</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{summary.pending}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
          <p className="text-green-600 text-sm">Approved</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{summary.approved}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4 border border-red-200">
          <p className="text-red-600 text-sm">Total Refund Amount</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            ₹{Number(summary.totalRefund || 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by customer, invoice, or return ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
        />
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">Loading sales returns...</div>
      ) : returns.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">No sales returns found</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {returnsPagination.paginatedItems.map((ret) => (
            <div
              key={ret._id || ret.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <RotateCcw className="text-red-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{ret.returnNumber}</h3>
                    <p className="text-sm text-gray-600">
                      Original Invoice: {ret.originalInvoice || ret.invoiceNumber}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    ret.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : ret.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {statusLabel(ret.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Customer</p>
                  <p className="font-medium text-gray-800">{ret.customer || ret.customerName}</p>
                  <p className="text-xs text-gray-600">{ret.phone || ret.customerPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Date</p>
                  <p className="font-medium text-gray-800">{formatDate(ret.date || ret.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Store</p>
                  <p className="font-medium text-gray-800">{ret.store}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Refund Method</p>
                  <p className="font-medium text-gray-800">{ret.refundMethod}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Return Reason:</p>
                <p className="text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  {ret.reason}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-medium text-gray-800">
                    ₹{Number(ret.subtotal || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">GST (CGST + SGST):</span>
                  <span className="font-medium text-gray-800">
                    ₹{Number((ret.cgst || 0) + (ret.sgst || 0) || ret.tax || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-lg font-bold text-gray-800">Total Refund:</span>
                  <span className="text-2xl font-bold text-red-600">
                    ₹{Number(ret.total || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {ret.status === 'pending' && (
                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => handleApproveReturn(ret)}
                    disabled={updateStatusMutation.isPending}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                  >
                    Approve Return
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectReturn(ret)}
                    disabled={updateStatusMutation.isPending}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                  >
                    Reject Return
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Pagination
        page={returnsPagination.page}
        totalPages={returnsPagination.totalPages}
        totalItems={returnsPagination.totalItems}
        pageSize={returnsPagination.pageSize}
        onPageChange={returnsPagination.goToPage}
      />

      {showAddModal && (
        <Modal
          title="Create Sales Return"
          size="md"
          onClose={() => {
            setShowAddModal(false);
            resetModal();
          }}
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetModal();
                }}
                className={modalSecondaryBtnClass}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateReturn}
                disabled={createReturnMutation.isPending}
                className={modalPrimaryBtnClass}
              >
                {createReturnMutation.isPending ? 'Creating...' : 'Create Return'}
              </button>
            </>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <AutocompleteInput
                label="Original Invoice Number"
                required
                placeholder="INV-001"
                value={invoiceQuery}
                onChange={(value) => {
                  setInvoiceQuery(value);
                  if (selectedInvoice && value !== selectedInvoice.invoiceNumber) {
                    setSelectedInvoice(null);
                    setFormData((prev) => ({ ...prev, phone: '' }));
                  }
                }}
                onSelect={handleSelectInvoice}
                options={invoiceOptions}
              />
            </div>

            <div>
              <label className={modalLabelClass}>Customer Name</label>
              <input
                type="text"
                value={selectedInvoice?.customerName || ''}
                readOnly
                className={`${modalInputClass} bg-gray-100`}
                placeholder="Select invoice first"
              />
            </div>

            <div>
              <label className={modalLabelClass}>Phone Number</label>
              <input
                type="text"
                inputMode="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: sanitizePhone(e.target.value) })}
                className={modalInputClass}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            <div>
              <label className={modalLabelClass}>Store</label>
              <select
                value={selectedInvoice?.storeId || ''}
                disabled={!selectedInvoice}
                className={`${modalInputClass} disabled:bg-gray-100`}
              >
                {!selectedInvoice && <option value="">Select invoice first</option>}
                {selectedInvoice?.storeId && (
                  <option value={selectedInvoice.storeId}>{selectedStoreName}</option>
                )}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className={modalLabelClass}>Return Reason</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className={modalInputClass}
                rows={3}
                placeholder="Describe the reason for return"
              />
            </div>

            <div className="sm:col-span-2">
              <label className={modalLabelClass}>Refund Method</label>
              <select
                value={formData.refundMethod}
                onChange={(e) => setFormData({ ...formData, refundMethod: e.target.value })}
                className={modalInputClass}
              >
                {REFUND_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
