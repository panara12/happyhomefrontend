import { useEffect, useMemo, useState } from 'react';
import { Search, User, Phone, Mail, MapPin, Award, Building2, Users, ShoppingBag, Eye, Filter } from 'lucide-react';
import { Pagination } from '../../components/ui/Pagination';
import { useGetAllCustomers } from '../../hooks/useCustomer';

const PAGE_SIZE = 9;

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' });
}

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export default function ClientCards() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [page, setPage] = useState(1);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterType]);

  const { data, isLoading, isError } = useGetAllCustomers({
    q: debouncedSearch,
    clientType: filterType,
    page,
    limit: PAGE_SIZE,
  });

  const clients = data?.customers || [];
  const paginationMeta = data?.pagination || { total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 };
  const summary = data?.summary || {
    total: 0,
    corporate: 0,
    b2b: 0,
    totalRevenue: 0,
    totalPoints: 0,
  };

  const stats = useMemo(() => ({
    total: summary.total || 0,
    corporate: summary.corporate || 0,
    b2b: summary.b2b || 0,
    totalPoints: summary.totalPoints || 0,
    totalRevenue: summary.totalRevenue || 0,
    avgPurchase: summary.total > 0 ? Math.round((summary.totalRevenue || 0) / summary.total) : 0,
  }), [summary]);

  const getClientTypeColor = (type) => {
    switch (type) {
      case 'Regular':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Corporate':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'B2B':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Wholesale':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getClientTypeIcon = (type) => {
    switch (type) {
      case 'Regular':
        return <User size={16} />;
      case 'Corporate':
        return <Building2 size={16} />;
      case 'B2B':
        return <Users size={16} />;
      case 'Wholesale':
        return <ShoppingBag size={16} />;
      default:
        return <User size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Client Cards</h2>
          <p className="text-gray-600 mt-1">View and manage your client database</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building2 className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Corporate</p>
              <p className="text-2xl font-bold text-gray-800">{stats.corporate}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">B2B Clients</p>
              <p className="text-2xl font-bold text-gray-800">{stats.b2b}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-amber-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Award className="text-amber-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Points</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalPoints.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
          <p className="text-sm opacity-90">Total Revenue from Clients</p>
          <p className="text-3xl font-bold mt-2">{formatMoney(stats.totalRevenue)}</p>
        </div>
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg shadow-lg p-6 text-white">
          <p className="text-sm opacity-90">Average Purchase Value</p>
          <p className="text-3xl font-bold mt-2">{formatMoney(stats.avgPurchase)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, phone, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none appearance-none"
          >
            <option value="All">All Client Types</option>
            <option value="Regular">Regular</option>
            <option value="Corporate">Corporate</option>
            <option value="B2B">B2B</option>
            <option value="Wholesale">Wholesale</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-16 bg-white rounded-lg shadow text-gray-500 animate-pulse">
          Loading clients...
        </div>
      )}

      {isError && (
        <div className="text-center py-16 bg-white rounded-lg shadow text-red-600">
          Failed to load clients. Please try again.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {clients.map((client) => (
              <div
                key={client._id || client.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200"
              >
                <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4 text-white">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <h3 className="font-bold text-lg truncate">{client.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 shrink-0 ${getClientTypeColor(client.clientType)} bg-white`}>
                      {getClientTypeIcon(client.clientType)}
                      {client.clientType}
                    </span>
                  </div>
                  <p className="text-xs opacity-90 truncate">Client ID: {client._id || client.id}</p>
                </div>

                <div className="p-5 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Phone className="text-gray-400 mt-1 flex-shrink-0" size={16} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600">Phone</p>
                        <p className="font-medium text-gray-800 text-sm">{client.phone || '—'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail className="text-gray-400 mt-1 flex-shrink-0" size={16} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600">Email</p>
                        <p className="font-medium text-gray-800 text-sm truncate">{client.email || '—'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="text-gray-400 mt-1 flex-shrink-0" size={16} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600">Address</p>
                        <p className="font-medium text-gray-800 text-sm line-clamp-2">{client.address || '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="text-amber-600" size={20} />
                        <span className="text-sm font-medium text-amber-800">Loyalty Points</span>
                      </div>
                      <span className="text-2xl font-bold text-amber-600">{client.loyaltyPoints || 0}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-blue-700">Total Purchases</p>
                      <p className="font-bold text-blue-900 text-sm mt-1">{formatMoney(client.totalPurchases)}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <p className="text-xs text-green-700">Last Purchase</p>
                      <p className="font-bold text-green-900 text-sm mt-1">{formatDate(client.lastPurchase)}</p>
                    </div>
                  </div>

                  <div className="text-center pt-2 border-t">
                    <p className="text-xs text-gray-500">Member since {formatDate(client.joinedDate || client.createdAt)}</p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedClient(client);
                      setShowDetailModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all font-medium"
                  >
                    <Eye size={18} />
                    View Full Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={paginationMeta.page || page}
            totalPages={paginationMeta.totalPages || 1}
            totalItems={paginationMeta.total || 0}
            pageSize={paginationMeta.limit || PAGE_SIZE}
            onPageChange={setPage}
          />

          {clients.length === 0 && (
            <div className="text-center py-16 bg-white rounded-lg shadow">
              <User className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-xl font-bold text-gray-800 mb-2">No clients found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </>
      )}

      {showDetailModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">{selectedClient.name}</h2>
                  <p className="text-sm opacity-90 mt-1">Client ID: {selectedClient._id || selectedClient.id}</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium border-2 flex items-center gap-2 ${getClientTypeColor(selectedClient.clientType)} bg-white`}>
                  {getClientTypeIcon(selectedClient.clientType)}
                  {selectedClient.clientType}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Phone className="text-amber-600" size={20} />
                  Contact Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="font-medium text-gray-800">{selectedClient.phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email Address</p>
                      <p className="font-medium text-gray-800">{selectedClient.email || '—'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Full Address</p>
                    <p className="font-medium text-gray-800">{selectedClient.address || '—'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Award className="text-amber-600" size={20} />
                  Loyalty & Purchase History
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-5 border-2 border-amber-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Award className="text-amber-600" size={24} />
                      <p className="text-sm font-medium text-amber-800">Loyalty Points</p>
                    </div>
                    <p className="text-4xl font-bold text-amber-600">{selectedClient.loyaltyPoints || 0}</p>
                    <p className="text-xs text-amber-700 mt-2">Available for redemption</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border-2 border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                      <ShoppingBag className="text-blue-600" size={24} />
                      <p className="text-sm font-medium text-blue-800">Total Purchases</p>
                    </div>
                    <p className="text-4xl font-bold text-blue-600">{formatMoney(selectedClient.totalPurchases)}</p>
                    <p className="text-xs text-blue-700 mt-2">{selectedClient.invoiceCount || 0} invoices</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <p className="text-sm font-medium text-green-800">Last Purchase Date</p>
                      <p className="text-xs text-green-600 mt-1">Most recent transaction</p>
                    </div>
                    <p className="text-lg font-bold text-green-700">{formatDate(selectedClient.lastPurchase)}</p>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div>
                      <p className="text-sm font-medium text-purple-800">Member Since</p>
                      <p className="text-xs text-purple-600 mt-1">Registration date</p>
                    </div>
                    <p className="text-lg font-bold text-purple-700">{formatDate(selectedClient.joinedDate || selectedClient.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 text-center flex items-center justify-center gap-2">
                  <Eye size={16} />
                  <strong>View Only:</strong> Client cards cannot be deleted. For modifications, contact your administrator.
                </p>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedClient(null);
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
