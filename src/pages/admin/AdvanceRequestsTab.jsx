import { CheckCircle, XCircle } from 'lucide-react';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/ui/Pagination';

// `pendingAdvances`/`processedAdvances` are already role/store-access
// filtered by the parent — this only owns pagination + rendering.
export function AdvanceRequestsTab({ pendingAdvances, processedAdvances, onApprove }) {
  const pagination = usePagination(processedAdvances);

  return (
    <div className="space-y-4">
      {pendingAdvances.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
              {pendingAdvances.length}
            </span>
            Pending Advance Requests
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingAdvances.map((advance) => (
              <div key={advance.id} className="bg-white rounded-xl shadow-lg border-2 border-purple-200">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-4">
                  <h4 className="font-bold text-lg">{advance.employeeName}</h4>
                  <p className="text-sm opacity-90">ID: {advance.id}</p>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-xs text-gray-600">Requested Amount</p>
                    <p className="font-bold text-purple-600 text-3xl">₹{advance.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Reason</p>
                    <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">{advance.reason}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    Requested on: {advance.requestDate}
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                    <button
                      onClick={() => onApprove(advance.id, 'Approved')}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                    >
                      <CheckCircle size={18} />
                      Approve
                    </button>
                    <button
                      onClick={() => onApprove(advance.id, 'Rejected')}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {processedAdvances.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">Processed Advances</h3>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm">ID</th>
                    <th className="px-4 py-3 text-left text-sm">Employee</th>
                    <th className="px-4 py-3 text-right text-sm">Amount</th>
                    <th className="px-4 py-3 text-left text-sm">Request Date</th>
                    <th className="px-4 py-3 text-center text-sm">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pagination.paginatedItems.map((advance) => (
                    <tr key={advance.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{advance.id}</td>
                      <td className="px-4 py-3 text-sm">{advance.employeeName}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold">₹{advance.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">{advance.requestDate}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          advance.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {advance.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.goToPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
