import { useEffect, useMemo, useState } from 'react';
import {
  Search, Eye, CheckCircle, XCircle, Printer, Send, Edit2, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from '../../components/ui/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { useGetStoreInvoices, useUpdateInvoiceStatus, useUpdateInvoice } from '../../hooks/useInvoice';
import EditInvoiceModal from './EditInvoiceModal';
import ViewInvoiceModal from './ViewInvoiceModal';
import CreateInvoiceModal from './CreateInvoiceModal';

const PAGE_SIZE = 10;

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export default function ManagerInvoices() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, isError } = useGetStoreInvoices({
    q: debouncedSearch,
    limit: 100,
  });

  const updateStatusMutation = useUpdateInvoiceStatus();
  const updateInvoiceMutation = useUpdateInvoice();

  const invoices = data?.invoices || [];
  const summary = data?.summary || { total: 0, pending: 0, approved: 0, rejected: 0 };

  const pendingInvoices = useMemo(
    () => invoices.filter((inv) => inv.status === 'pending'),
    [invoices]
  );
  const approvedInvoices = useMemo(
    () => invoices.filter((inv) => inv.status === 'approved'),
    [invoices]
  );
  const rejectedInvoices = useMemo(
    () => invoices.filter((inv) => inv.status === 'rejected'),
    [invoices]
  );

  const pendingPagination = usePagination(pendingInvoices, { pageSize: PAGE_SIZE });
  const approvedPagination = usePagination(approvedInvoices, { pageSize: PAGE_SIZE });
  const rejectedPagination = usePagination(rejectedInvoices, { pageSize: PAGE_SIZE });

  const handleApprove = (invoice) => {
    updateStatusMutation.mutate(
      { id: invoice._id || invoice.id, status: 'approved' },
      {
        onSuccess: () => toast.success(`Invoice ${invoice.invoiceNumber} approved`),
      }
    );
  };

  const handleReject = (invoice) => {
    if (!confirm(`Reject invoice ${invoice.invoiceNumber}?`)) return;
    updateStatusMutation.mutate(
      { id: invoice._id || invoice.id, status: 'rejected' },
      {
        onSuccess: () => toast.error(`Invoice ${invoice.invoiceNumber} rejected`),
      }
    );
  };

  const handlePrint = (invoice) => {
    toast.success(`Print started for ${invoice.invoiceNumber}`);
    window.print();
  };

  const handleSendPdf = (invoice) => {
    toast.success(`PDF ready to send for ${invoice.invoiceNumber}`);
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
          <h2 className="text-3xl font-bold text-gray-800">Invoice Approval</h2>
          <p className="text-gray-600 mt-1">Review and approve invoices from your team</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 font-medium shadow"
        >
          <Plus size={18} />
          Create Invoice
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Invoices</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{summary.total}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4 border border-yellow-200">
          <p className="text-yellow-700 text-sm">Pending Review</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">{summary.pending}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
          <p className="text-green-600 text-sm">Approved</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{summary.approved}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4 border border-red-200">
          <p className="text-red-600 text-sm">Rejected</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{summary.rejected}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by invoice number, customer name, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
        />
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

      {!isLoading && !isError && (
        <>
          {/* Pending */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                {pendingInvoices.length}
              </span>
              Pending Approval
            </h3>

            {pendingInvoices.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                No pending invoices.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {pendingPagination.paginatedItems.map((invoice) => (
                    <div
                      key={invoice._id || invoice.id}
                      className="bg-white rounded-xl shadow-lg border-2 border-yellow-200 overflow-hidden hover:shadow-xl transition-shadow"
                    >
                      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-lg">{invoice.invoiceNumber}</h4>
                          <span className="bg-white text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
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
                          <p className="text-2xl font-bold text-amber-600">{formatMoney(invoice.total)}</p>
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
                  page={pendingPagination.page}
                  totalPages={pendingPagination.totalPages}
                  totalItems={pendingPagination.totalItems}
                  pageSize={pendingPagination.pageSize}
                  onPageChange={pendingPagination.goToPage}
                />
              </>
            )}
          </div>

          {/* Approved */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                {approvedInvoices.length}
              </span>
              Approved Invoices
            </h3>
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-green-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm">Invoice #</th>
                      <th className="px-4 py-3 text-left text-sm">Customer</th>
                      <th className="px-4 py-3 text-left text-sm">Phone</th>
                      <th className="px-4 py-3 text-left text-sm">Date</th>
                      <th className="px-4 py-3 text-right text-sm">Total</th>
                      <th className="px-4 py-3 text-center text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {approvedPagination.paginatedItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No approved invoices.
                        </td>
                      </tr>
                    ) : (
                      approvedPagination.paginatedItems.map((invoice) => (
                        <tr key={invoice._id || invoice.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{invoice.invoiceNumber}</td>
                          <td className="px-4 py-3 text-gray-800">{invoice.customerName || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{invoice.customerPhone || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{formatDate(invoice.createdAt)}</td>
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
                page={approvedPagination.page}
                totalPages={approvedPagination.totalPages}
                totalItems={approvedPagination.totalItems}
                pageSize={approvedPagination.pageSize}
                onPageChange={approvedPagination.goToPage}
              />
            </div>
          </div>

          {/* Rejected */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                {rejectedInvoices.length}
              </span>
              Rejected Invoices
            </h3>
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-red-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm">Invoice #</th>
                      <th className="px-4 py-3 text-left text-sm">Customer</th>
                      <th className="px-4 py-3 text-left text-sm">Phone</th>
                      <th className="px-4 py-3 text-left text-sm">Date</th>
                      <th className="px-4 py-3 text-right text-sm">Total</th>
                      <th className="px-4 py-3 text-center text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {rejectedPagination.paginatedItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No rejected invoices.
                        </td>
                      </tr>
                    ) : (
                      rejectedPagination.paginatedItems.map((invoice) => (
                        <tr key={invoice._id || invoice.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{invoice.invoiceNumber}</td>
                          <td className="px-4 py-3 text-gray-800">{invoice.customerName || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{invoice.customerPhone || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{formatDate(invoice.createdAt)}</td>
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
                page={rejectedPagination.page}
                totalPages={rejectedPagination.totalPages}
                totalItems={rejectedPagination.totalItems}
                pageSize={rejectedPagination.pageSize}
                onPageChange={rejectedPagination.goToPage}
              />
            </div>
          </div>
        </>
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
