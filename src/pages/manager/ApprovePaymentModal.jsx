import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
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
  { key: 'upi', label: 'UPI' },
  { key: 'debit', label: 'Debit' },
];

export default function ApprovePaymentModal({
  invoice,
  onClose,
  onConfirm,
  isSubmitting = false,
}) {
  const user = useSelector((state) => state.app.userInfo);
  const isAccounting = user?.userType === 'accounting';
  const [payments, setPayments] = useState({ cash: '', upi: '', debit: '' });
  const [pointsToRedeem, setPointsToRedeem] = useState('0');
  const [cashDiscount, setCashDiscount] = useState('0');
  const [gstType, setGstType] = useState(invoice?.gstType || 'PRODUCT');

  const availablePoints = Math.max(0, Number(invoice?.customerPoints) || 0);
  const redeemedPoints = Math.min(Math.max(0, parseInt(pointsToRedeem, 10) || 0), availablePoints, Number(invoice?.total) || 0);
  const cashDiscountAmount = Math.min(Math.max(0, Number(cashDiscount) || 0), Math.max(0, (Number(invoice?.total) || 0) - redeemedPoints));
  const invoiceTotal = roundMoney((Number(invoice?.total) || 0) - redeemedPoints - cashDiscountAmount);
  const paidTotal = useMemo(
    () =>
      roundMoney(
        (Number(payments.cash) || 0) +
          (Number(payments.upi) || 0) +
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
      upi: Number(payments.upi) || 0,
      debit: Number(payments.debit) || 0,
      loyaltyPointsRedeemed: redeemedPoints,
      cashDiscountAmount,
      gstType,
    });
  };

  if (!invoice) return null;

  const primaryBtnClass = isAccounting
    ? `${modalPrimaryBtnClass} !bg-gradient-to-r !from-indigo-600 !to-purple-600 hover:!from-indigo-700 hover:!to-purple-700`
    : modalPrimaryBtnClass;

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
            className={primaryBtnClass}
          >
            {isSubmitting ? 'Approving...' : 'Approve Invoice'}
          </button>
        </>
      }
    >
      <div
        className={`mb-4 rounded-lg px-4 py-3 border ${
          isAccounting
            ? 'bg-indigo-50 border-indigo-200'
            : 'bg-amber-50 border-amber-200'
        }`}
      >
        <p className={`text-sm ${isAccounting ? 'text-indigo-800' : 'text-amber-800'}`}>Payable After Discounts</p>
        <p className={`text-2xl font-bold ${isAccounting ? 'text-indigo-700' : 'text-amber-700'}`}>
          {formatMoney(invoiceTotal)}
        </p>
        <p className={`text-xs mt-1 ${isAccounting ? 'text-indigo-700' : 'text-amber-700'}`}>
          Points and cash discount reduce the amount due. Split the balance across Cash, UPI, and Debit.
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
        <div>
          <label className={modalLabelClass} htmlFor="loyalty-points-redeemed">
            Loyalty Points (1 point = ₹1)
          </label>
          <div className="flex items-center gap-3">
            <input
              id="loyalty-points-redeemed"
              type="number"
              min="0"
              max={Math.min(availablePoints, Number(invoice?.total) || 0)}
              step="1"
              value={pointsToRedeem}
              onChange={(event) => setPointsToRedeem(event.target.value)}
              className={modalInputClass}
              disabled={isSubmitting}
            />
            <span className="shrink-0 text-sm text-gray-600">Available: {availablePoints}</span>
          </div>
        </div>
        <div>
          <label className={modalLabelClass} htmlFor="cash-discount">Cash Discount</label>
          <input
            id="cash-discount"
            type="text"
            inputMode="decimal"
            value={cashDiscount}
            onChange={(event) => {
              if (event.target.value === '' || /^\d*\.?\d{0,2}$/.test(event.target.value)) setCashDiscount(event.target.value);
            }}
            className={modalInputClass}
            placeholder="0"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className={modalLabelClass} htmlFor="invoice-gst-type">GST Type</label>
          <select
            id="invoice-gst-type"
            value={gstType}
            onChange={(event) => setGstType(event.target.value)}
            className={modalInputClass}
            disabled={isSubmitting}
          >
            <option value="PRODUCT">Use each product&apos;s GST type</option>
            <option value="IGST">IGST</option>
            <option value="CGST/SGST">CGST + SGST</option>
          </select>
        </div>
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
