import { useMemo, useState } from 'react';
import { Plus, Wrench, Phone, ShieldCheck, ShieldOff, IndianRupee, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useAddService, useGetAllService } from '../../hooks/useService';
import { Pagination } from '../../components/ui/Pagination';
import { usePagination } from '../../hooks/usePagination';
import Modal, {
  modalInputClass,
  modalLabelClass,
  modalPrimaryBtnClass,
  modalSecondaryBtnClass,
  modalSelectClass,
} from '../../components/ui/Modal';

const initialFormData = {
  customerName: '',
  mobileNumber: '',
  productName: '',
  productBrand: '',
  warranty: 'in-warranty',
  Problem: '',
  notes: ''
};

// Status values matched exactly to the backend enum, typos included ("in progess", "Cancled") —
// the model has these misspelled; correcting them here would just make valid values fail to match.
const STATUS_BADGE = {
  'Pending': { bg: 'bg-yellow-100 text-yellow-700' },
  'in progess': { bg: 'bg-blue-100 text-blue-700' },
  'completed': { bg: 'bg-green-100 text-green-700' },
  'Cancled': { bg: 'bg-red-100 text-red-700' },
};

export default function Service() {
  const { data: servicesData, isLoading, refetch } = useGetAllService();
  const services = useMemo(() => servicesData?.services || [], [servicesData?.services]);
  const pagination = usePagination(services)

  const { mutate: addService, isPending: isSubmitting } = useAddService();

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const getLatestStatus = (service) => {
    const history = service.status || [];
    return history[history.length - 1]?.status || 'Pending';
  };

  const handleSubmit = () => {
    if (!formData.customerName || !formData.mobileNumber || !formData.productName || !formData.productBrand || !formData.Problem) {
      toast.error('Please fill in customer, product, and problem details');
      return;
    }

    addService(
      {
        customerName: formData.customerName,
        mobileNumber: formData.mobileNumber,
        productName: formData.productName,
        productBrand: formData.productBrand,
        warranty: formData.warranty,
        problem: formData.Problem,
        notes: formData.notes,
        repairCharge: 0,
      },
      {
        onSuccess: async () => {
          toast.success('Service request submitted!');
          setFormData(initialFormData);
          setShowAddModal(false);
          await refetch();
        },
        onError: (err) => {
          toast.error(err?.response?.data?.message || 'Failed to submit service request');
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service Requests</h2>
          <p className="text-gray-600 mt-1">Log a repair request and track your submissions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus size={18} />
          New Service Request
        </button>
      </div>

      {isLoading && (
        <div className="text-center py-8 text-gray-500">Loading service requests...</div>
      )}

      {!isLoading && services.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Wrench className="mx-auto text-gray-400 mb-3" size={40} />
          <p className="text-gray-600">No service requests yet</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services && pagination.paginatedItems.map((service) => {
          const latestStatus = getLatestStatus(service);
          const badge = STATUS_BADGE[latestStatus] || STATUS_BADGE['Pending'];
          return (
            <div key={service._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">{service.serviceId}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg}`}>{latestStatus}</span>
              </div>
              <div className="p-4 space-y-2">
                <p className="font-medium text-gray-800">{service.customerName}</p>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Phone size={14} /> {service.mobileNumber}
                </p>
                <p className="text-sm text-gray-700">{service.productBrand} — {service.productName}</p>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  {service.warranty === 'in-warranty' ? <ShieldCheck size={14} className="text-green-600" /> : <ShieldOff size={14} className="text-gray-400" />}
                  {service.warranty === 'in-warranty' ? 'Under warranty' : 'Out of warranty'}
                </p>
                {service.repairCharge > 0 && (
                  <p className="text-sm text-gray-700 flex items-center gap-1">
                    <IndianRupee size={14} /> {service.repairCharge.toLocaleString()}
                  </p>
                )}
                <p className="text-sm text-gray-600 pt-2 border-t border-gray-100">{service.Problem}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 pt-1">
                  <Clock size={12} /> {new Date(service.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <Pagination
        page={pagination?.page || 1}
        totalPages={pagination?.totalPages || 1}
        totalItems={pagination?.totalItems || 0}
        pageSize={pagination?.pageSize || 10}
        onPageChange={pagination?.goToPage}
      />

      {showAddModal && (
        <Modal
          title="New Service Request"
          size="md"
          onClose={() => setShowAddModal(false)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                disabled={isSubmitting}
                className={modalSecondaryBtnClass}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={modalPrimaryBtnClass}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <label className={modalLabelClass}>Customer Name *</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className={modalInputClass}
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <label className={modalLabelClass}>Mobile Number *</label>
              <input
                type="tel"
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                className={modalInputClass}
                placeholder="98765 43210"
              />
            </div>
            <div>
              <label className={modalLabelClass}>Product Name *</label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className={modalInputClass}
                placeholder="e.g., LED TV 43 inch"
              />
            </div>
            <div>
              <label className={modalLabelClass}>Product Brand *</label>
              <input
                type="text"
                value={formData.productBrand}
                onChange={(e) => setFormData({ ...formData, productBrand: e.target.value })}
                className={modalInputClass}
                placeholder="e.g., Samsung"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={modalLabelClass}>Warranty Status</label>
              <select
                value={formData.warranty}
                onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                className={modalSelectClass}
              >
                <option value="in-warranty">In warranty</option>
                <option value="out-warranty">Out of warranty</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={modalLabelClass}>Problem *</label>
              <textarea
                value={formData.Problem}
                onChange={(e) => setFormData({ ...formData, Problem: e.target.value })}
                rows={3}
                className={modalInputClass}
                placeholder="Describe the issue reported by the customer"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={modalLabelClass}>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className={modalInputClass}
                placeholder="Any additional notes (optional)"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}