import { useState } from 'react';
import { Clock, CheckCircle, XCircle, Eye } from 'lucide-react';

export function PendingInvoices({ invoices, onApprove, onReject, showActions = false }) {
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
            <XCircle className="w-4 h-4" />
            Rejected
          </span>
        );
    }
  };

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No invoices found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-lg">Invoice #{invoice.invoiceNumber}</div>
                    <div className="text-sm text-gray-600">Customer: {invoice.customerName}</div>
                    <div className="text-sm text-gray-500">ID: {invoice.customerId}</div>
                  </div>
                  {getStatusBadge(invoice.status)}
                </div>

                <div className="mt-3 text-sm text-gray-600">
                  <div>Items: {invoice.items.length}</div>
                  <div>Total: <span className="font-medium text-amber-600">₹{invoice.total.toFixed(2)}</span></div>
                  <div>Created: {new Date(invoice.createdAt).toLocaleString()}</div>
                  <div>Salesperson: {invoice.createdBy}</div>
                </div>
              </div>

              <div className="flex sm:flex-col gap-2">
                <button
                  onClick={() => setSelectedInvoice(invoice)}
                  className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>

                {showActions && invoice.status === 'pending' && onApprove && onReject && (
                  <>
                    <button
                      onClick={() => onApprove(invoice.id)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => onReject(invoice.id)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Invoice #{selectedInvoice.invoiceNumber}</h2>
                  <div className="text-gray-600 mt-1">{new Date(selectedInvoice.createdAt).toLocaleString()}</div>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">Customer</div>
                    <div className="font-medium">{selectedInvoice.customerName}</div>
                    <div className="text-sm text-gray-500">ID: {selectedInvoice.customerId}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Salesperson</div>
                    <div className="font-medium">{selectedInvoice.createdBy}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Items</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Item</th>
                        <th className="text-center py-2">Qty</th>
                        <th className="text-right py-2">Price</th>
                        <th className="text-right py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-2">{item.item.name}</td>
                          <td className="text-center py-2">{item.quantity}</td>
                          <td className="text-right py-2">₹{item.price.toFixed(2)}</td>
                          <td className="text-right py-2">₹{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18%):</span>
                    <span>₹{selectedInvoice.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-amber-600">₹{selectedInvoice.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-4">
                  {getStatusBadge(selectedInvoice.status)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}