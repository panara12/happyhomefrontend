import { Printer, Send } from 'lucide-react';
import logoImg from '../../assets/logo.jpg';
import Modal, { modalSecondaryBtnClass } from '../../components/ui/Modal';

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toISOString().slice(0, 10);
}

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function getItemName(item) {
  return item?.productName || item?.productCode || item?.item?.name || 'Item';
}

function statusBadgeClass(status) {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-700';
    case 'rejected':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-amber-100 text-amber-700';
  }
}

export default function ViewInvoiceModal({ invoice, onClose, onPrint, onSendPdf }) {
  if (!invoice) return null;

  const payment = invoice.paymentBreakdown || {};
  const hasPaymentBreakdown =
    Number(payment.cash || 0) > 0 ||
    Number(payment.gpay || 0) > 0 ||
    Number(payment.debit || 0) > 0;

  const itemsSubtotal = (invoice.items || []).reduce(
    (sum, item) => sum + Number(item.total || 0),
    0
  );
  const subtotal = Number(invoice.subtotal ?? itemsSubtotal);
  const tax = Number(invoice.tax ?? Number((subtotal * 0.18).toFixed(2)));

  return (
    <Modal
      title={
        <div className="text-center">
          <img src={logoImg} alt="Happy Home" className="w-14 h-14 object-contain mx-auto mb-1" />
          <h3 className="text-xl font-bold text-gray-800">Happy Home</h3>
          <p className="text-sm text-gray-600">Invoice {invoice.invoiceNumber}</p>
        </div>
      }
      size="md"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={() => onPrint?.(invoice)}
            className="w-full sm:w-48 px-4 py-2.5 flex items-center justify-center gap-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium shrink-0"
          >
            <Printer size={18} />
            Print
          </button>
          <button
            type="button"
            onClick={() => onSendPdf?.(invoice)}
            className="w-full sm:w-48 px-4 py-2.5 flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shrink-0"
          >
            <Send size={18} />
            Send PDF
          </button>
          <button type="button" onClick={onClose} className={modalSecondaryBtnClass}>
            Close
          </button>
        </>
      }
    >
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <p className="text-sm text-gray-500">Customer:</p>
            <p className="font-semibold text-gray-800">{invoice.customerName || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone:</p>
            <p className="font-semibold text-gray-800">{invoice.customerPhone || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Date:</p>
            <p className="font-semibold text-gray-800">{formatDate(invoice.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Store:</p>
            <p className="font-semibold text-gray-800">{invoice.storeId || '—'}</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold text-gray-800 mb-2">Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-3 py-2 font-medium text-gray-600">Product</th>
                <th className="px-3 py-2 font-medium text-gray-600 text-center">Qty</th>
                <th className="px-3 py-2 font-medium text-gray-600 text-right">Price</th>
                <th className="px-3 py-2 font-medium text-gray-600 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="px-3 py-2 text-gray-800">{getItemName(item)}</td>
                  <td className="px-3 py-2 text-center text-gray-700">{item.quantity}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{formatMoney(item.price)}</td>
                  <td className="px-3 py-2 text-right text-gray-800 font-medium">{formatMoney(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium text-gray-800">{formatMoney(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">GST (18%):</span>
          <span className="font-medium text-gray-800">{formatMoney(tax)}</span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <span className="text-gray-700 font-medium">Total Amount:</span>
          <span className="text-2xl font-bold text-amber-600">{formatMoney(invoice.total)}</span>
        </div>

        {(invoice.status === 'approved' || hasPaymentBreakdown) && (
          <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-1.5">
            <p className="text-sm font-semibold text-gray-800 mb-1">Payment Mode</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Cash</span>
              <span className="font-medium text-gray-800">{formatMoney(payment.cash)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">GPay</span>
              <span className="font-medium text-gray-800">{formatMoney(payment.gpay)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Debit</span>
              <span className="font-medium text-gray-800">{formatMoney(payment.debit)}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${statusBadgeClass(invoice.status)}`}>
            {invoice.status}
          </span>
        </div>
      </div>
    </Modal>
  );
}
