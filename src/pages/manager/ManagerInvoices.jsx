import { useEffect, useMemo, useState } from 'react';
import {
  Search, Eye, CheckCircle, XCircle, Printer, Send, Edit2, Plus, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Pagination } from '../../components/ui/Pagination';
import { usePagination } from '../../hooks/usePagination';
import {
  STORE_INVOICES_KEY,
  useGetStoreInvoices,
  useUpdateInvoiceStatus,
  useUpdateInvoice,
} from '../../hooks/useInvoice';
import { useSyncPendingTally } from '../../hooks/useTally';
import EditInvoiceModal from './EditInvoiceModal';
import ViewInvoiceModal from './ViewInvoiceModal';
import CreateInvoiceModal from './CreateInvoiceModal';
import ApprovePaymentModal from './ApprovePaymentModal';
import { ConfirmModal } from '../admin/ConfirmModal';
import { printInvoice } from '../../utils/printInvoice';
import { useStoreContext } from '../../context/storeContext';

const PAGE_SIZE = 10;

const THEME = {
  manager: {
    primaryBtn: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700',
    focusRing: 'focus:ring-amber-500',
    amount: 'text-amber-600',
    pendingCardBorder: 'border-yellow-200',
    pendingCardHeader: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    pendingBadgeText: 'text-yellow-700',
  },
  accounting: {
    primaryBtn: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700',
    focusRing: 'focus:ring-indigo-500',
    amount: 'text-indigo-600',
    pendingCardBorder: 'border-indigo-200',
    pendingCardHeader: 'bg-gradient-to-r from-indigo-600 to-purple-600',
    pendingBadgeText: 'text-indigo-700',
  },
};

const TAB_DATE_CONFIG = {
  pending: {
    dateField: 'createdAt',
    fromLabel: 'Created From',
    toLabel: 'Created To',
  },
  approved: {
    dateField: 'approvedAt',
    fromLabel: 'Approved From',
    toLabel: 'Approved To',
  },
  rejected: {
    dateField: 'approvedAt',
    fromLabel: 'Rejected From',
    toLabel: 'Rejected To',
  },
};

const TABS = [
  { id: 'pending', label: 'Pending', activeClass: 'bg-yellow-500 text-white', badgeClass: 'bg-yellow-100 text-yellow-800' },
  { id: 'approved', label: 'Approved', activeClass: 'bg-green-600 text-white', badgeClass: 'bg-green-100 text-green-800' },
  { id: 'rejected', label: 'Rejected', activeClass: 'bg-red-600 text-white', badgeClass: 'bg-red-100 text-red-800' },
];

const ACCOUNTING_TABS = [
  { id: 'pending', label: 'Pending', activeClass: 'bg-indigo-600 text-white', badgeClass: 'bg-indigo-100 text-indigo-800' },
  { id: 'approved', label: 'Approved', activeClass: 'bg-purple-600 text-white', badgeClass: 'bg-purple-100 text-purple-800' },
  { id: 'rejected', label: 'Rejected', activeClass: 'bg-red-600 text-white', badgeClass: 'bg-red-100 text-red-800' },
];

function toInputDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getDefaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29); // last 30 days inclusive
  return { fromDate: toInputDate(from), toDate: toInputDate(to) };
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function sortByRecentDecision(a, b) {
  const aTime = new Date(a.approvedAt || a.updatedAt || a.createdAt || 0).getTime();
  const bTime = new Date(b.approvedAt || b.updatedAt || b.createdAt || 0).getTime();
  return bTime - aTime;
}

function patchStoreInvoicesCache(queryClient, updatedInvoice) {
  if (!updatedInvoice) return;

  const invoiceId = String(updatedInvoice._id || updatedInvoice.id || '');
  if (!invoiceId) return;

  queryClient.setQueriesData({ queryKey: STORE_INVOICES_KEY }, (old) => {
    if (!old?.invoices) return old;

    const invoices = old.invoices.map((inv) => {
      const id = String(inv._id || inv.id || '');
      return id === invoiceId ? { ...inv, ...updatedInvoice } : inv;
    });

    const summary = invoices.reduce(
      (acc, inv) => {
        acc.total += 1;
        if (inv.status === 'pending') acc.pending += 1;
        else if (inv.status === 'approved') acc.approved += 1;
        else if (inv.status === 'rejected') acc.rejected += 1;
        return acc;
      },
      { total: 0, pending: 0, approved: 0, rejected: 0 }
    );

    return { ...old, invoices, summary };
  });
}

