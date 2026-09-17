import { useState } from 'react';
import {
  Wrench, Plus, Phone, User, Package, Building2, ShieldCheck, ShieldOff,
  IndianRupee, Calendar, FileText, CheckCircle2, Clock, AlertTriangle,
  Search, X, MessageCircle, ChevronDown, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { useGetAllService, useAddService, useUpdateService } from '../../hooks/useService';
import Modal, {
  modalInputClass,
  modalLabelClass,
  modalPrimaryBtnClass,
  modalSecondaryBtnClass,
} from '../../components/ui/Modal';

const LOGO = '/src/imports/475883765_1412800516794054_7992306912571437520_n-1.jpg';

const today = new Date().toISOString().split('T')[0];

const emptyForm = {
  customerName: '',
  mobileNumber: '',
  productName: '',
  productBrand: '',
  warranty: 'in-warranty',
  followUpDate: '',
  notes: '',
  problem: '',
};

function sendWhatsApp(phone, message) {
  const url = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

const STATUS_CONFIG = {
  pending: { label: 'Pending', bg: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  'in-progress': { label: 'In Progress', bg: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500' },
  completed: { label: 'Completed', bg: 'bg-green-100 text-green-800 border-green-200', dot: 'bg-green-500' },
  cancelled: { label: 'Cancelled', bg: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-500' },
};

// ─── Backend <-> UI mapping ─────────────────────────────────────────────────
// The Service schema's `status` enum uses these exact (typo'd) strings.
// Do not "fix" the typos here — they must match the backend enum exactly.
const STATUS_TO_BACKEND = {
  pending: 'Pending',
  'in-progress': 'in progess',
  completed: 'completed',
  cancelled: 'Cancled',
};
const STATUS_FROM_BACKEND = {
  Pending: 'pending',
  'in progess': 'in-progress',
  completed: 'completed',
  Cancled: 'cancelled',
};

function getLatestStatus(statusHistory) {
  if (!Array.isArray(statusHistory) || statusHistory.length === 0) return 'pending';
  const last = statusHistory[statusHistory.length - 1];
  return STATUS_FROM_BACKEND[last.status] || 'pending';
}

function getCompletedAt(statusHistory) {
  if (!Array.isArray(statusHistory)) return null;
  const entry = [...statusHistory].reverse().find(s => s.status === 'completed');
  return entry?.statusDate || null;
}

// STOPGAP: followUpDate isn't in the Service schema, so it's smuggled into
// `notes` as a parsed prefix. Remove this once the schema has a real field.
const FOLLOWUP_TAG = /^\[FollowUp:(\d{4}-\d{2}-\d{2})\]\s*/;

function extractFollowUpDate(notes) {
  const match = (notes || '').match(FOLLOWUP_TAG);
  return match ? match[1] : '';
}

function stripFollowUpTag(notes) {
  return (notes || '').replace(FOLLOWUP_TAG, '');
}

function buildNotesWithFollowUp(followUpDate, notes) {
  const tag = followUpDate ? `[FollowUp:${followUpDate}]` : '';
  return [tag, notes].filter(Boolean).join(' ').trim();
}

// Converts a raw Service document from the API into the flat shape the UI
// components below already expect (so their JSX doesn't need to change).
function normalizeService(raw) {
  return {
    _id: raw._id,
    id: raw.serviceId,
    customerName: raw.customerName,
    mobileNumber: raw.mobileNumber != null ? String(raw.mobileNumber) : '',
    productName: raw.productName,
    productBrand: raw.productBrand,
    warranty: raw.warranty,
    repairCharge: raw.repairCharge ?? 0,
    problem: raw.problem || raw.Problem || '',
    notes: stripFollowUpTag(raw.notes),
    followUpDate: extractFollowUpDate(raw.notes),
    status: getLatestStatus(raw.status),
    registeredAt: raw.createdAt,
    completedAt: getCompletedAt(raw.status),
  };
}

// ─── Complaint Card ───────────────────────────────────────────────────────────
function ComplaintCard({ complaint, onView, onComplete, onFollowUp }) {
  const isOverdue = complaint.followUpDate && complaint.followUpDate < today && complaint.status !== 'completed';
  const isToday = complaint.followUpDate === today && complaint.status !== 'completed';
  const cfg = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.pending;

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-l-4 p-4 transition-shadow hover:shadow-md ${
        isOverdue ? 'border-red-400' : isToday ? 'border-purple-500' : complaint.status === 'completed' ? 'border-green-400' : 'border-orange-400'
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-semibold">{complaint.id}</span>
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
            complaint.warranty === 'in-warranty' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
            {complaint.warranty === 'in-warranty' ? <ShieldCheck size={10} /> : <ShieldOff size={10} />}
            {complaint.warranty === 'in-warranty' ? 'In Warranty' : 'Out of Warranty'}
          </span>
        </div>
        <button
          onClick={onView}
          className="shrink-0 p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
          title="View Details"
        >
          <Eye size={16} />
        </button>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <User size={14} className="text-orange-500 shrink-0" />
          <span className="text-sm font-semibold text-gray-800 truncate">{complaint.customerName}</span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <Phone size={14} className="text-orange-500 shrink-0" />
          <span className="text-sm text-gray-600">{complaint.mobileNumber}</span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <Package size={14} className="text-orange-500 shrink-0" />
          <span className="text-sm text-gray-700 truncate font-medium">{complaint.productName}</span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <Building2 size={14} className="text-orange-500 shrink-0" />
          <span className="text-sm text-gray-600">{complaint.productBrand}</span>
        </div>
      </div>

      {/* Issues preview */}
      {complaint.problem && (
        <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg mb-3 line-clamp-2">
          <span className="font-semibold">Issue: </span>{complaint.problem}
        </p>
      )}

      {/* Follow-up + charges row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-xs">
        {complaint.followUpDate ? (
          <span className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-red-600' : isToday ? 'text-purple-600' : 'text-gray-600'}`}>
            <Calendar size={11} />
            Follow-up: <strong>{complaint.followUpDate}</strong>
            {isOverdue && <span className="ml-1 text-red-500 font-bold">(Overdue)</span>}
            {isToday && <span className="ml-1 text-purple-500 font-bold">(Today)</span>}
          </span>
        ) : (
          <span className="text-gray-400 italic">No follow-up date set</span>
        )}
        {complaint.repairCharge && Number(complaint.repairCharge) > 0 && (
          <span className="flex items-center gap-1 text-gray-600">
            <IndianRupee size={11} />₹{complaint.repairCharge}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={onFollowUp}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-all border border-green-200"
        >
          <MessageCircle size={13} /> WhatsApp
        </button>
        {complaint.status !== 'completed' && (
          <button
            onClick={onComplete}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-lg transition-all shadow-sm"
          >
            <CheckCircle2 size={13} /> Mark Complete
          </button>
        )}
        {complaint.status === 'completed' && complaint.completedAt && (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium px-2">
            <CheckCircle2 size={12} /> Completed {new Date(complaint.completedAt).toLocaleDateString('en-IN')}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Registration Form ────────────────────────────────────────────────────────
function ComplaintForm({ onClose, onSubmit, isSubmitting }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const set = (key, value) =>
    setForm(f => ({ ...f, [key]: value }));

  const validate = () => {
    const e = {};
    if (!form.customerName.trim()) e.customerName = 'Required';
    if (!form.mobileNumber.trim() || !/^\d{10}$/.test(form.mobileNumber)) e.mobileNumber = 'Enter valid 10-digit number';
    if (!form.productName.trim()) e.productName = 'Required';
    if (!form.productBrand.trim()) e.productBrand = 'Required';
    if (!form.followUpDate) e.followUpDate = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-5 py-4 rounded-t-2xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="Happy Home" className="w-9 h-9 rounded-full bg-white p-0.5 object-contain" />
            <div>
              <h2 className="text-base font-bold leading-tight">Register New Complaint</h2>
              <p className="text-xs text-amber-100">Customer will receive a WhatsApp notification</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-amber-700 rounded-lg transition-all ml-2 shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4">
          {/* Customer Info */}
          <div>
            <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <User size={13} /> Customer Information
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={e => set('customerName', e.target.value)}
                  placeholder="Full name"
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${errors.customerName ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                />
                {errors.customerName && <p className="text-xs text-red-500 mt-1">{errors.customerName}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  value={form.mobileNumber}
                  onChange={e => set('mobileNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit number"
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${errors.mobileNumber ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                />
                {errors.mobileNumber && <p className="text-xs text-red-500 mt-1">{errors.mobileNumber}</p>}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div>
            <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Package size={13} /> Product Information
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={form.productName}
                  onChange={e => set('productName', e.target.value)}
                  placeholder="e.g. Washing Machine WM-500"
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${errors.productName ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                />
                {errors.productName && <p className="text-xs text-red-500 mt-1">{errors.productName}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Brand *</label>
                <input
                  type="text"
                  value={form.productBrand}
                  onChange={e => set('productBrand', e.target.value)}
                  placeholder="e.g. Samsung, LG, Voltas"
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${errors.productBrand ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                />
                {errors.productBrand && <p className="text-xs text-red-500 mt-1">{errors.productBrand}</p>}
              </div>
            </div>
          </div>

          {/* Warranty */}
          <div>
            <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldCheck size={13} /> Warranty Status
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => set('warranty', 'in-warranty')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                  form.warranty === 'in-warranty'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 text-gray-500 hover:border-emerald-300'
                }`}
              >
                <ShieldCheck size={17} /> In Warranty
              </button>
              <button
                type="button"
                onClick={() => set('warranty', 'out-warranty')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                  form.warranty === 'out-warranty'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-500 hover:border-red-300'
                }`}
              >
                <ShieldOff size={17} /> Out of Warranty
              </button>
            </div>
          </div>

          {/* Follow-up & Issues */}
          <div>
            <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Calendar size={13} /> Service Details
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Follow-up Date *</label>
                <input
                  type="date"
                  value={form.followUpDate}
                  min={today}
                  onChange={e => set('followUpDate', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${errors.followUpDate ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                />
                {errors.followUpDate && <p className="text-xs text-red-500 mt-1">{errors.followUpDate}</p>}
                <p className="text-[11px] text-gray-400 mt-1">Stored inside notes for now — the schema doesn't have a dedicated field yet.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Issues / Problem Description</label>
                <textarea
                  value={form.problem}
                  onChange={e => set('problem', e.target.value)}
                  placeholder="Describe the problem the customer is facing..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Internal Notes (Service Team)</label>
                <textarea
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  placeholder="Notes for the service team (not sent to customer)..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
              </div>
            </div>
          </div>

          {/* WhatsApp notice */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-3">
            <MessageCircle size={18} className="text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">Auto WhatsApp Notification</p>
              <p className="text-xs text-green-600 mt-0.5">
                A confirmation message with complaint ID, product details, and warranty status will be sent to the customer.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-all text-sm disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-semibold shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60"
          >
            <Plus size={16} /> {isSubmitting ? 'Registering…' : 'Register & Notify'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Mark Complete Modal (manager/admin) ──────────────────────────────────────
function CompleteConfirmModal({ complaint, onClose, onConfirm, isCompleting }) {
  const [repairCharge, setRepairCharge] = useState(
    complaint?.repairCharge && Number(complaint.repairCharge) > 0
      ? String(complaint.repairCharge)
      : ''
  );

  const handleConfirm = () => {
    if (isCompleting) return;
    onConfirm?.(complaint, repairCharge === '' ? undefined : Number(repairCharge) || 0);
  };

  if (!complaint) return null;

  return (
    <Modal
      title={`Mark Complete — ${complaint.id}`}
      size="sm"
      onClose={onClose}
      closeOnBackdrop={!isCompleting}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isCompleting}
            className={modalSecondaryBtnClass}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isCompleting}
            className={`${modalPrimaryBtnClass} bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700`}
          >
            {isCompleting ? 'Completing…' : 'Confirm Complete'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          Mark service request for <span className="font-semibold">{complaint.customerName}</span>
          {' '}({complaint.productBrand} — {complaint.productName}) as completed?
        </p>

        <div>
          <label className={modalLabelClass}>
            Repair Charge (₹) <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <div className="relative">
            <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="number"
              min="0"
              step="0.01"
              value={repairCharge}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                  setRepairCharge(value);
                }
              }}
              placeholder="Enter amount if any"
              className={`${modalInputClass} pl-9`}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── View Detail Modal ────────────────────────────────────────────────────────
function ComplaintDetail({ complaint, onClose, onComplete, isCompleting }) {
  const cfg = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.pending;
  const isOverdue = complaint.followUpDate && complaint.followUpDate < today && complaint.status !== 'completed';
  const isToday = complaint.followUpDate === today && complaint.status !== 'completed';

  const followUpMsg = `Dear ${complaint.customerName}, this is a follow-up regarding your service complaint *${complaint.id}* for *${complaint.productName}* (${complaint.productBrand}). Our team is actively working on it. We will update you shortly. Thank you for your patience! 🙏 - Happy Home`;

  return (
    <Modal
      title={
        <div>
          <h3 className="text-xl font-bold text-gray-800">Service Details</h3>
          <p className="text-sm text-gray-500 font-mono mt-0.5">{complaint.id}</p>
        </div>
      }
      size="md"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className={modalSecondaryBtnClass}
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => sendWhatsApp(complaint.mobileNumber, followUpMsg)}
            className={`${modalPrimaryBtnClass} bg-green-600 hover:bg-green-700 from-green-600 to-green-700`}
          >
            WhatsApp
          </button>
          {complaint.status !== 'completed' && (
            <button
              type="button"
              onClick={onComplete}
              disabled={isCompleting}
              className={`${modalPrimaryBtnClass} bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700`}
            >
              {isCompleting ? 'Updating…' : 'Mark Complete'}
            </button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${cfg.bg}`}>
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
            complaint.warranty === 'in-warranty' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
            {complaint.warranty === 'in-warranty' ? <ShieldCheck size={12} /> : <ShieldOff size={12} />}
            {complaint.warranty === 'in-warranty' ? 'In Warranty' : 'Out of Warranty'}
          </span>
          {isOverdue && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-red-100 text-red-700">
              <AlertTriangle size={12} /> Overdue
            </span>
          )}
          {isToday && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-purple-100 text-purple-700">
              <Calendar size={12} /> Follow-up Today
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Customer Name', value: complaint.customerName, icon: User },
            { label: 'Mobile Number', value: complaint.mobileNumber, icon: Phone },
            { label: 'Product Name', value: complaint.productName, icon: Package },
            { label: 'Brand', value: complaint.productBrand, icon: Building2 },
            { label: 'Follow-up Date', value: complaint.followUpDate || '—', icon: Calendar },
            {
              label: 'Repair Charges',
              value: complaint.repairCharge && Number(complaint.repairCharge) > 0
                ? `₹${complaint.repairCharge}`
                : '—',
              icon: IndianRupee,
            },
            {
              label: 'Registered On',
              value: new Date(complaint.registeredAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
              icon: FileText,
            },
            ...(complaint.completedAt
              ? [{
                  label: 'Completed On',
                  value: new Date(complaint.completedAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  }),
                  icon: CheckCircle2,
                }]
              : []),
          ].map((row) => (
            <div key={row.label} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                <row.icon size={12} /> {row.label}
              </div>
              <div className="font-semibold text-gray-800 text-sm break-words">{row.value}</div>
            </div>
          ))}
        </div>

        {complaint.problem && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
            <p className="text-xs font-bold text-amber-700 mb-1.5 uppercase tracking-wide">Issues Reported</p>
            <p className="text-sm text-gray-700 leading-relaxed">{complaint.problem}</p>
          </div>
        )}

        {complaint.notes && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-xs font-bold text-blue-700 mb-1.5 uppercase tracking-wide">Internal Notes</p>
            <p className="text-sm text-gray-700 leading-relaxed">{complaint.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Main Service Panel ───────────────────────────────────────────────────────
export default function ServicePanel({ user }) {
  const { data: serviceData, isLoading: complaintsLoading, isError: isComplaintsError, error: complaintsError, refetch } = useGetAllService();
  // Raw docs come back in the actual Service schema shape — normalize once here
  // so every component below can keep using the flat field names it already had.
  const complaints = (serviceData?.services ?? []).map(normalizeService);
  const addServiceMutation = useAddService();
  const updateServiceMutation = useUpdateService();

  const [showForm, setShowForm] = useState(false);
  const [viewComplaint, setViewComplaint] = useState(null);
  const [completingComplaint, setCompletingComplaint] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleRegister = async (form) => {
    // Translate the UI form back into exactly the fields/types the Service
    // model expects: customerName, mobileNumber (Number), productName,
    // productBrand, warranty (Boolean), repairCharge (Number), Problem, notes.
    const payload = {
      customerName: form.customerName,
      mobileNumber: Number(form.mobileNumber),
      productName: form.productName,
      productBrand: form.productBrand,
      warranty: form.warranty,
      repairCharge: 0,
      problem: form.problem,
      notes: buildNotesWithFollowUp(form.followUpDate, form.notes),
    };

    try {
      const result = await addServiceMutation.mutateAsync(payload);
      const newId = result?.service?.serviceId || 'the new complaint';

      const msg =
        `Dear ${form.customerName}, your service complaint for *${form.productName}* (${form.productBrand}) has been registered at *Happy Home*.\n\n` +
        `🔖 Complaint ID: *${newId}*\n` +
        `🛡️ Warranty: ${form.warranty === 'in-warranty' ? 'In Warranty ✅' : 'Out of Warranty ❌'}` +
        `\n📅 Follow-up Date: ${form.followUpDate}\n\nWe will keep you updated. Thank you! 🙏`;

      sendWhatsApp(form.mobileNumber, msg);
      toast.success(`Complaint ${newId} registered! WhatsApp message opened.`);
      setShowForm(false);
      await refetch();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to register complaint');
    }
  };

  const handleComplete = async (complaint, repairCharge) => {
    try {
      await updateServiceMutation.mutateAsync({
        id: complaint._id,
        status: STATUS_TO_BACKEND.completed, // must be the literal enum string "completed"
        ...(repairCharge !== undefined ? { repairCharge } : {}),
      });

      const chargeText =
        repairCharge !== undefined && Number(repairCharge) > 0
          ? `\n💰 Repair Charges: ₹${Number(repairCharge).toLocaleString('en-IN')}\n`
          : '';

      const msg =
        `Dear ${complaint.customerName}, great news! 🎉\n\n` +
        `Your service complaint (*${complaint.id}*) for *${complaint.productName}* (${complaint.productBrand}) has been *successfully resolved*.\n` +
        chargeText +
        `\n✅ Please visit our store to collect your product.\n\n` +
        `Thank you for choosing *Happy Home*! We appreciate your trust. 😊`;

      sendWhatsApp(complaint.mobileNumber, msg);
      toast.success(`Complaint ${complaint.id} marked complete! Resolution message sent.`);
      setCompletingComplaint(null);
      setViewComplaint(null);
      await refetch();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update complaint');
    }
  };

  const counts = {
    all: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    'in-progress': complaints.filter(c => c.status === 'in-progress').length,
    completed: complaints.filter(c => c.status === 'completed').length,
    'followup-today': complaints.filter(c => c.followUpDate === today && c.status !== 'completed').length,
    'followup-overdue': complaints.filter(c => c.followUpDate && c.followUpDate < today && c.status !== 'completed').length,
  };

  const filtered = complaints.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      c.customerName.toLowerCase().includes(q) ||
      c.mobileNumber.includes(q) ||
      c.productName.toLowerCase().includes(q) ||
      c.productBrand.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q);

    if (!matchSearch) return false;
    if (filterStatus === 'all') return true;
    if (filterStatus === 'followup-today') return c.followUpDate === today && c.status !== 'completed';
    if (filterStatus === 'followup-overdue') return c.followUpDate && c.followUpDate < today && c.status !== 'completed';
    return c.status === filterStatus;
  });

  const statCards = [
    { key: 'all', label: 'Total', icon: FileText, gradient: 'from-gray-600 to-gray-700' },
    { key: 'pending', label: 'Pending', icon: Clock, gradient: 'from-amber-500 to-orange-500' },
    { key: 'in-progress', label: 'In Progress', icon: Wrench, gradient: 'from-blue-500 to-blue-600' },
    { key: 'completed', label: 'Completed', icon: CheckCircle2, gradient: 'from-green-500 to-emerald-600' },
    { key: 'followup-today', label: 'Today', icon: Calendar, gradient: 'from-purple-500 to-violet-600' },
    { key: 'followup-overdue', label: 'Overdue', icon: AlertTriangle, gradient: 'from-red-500 to-rose-600' },
  ];

  if (complaintsLoading) {
    return <div className="text-gray-500 p-6">Loading service complaints…</div>;
  }

  if (isComplaintsError) {
    return (
      <div className="text-red-600 p-6">
        Couldn't load complaints: {complaintsError?.response?.data?.message || 'Please try again.'}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Wrench className="text-orange-600 shrink-0" size={24} />
            Service Panel
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Register and manage customer service complaints</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-semibold shadow-md transition-all text-sm whitespace-nowrap self-start xs:self-auto"
        >
          <Plus size={17} /> New Complaint
        </button>
      </div>

      {/* Stat Cards - 3 cols on mobile, 6 on desktop */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {statCards.map(stat => (
          <button
            key={stat.key}
            onClick={() => setFilterStatus(stat.key)}
            className={`relative p-3 sm:p-4 rounded-xl text-white bg-gradient-to-br ${stat.gradient} shadow-sm transition-all active:scale-95 ${
              filterStatus === stat.key ? 'ring-2 ring-offset-2 ring-orange-400 scale-105' : 'hover:scale-105'
            }`}
          >
            <stat.icon size={16} className="mb-1.5 opacity-80 mx-auto sm:mx-0" />
            <div className="text-xl sm:text-2xl font-bold text-center sm:text-left">{counts[stat.key]}</div>
            <div className="text-xs opacity-90 leading-tight text-center sm:text-left">{stat.label}</div>
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search name, number, product, ID..."
            className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="relative sm:w-48">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white appearance-none cursor-pointer"
          >
            <option value="all">All Complaints</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="followup-today">Follow-up Today</option>
            <option value="followup-overdue">Overdue Follow-ups</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Active filter pill */}
      {filterStatus !== 'all' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Filtered by:</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
            {statCards.find(s => s.key === filterStatus)?.label}
            <button onClick={() => setFilterStatus('all')} className="hover:text-orange-900">
              <X size={11} />
            </button>
          </span>
          <span className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Complaint list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Wrench size={44} className="mx-auto mb-3 opacity-20" />
          <p className="text-base font-medium text-gray-500">No complaints found</p>
          <p className="text-sm mt-1">Try adjusting your filter or search query</p>
          {filterStatus !== 'all' && (
            <button onClick={() => setFilterStatus('all')} className="mt-4 text-sm text-orange-600 hover:underline font-semibold">
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
          {filtered.map(c => (
            <ComplaintCard
              key={c.id}
              complaint={c}
              onView={() => setViewComplaint(c)}
              onComplete={() => setCompletingComplaint(c)}
              onFollowUp={() =>
                sendWhatsApp(
                  c.mobileNumber,
                  `Dear ${c.customerName}, this is a follow-up regarding your service complaint *${c.id}* for *${c.productName}* (${c.productBrand}). Our team is actively working on it. We will update you shortly. Thank you for your patience! 🙏 - Happy Home`
                )
              }
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <ComplaintForm
          onClose={() => setShowForm(false)}
          onSubmit={handleRegister}
          isSubmitting={addServiceMutation.isPending}
        />
      )}
      {viewComplaint && (
        <ComplaintDetail
          complaint={viewComplaint}
          onClose={() => setViewComplaint(null)}
          onComplete={() => setCompletingComplaint(viewComplaint)}
          isCompleting={updateServiceMutation.isPending}
        />
      )}
      {completingComplaint && (
        <CompleteConfirmModal
          complaint={completingComplaint}
          onClose={() => {
            if (!updateServiceMutation.isPending) setCompletingComplaint(null);
          }}
          onConfirm={handleComplete}
          isCompleting={updateServiceMutation.isPending}
        />
      )}
    </div>
  );
}