import { useMemo, useState } from 'react';
import Modal, {
  modalInputClass,
  modalLabelClass,
  modalPrimaryBtnClass,
  modalSecondaryBtnClass,
} from '../../components/ui/Modal';

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

const PAYMENT_FIELDS = [
  { key: 'cash', label: 'Cash' },
  { key: 'gpay', label: 'GPay' },
  { key: 'debit', label: 'Debit' },
];

export default function ApprovePaymentModal({
  invoice,
  onClose,
  onConfirm,
  isSubmitting = false,
}) {
  const [payments, setPayments] = useState({ cash: '', gpay: '', debit: '' });

  const invoiceTotal = roundMoney(invoice?.total);
  const paidTotal = useMemo(
    () =>
      roundMoney(
        (Number(payments.cash) || 0) +
          (Number(payments.gpay) || 0) +
          (Number(payments.debit) || 0)
      ),
    [payments]
  );
  const difference = roundMoney(invoiceTotal - paidTotal);
  const isMatched = paidTotal === invoiceTotal;

  const handleChange = (key, value) => {
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setPayments((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleConfirm = () => {
    if (!isMatched || isSubmitting) return;
    onConfirm?.({
      cash: Number(payments.cash) || 0,
      gpay: Number(payments.gpay) || 0,
      debit: Number(payments.debit) || 0,
    });
  };

  if (!invoice) return null;

  return (
    <Modal
      title={`Approve Invoice — ${invoice.invoiceNumber}`}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={modalSecondaryBtnClass}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isMatched || isSubmitting}
            className={modalPrimaryBtnClass}
          >
            {isSubmitting ? 'Approving...' : 'Approve Invoice'}
          </button>
        </>
      }
    >
      <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
        <p className="text-sm text-amber-800">Invoice Total</p>
        <p className="text-2xl font-bold text-amber-700">{formatMoney(invoiceTotal)}</p>
        <p className="text-xs text-amber-700 mt-1">
          Split the total across Cash, GPay, and Debit. Sum must match exactly.
        </p>
      </div>

      <div className="space-y-3">
        {PAYMENT_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <label className={modalLabelClass} htmlFor={`payment-${key}`}>
              {label}
            </label>
            <input
              id={`payment-${key}`}
              type="text"
              inputMode="decimal"
              value={payments[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              className={modalInputClass}
              placeholder="0"
              disabled={isSubmitting}
            />
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200 space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Entered Total</span>
          <span className="font-semibold text-gray-800">{formatMoney(paidTotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Difference</span>
          <span
            className={`font-semibold ${
              isMatched ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {isMatched ? 'Matched' : formatMoney(difference)}
          </span>
        </div>
      </div>
    </Modal>
  );
}
