import { useState } from 'react';
import { Search, UserPlus, Edit2 } from 'lucide-react';
import { useSearchCustomers, useAddCustomer, useUpdateCustomer } from '../../hooks/useCustomer';
import Modal, {
  modalInputClass,
  modalLabelClass,
  modalSecondaryBtnClass,
  modalPrimaryBtnClass,
} from '../../components/ui/Modal';

export function CustomerSearch({ onSelectCustomer, selectedCustomer }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '', clientType: 'Regular' });

  const { data: searchData } = useSearchCustomers(searchTerm);
  const searchResults = searchData?.customers || [];

  const addCustomerMutation = useAddCustomer();
  const updateCustomerMutation = useUpdateCustomer();

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleSelectCustomer = (customer) => {
    onSelectCustomer(customer);
    setSearchTerm('');
  };

  const handleCreateCustomer = () => {
    if (newCustomer.name && newCustomer.phone) {
      addCustomerMutation.mutate(newCustomer, {
        onSuccess: (data) => {
          onSelectCustomer(data.customer);
          setNewCustomer({ name: '', phone: '', email: '', address: '', clientType: 'Regular' });
          setShowNewCustomerForm(false);
        }
      });
    }
  };

  const handleEditCustomer = () => {
    if (editingCustomer && editingCustomer.name && editingCustomer.phone) {
      updateCustomerMutation.mutate(editingCustomer, {
        onSuccess: (data) => {
          onSelectCustomer(data.customer);
          setEditingCustomer(null);
        }
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative w-full sm:flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full min-w-0 pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          {searchTerm.length > 0 && searchResults.length > 0 && (
            <div className="thin-scroll absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {searchResults.map((customer) => (
                <div
                  key={customer._id}
                  onClick={() => handleSelectCustomer(customer)}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-sm text-gray-600">{customer.phone} • {customer.clientType}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
          className="w-full sm:w-auto shrink-0 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2"
        >
          <UserPlus className="w-5 h-5 shrink-0" />
          New Customer
        </button>
      </div>

      {selectedCustomer && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-medium text-base sm:text-lg truncate">{selectedCustomer.name}</div>
                <span className="px-2 py-1 text-xs rounded-full bg-amber-600 text-white shrink-0">
                  {selectedCustomer.clientType}
                </span>
              </div>
              <div className="text-sm text-gray-600">Phone: {selectedCustomer.phone}</div>
              {selectedCustomer.email && (
                <div className="text-sm text-gray-600 break-all">Email: {selectedCustomer.email}</div>
              )}
              {selectedCustomer.address && (
                <div className="text-sm text-gray-600">Address: {selectedCustomer.address}</div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditingCustomer(selectedCustomer)}
                className="text-amber-600 hover:text-amber-700 p-2 border border-amber-200 rounded-lg bg-white"
                title="Edit Customer"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onSelectCustomer(null)}
                className="text-gray-600 hover:text-gray-800 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
              >
                Change
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewCustomerForm && (
        <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50">
          <h3 className="font-medium mb-3">New Customer</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Customer Name *"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <input
              type="tel"
              placeholder="Phone Number *"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <input
              type="email"
              placeholder="Email (Optional)"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <div>
              <select
                value={newCustomer.clientType}
                onChange={(e) => setNewCustomer({ ...newCustomer, clientType: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="Regular">Regular</option>
                <option value="Corporate">Corporate</option>
                <option value="B2B">B2B</option>
                <option value="Wholesale">Wholesale</option>
              </select>
            </div>
            <textarea
              placeholder="Address (Optional)"
              value={newCustomer.address}
              onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              rows={2}
              className="sm:col-span-2 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <div className="sm:col-span-2 flex flex-col-reverse sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setShowNewCustomerForm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCustomer}
                disabled={addCustomerMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {addCustomerMutation.isPending ? 'Creating...' : 'Create Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCustomer && (
        <Modal
          title="Edit Customer"
          size="sm"
          onClose={() => setEditingCustomer(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className={modalSecondaryBtnClass}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditCustomer}
                disabled={updateCustomerMutation.isPending}
                className={modalPrimaryBtnClass}
              >
                {updateCustomerMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-y-3">
            <div>
              <label className={modalLabelClass}>Customer Name *</label>
              <input
                type="text"
                value={editingCustomer.name}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                className={modalInputClass}
              />
            </div>
            <div>
              <label className={modalLabelClass}>Phone Number *</label>
              <input
                type="tel"
                value={editingCustomer.phone}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                className={modalInputClass}
              />
            </div>
            <div>
              <label className={modalLabelClass}>Email</label>
              <input
                type="email"
                value={editingCustomer.email || ''}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                className={modalInputClass}
              />
            </div>
            <div>
              <label className={modalLabelClass}>Address</label>
              <textarea
                value={editingCustomer.address || ''}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                rows={2}
                className={modalInputClass}
              />
            </div>
            <div>
              <label className={modalLabelClass}>Client Type *</label>
              <select
                value={editingCustomer.clientType}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, clientType: e.target.value })}
                className={modalInputClass}
              >
                <option value="Regular">Regular</option>
                <option value="Corporate">Corporate</option>
                <option value="B2B">B2B</option>
                <option value="Wholesale">Wholesale</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
