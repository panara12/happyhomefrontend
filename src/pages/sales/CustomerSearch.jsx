import { useState } from 'react';
import { Search, UserPlus, Edit2 } from 'lucide-react';
import { useSearchCustomers, useAddCustomer, useUpdateCustomer } from '../../hooks/useCustomer';

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
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          {searchTerm.length > 0 && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
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
          onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
          className="px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          New Customer
        </button>
      </div>

      {selectedCustomer && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="font-medium text-lg">{selectedCustomer.name}</div>
                <span className="px-2 py-1 text-xs rounded-full bg-amber-600 text-white">
                  {selectedCustomer.clientType}
                </span>
              </div>
              <div className="text-sm text-gray-600">Phone: {selectedCustomer.phone}</div>
              {selectedCustomer.email && (
                <div className="text-sm text-gray-600">Email: {selectedCustomer.email}</div>
              )}
              {selectedCustomer.address && (
                <div className="text-sm text-gray-600">Address: {selectedCustomer.address}</div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingCustomer(selectedCustomer)}
                className="text-amber-600 hover:text-amber-700 p-2"
                title="Edit Customer"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onSelectCustomer(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                Change
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewCustomerForm && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="font-medium mb-3">New Customer</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Customer Name *"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <input
              type="tel"
              placeholder="Phone Number *"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <input
              type="email"
              placeholder="Email (Optional)"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <textarea
              placeholder="Address (Optional)"
              value={newCustomer.address}
              onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <div>
              <label className="block text-sm font-medium mb-1">Client Type *</label>
              <select
                value={newCustomer.clientType}
                onChange={(e) => setNewCustomer({ ...newCustomer, clientType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="Regular">Regular</option>
                <option value="Corporate">Corporate</option>
                <option value="B2B">B2B</option>
                <option value="Wholesale">Wholesale</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateCustomer}
                disabled={addCustomerMutation.isPending}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {addCustomerMutation.isPending ? 'Creating...' : 'Create Customer'}
              </button>
              <button
                onClick={() => setShowNewCustomerForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="font-medium text-lg mb-4">Edit Customer</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={editingCustomer.name}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={editingCustomer.phone}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={editingCustomer.email || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  value={editingCustomer.address || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Client Type *</label>
                <select
                  value={editingCustomer.clientType}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, clientType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="Regular">Regular</option>
                  <option value="Corporate">Corporate</option>
                  <option value="B2B">B2B</option>
                  <option value="Wholesale">Wholesale</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleEditCustomer}
                  disabled={updateCustomerMutation.isPending}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                >
                  {updateCustomerMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
