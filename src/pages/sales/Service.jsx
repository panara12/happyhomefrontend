import { useMemo, useState } from 'react';
import { Plus, Wrench, Phone, ShieldCheck, ShieldOff, IndianRupee, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useAddService, useGetAllService } from '../../hooks/useService';
import { Pagination } from '../../components/ui/Pagination';
import { usePagination } from '../../hooks/usePagination';

const initialFormData = {
  customerName: '',
  mobileNumber: '',
  productName: '',
  productBrand: '',
  warranty: 'in-warranty',
  repairCharge: 0,
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
  const { data: servicesData, isLoading } = useGetAllService();
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

    addService(formData, {
      onSuccess: () => {
        toast.success('Service request submitted!');
        setFormData(initialFormData);
        setShowAddModal(false);
      },
      onError: (err) => {
        toast.error(err?.response?.data?.message || 'Failed to submit service request');
      }
    });
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 my-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">New Service Request</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number *</label>
                <input
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="98765 43210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="e.g., LED TV 43 inch"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Brand *</label>
                <input
                  type="text"
                  value={formData.productBrand}
                  onChange={(e) => setFormData({ ...formData, productBrand: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="e.g., Samsung"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Repair Charge (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.repairCharge}
                  onChange={(e) => setFormData({ ...formData, repairCharge: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Warranty Status</label>
                <select
                  value={formData.warranty}
                  onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                >
                  <option value="in-warranty">In warranty</option>
                  <option value="out-warranty">Out of warranty</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Problem *</label>
                <textarea
                  value={formData.Problem}
                  onChange={(e) => setFormData({ ...formData, Problem: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="Describe the issue reported by the customer"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="Any additional notes (optional)"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}