export default function ManagerInvoices() {
  const queryClient = useQueryClient();
  const { stores } = useStoreContext();
  const user = useSelector((state) => state.app.userInfo);
  const isAccounting = user?.userType === 'accounting';
  const theme = isAccounting ? THEME.accounting : THEME.manager;
  const tabs = isAccounting ? ACCOUNTING_TABS : TABS;
  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const [activeTab, setActiveTab] = useState('pending');
  const [dateRanges, setDateRanges] = useState({
    pending: { ...defaultRange },
    approved: { ...defaultRange },
    rejected: { ...defaultRange },
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [approvingInvoice, setApprovingInvoice] = useState(null);
  const [rejectingInvoice, setRejectingInvoice] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const activeDateRange = dateRanges[activeTab] || defaultRange;
  const activeDateConfig = TAB_DATE_CONFIG[activeTab] || TAB_DATE_CONFIG.pending;
  const fromDate = activeDateRange.fromDate;
  const toDate = activeDateRange.toDate;

  const setFromDate = (value) => {
    setDateRanges((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], fromDate: value },
    }));
  };

  const setToDate = (value) => {
    setDateRanges((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], toDate: value },
    }));
  };

  const { data, isLoading, isError, refetch } = useGetStoreInvoices({
    q: debouncedSearch,
    fromDate,
    toDate,
    dateField: activeDateConfig.dateField,
    limit: 500,
  });

  const updateStatusMutation = useUpdateInvoiceStatus();
  const updateInvoiceMutation = useUpdateInvoice();
  const syncPendingTally = useSyncPendingTally();

  const invoices = data?.invoices || [];
  const summary = data?.summary || { total: 0, pending: 0, approved: 0, rejected: 0 };

  const pendingInvoices = useMemo(
    () => invoices.filter((inv) => inv.status === 'pending'),
    [invoices]
  );
  const approvedInvoices = useMemo(
    () => invoices.filter((inv) => inv.status === 'approved').sort(sortByRecentDecision),
    [invoices]
  );
  const rejectedInvoices = useMemo(
    () => invoices.filter((inv) => inv.status === 'rejected').sort(sortByRecentDecision),
    [invoices]
  );

  const tabLists = {
    pending: pendingInvoices,
    approved: approvedInvoices,
    rejected: rejectedInvoices,
  };

  const activeInvoices = tabLists[activeTab] || pendingInvoices;
  const pagination = usePagination(activeInvoices, { pageSize: PAGE_SIZE });

  const tabCounts = {
    pending: pendingInvoices.length,
    approved: approvedInvoices.length,
    rejected: rejectedInvoices.length,
  };

  const refreshInvoiceLists = async (updatedInvoice) => {
    patchStoreInvoicesCache(queryClient, updatedInvoice);
    await queryClient.invalidateQueries({ queryKey: STORE_INVOICES_KEY });
    await refetch();
  };

  const handleApprove = (invoice) => {
    setApprovingInvoice(invoice);
  };

  const handleConfirmApprove = (paymentBreakdown) => {
    if (!approvingInvoice) return;
    updateStatusMutation.mutate(
      {
        id: approvingInvoice._id || approvingInvoice.id,
        status: 'approved',
        paymentBreakdown,
      },
      {
        onSuccess: async (res) => {
          const updated = res?.invoice || {
            ...approvingInvoice,
            status: 'approved',
            paymentBreakdown,
            approvedAt: new Date().toISOString(),
          };
          await refreshInvoiceLists(updated);
          toast.success(`Invoice ${approvingInvoice.invoiceNumber} approved`);
          setApprovingInvoice(null);
        },
      }
    );
  };

  const handleReject = (invoice) => {
    setRejectingInvoice(invoice);
  };

  const handleConfirmReject = () => {
    if (!rejectingInvoice || updateStatusMutation.isPending) return;
    updateStatusMutation.mutate(
      { id: rejectingInvoice._id || rejectingInvoice.id, status: 'rejected' },
      {
        onSuccess: async (res) => {
          const updated = res?.invoice || {
            ...rejectingInvoice,
            status: 'rejected',
            approvedAt: new Date().toISOString(),
          };
          await refreshInvoiceLists(updated);
          toast.error(`Invoice ${rejectingInvoice.invoiceNumber} rejected`);
          setRejectingInvoice(null);
        },
      }
    );
  };

  const resolveStore = (invoice) =>
    stores.find((s) => String(s.storeId) === String(invoice?.storeId)) || null;

  const handlePrint = (invoice) => {
    const ok = printInvoice(invoice, resolveStore(invoice));
    if (ok) {
      toast.success(`Print ready for ${invoice.invoiceNumber}`);
    } else {
      toast.error('Unable to print this invoice. Please try again.');
    }
  };

  const handleSendPdf = (invoice) => {
    const ok = printInvoice(invoice, resolveStore(invoice));
    if (ok) {
      toast.success(`Use Print → Save as PDF for ${invoice.invoiceNumber}`);
    } else {
      toast.error('Unable to export this invoice. Please try again.');
    }
  };

  const handleSaveEdit = (payload) => {
    updateInvoiceMutation.mutate(payload, {
      onSuccess: () => setEditingInvoice(null),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Sales Invoices</h2>
          <p className="text-gray-600 mt-1">Create, review, and approve customer invoices</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => syncPendingTally.mutate({})}
            disabled={syncPendingTally.isPending}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-gray-300 bg-white text-gray-800 rounded-lg font-medium shadow-sm hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw size={18} className={syncPendingTally.isPending ? 'animate-spin' : ''} />
            {syncPendingTally.isPending ? 'Syncing Tally…' : 'Sync Pending to Tally'}
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className={`inline-flex items-center justify-center gap-2 px-5 py-3 text-white rounded-lg font-medium shadow ${theme.primaryBtn}`}
          >
            <Plus size={18} />
            Create Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Invoices</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{summary.total}</p>
        </div>
        <div className={`rounded-lg shadow p-4 border ${isAccounting ? 'bg-indigo-50 border-indigo-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <p className={`text-sm ${isAccounting ? 'text-indigo-700' : 'text-yellow-700'}`}>Pending Review</p>
          <p className={`text-2xl font-bold mt-1 ${isAccounting ? 'text-indigo-700' : 'text-yellow-700'}`}>{summary.pending}</p>
        </div>
        <div className={`rounded-lg shadow p-4 border ${isAccounting ? 'bg-purple-50 border-purple-200' : 'bg-green-50 border-green-200'}`}>
          <p className={`text-sm ${isAccounting ? 'text-purple-600' : 'text-green-600'}`}>Approved</p>
          <p className={`text-2xl font-bold mt-1 ${isAccounting ? 'text-purple-600' : 'text-green-600'}`}>{summary.approved}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4 border border-red-200">
          <p className="text-red-600 text-sm">Rejected</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{summary.rejected}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 flex flex-col lg:flex-row gap-4 lg:items-end">
        <div className="relative flex-1 min-w-0">
          <label htmlFor="invoice-search" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <Search className="absolute left-4 bottom-3 text-gray-400" size={18} />
          <input
            id="invoice-search"
            type="text"
            placeholder="Invoice number, customer name, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none ${theme.focusRing}`}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:w-auto lg:min-w-[360px]">
          <div>
            <label htmlFor="invoice-from-date" className="block text-sm font-medium text-gray-700 mb-1">
              {activeDateConfig.fromLabel}
            </label>
            <input
              id="invoice-from-date"
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => setFromDate(e.target.value)}
              className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none ${theme.focusRing}`}
            />
          </div>
          <div>
            <label htmlFor="invoice-to-date" className="block text-sm font-medium text-gray-700 mb-1">
              {activeDateConfig.toLabel}
            </label>
            <input
              id="invoice-to-date"
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => setToDate(e.target.value)}
              className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none ${theme.focusRing}`}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-1.5 flex flex-wrap gap-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? `${tab.activeClass} shadow`
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isActive ? 'bg-white/25 text-inherit' : tab.badgeClass
                }`}
              >
                {tabCounts[tab.id]}
              </span>
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="text-center py-12 bg-white rounded-lg shadow text-gray-500 animate-pulse">
          Loading invoices...
        </div>
      )}

      {isError && (
        <div className="text-center py-12 bg-white rounded-lg shadow text-red-600">
          Failed to load invoices. Please try again.
        </div>
      )}

      {!isLoading && !isError && activeTab === 'pending' && (
        <div>
          {pendingInvoices.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No pending invoices.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {pagination.paginatedItems.map((invoice) => (
                  <div
                    key={invoice._id || invoice.id}
                    className={`bg-white rounded-xl shadow-lg border-2 overflow-hidden hover:shadow-xl transition-shadow ${theme.pendingCardBorder}`}
                  >
                    <div className={`text-white p-4 ${theme.pendingCardHeader}`}>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-lg">{invoice.invoiceNumber}</h4>
                        <span className={`bg-white px-3 py-1 rounded-full text-xs font-medium ${theme.pendingBadgeText}`}>
                          Pending
                        </span>
                      </div>
                      <p className="text-sm opacity-90 mt-1">{formatDate(invoice.createdAt)}</p>
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Customer</p>
                        <p className="font-medium text-gray-800">{invoice.customerName || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium text-gray-800">{invoice.customerPhone || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Items</p>
                        <p className="font-medium text-gray-800">{invoice.items?.length || 0} item(s)</p>
                      </div>
                      <div className="border-t pt-3">
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className={`text-2xl font-bold ${theme.amount}`}>{formatMoney(invoice.total)}</p>
                      </div>

                      {invoice.createdBy && (
                        <div className="text-xs text-gray-500">
                          Created by: {invoice.createdBy}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-3">
                        <button
                          onClick={() => setEditingInvoice(invoice)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                        >
                          <Edit2 size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleApprove(invoice)}
                          disabled={updateStatusMutation.isPending}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all disabled:opacity-60"
                        >
                          <CheckCircle size={16} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(invoice)}
                          disabled={updateStatusMutation.isPending}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-60"
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                pageSize={pagination.pageSize}
                onPageChange={pagination.goToPage}
              />
            </>
          )}
        </div>
      )}

      {!isLoading && !isError && activeTab === 'approved' && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`text-white ${isAccounting ? "bg-purple-600" : "bg-green-600"}`}>
                <tr>
                  <th className="px-4 py-3 text-left text-sm">Invoice #</th>
                  <th className="px-4 py-3 text-left text-sm">Customer</th>
                  <th className="px-4 py-3 text-left text-sm">Phone</th>
                  <th className="px-4 py-3 text-left text-sm">Approved</th>
                  <th className="px-4 py-3 text-right text-sm">Total</th>
                  <th className="px-4 py-3 text-center text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pagination.paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No approved invoices.
                    </td>
                  </tr>
                ) : (
                  pagination.paginatedItems.map((invoice) => (
                    <tr key={invoice._id || invoice.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{invoice.invoiceNumber}</td>
                      <td className="px-4 py-3 text-gray-800">{invoice.customerName || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{invoice.customerPhone || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(invoice.approvedAt || invoice.createdAt)}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-800">{formatMoney(invoice.total)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedInvoice(invoice)}
                            className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handlePrint(invoice)}
                            className="p-2 hover:bg-purple-50 rounded-lg text-purple-600"
                            title="Print"
                          >
                            <Printer size={16} />
                          </button>
                          <button
                            onClick={() => handleSendPdf(invoice)}
                            className="p-2 hover:bg-green-50 rounded-lg text-green-600"
                            title="Share"
                          >
                            <Send size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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
      )}

      {!isLoading && !isError && activeTab === 'rejected' && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-red-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm">Invoice #</th>
                  <th className="px-4 py-3 text-left text-sm">Customer</th>
                  <th className="px-4 py-3 text-left text-sm">Phone</th>
                  <th className="px-4 py-3 text-left text-sm">Rejected</th>
                  <th className="px-4 py-3 text-right text-sm">Total</th>
                  <th className="px-4 py-3 text-center text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pagination.paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No rejected invoices.
                    </td>
                  </tr>
                ) : (
                  pagination.paginatedItems.map((invoice) => (
                    <tr key={invoice._id || invoice.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{invoice.invoiceNumber}</td>
                      <td className="px-4 py-3 text-gray-800">{invoice.customerName || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{invoice.customerPhone || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(invoice.approvedAt || invoice.createdAt)}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-800">{formatMoney(invoice.total)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedInvoice(invoice)}
                            className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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
      )}

      {approvingInvoice && (
        <ApprovePaymentModal
          invoice={approvingInvoice}
          onClose={() => setApprovingInvoice(null)}
          onConfirm={handleConfirmApprove}
          isSubmitting={updateStatusMutation.isPending}
        />
      )}

      {rejectingInvoice && (
        <ConfirmModal
          title="Reject Invoice"
          message={`Are you sure you want to reject invoice ${rejectingInvoice.invoiceNumber}? This action cannot be undone.`}
          confirmLabel={updateStatusMutation.isPending ? 'Rejecting...' : 'Reject'}
          confirmClassName="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-60"
          onConfirm={handleConfirmReject}
          onClose={() => {
            if (!updateStatusMutation.isPending) setRejectingInvoice(null);
          }}
        />
      )}

      {selectedInvoice && (
        <ViewInvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onPrint={handlePrint}
          onSendPdf={handleSendPdf}
        />
      )}

      {editingInvoice && (
        <EditInvoiceModal
          invoice={editingInvoice}
          onClose={() => setEditingInvoice(null)}
          onSave={handleSaveEdit}
          isSaving={updateInvoiceMutation.isPending}
        />
      )}

      {showCreateModal && (
        <CreateInvoiceModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
