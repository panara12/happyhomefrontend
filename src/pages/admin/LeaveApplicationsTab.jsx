import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/ui/Pagination';
import { getLeaveTypeColor } from './leaveBadges';

// `pendingLeaves`/`processedLeaves` are already role/store-access filtered
// by the parent — this only owns pagination + rendering.
export function LeaveApplicationsTab({ pendingLeaves, processedLeaves, onApprove, onViewDetail }) {
  const pagination = usePagination(processedLeaves);

  return (
    <div className="space-y-4">
      {/* Pending Leaves */}
      {pendingLeaves.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
              {pendingLeaves.length}
            </span>
            Pending Approvals
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingLeaves.map((leave) => (
              <div key={leave.id} className="bg-white rounded-xl shadow-lg border-2 border-yellow-200 overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-lg">{leave.employeeName}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLeaveTypeColor(leave.leaveType)} bg-white`}>
                      {leave.leaveType}
                    </span>
                  </div>
                  <p className="text-sm opacity-90 mt-1">ID: {leave.id}</p>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">From Date</p>
                      <p className="font-medium text-gray-800">{leave.fromDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">To Date</p>
                      <p className="font-medium text-gray-800">{leave.toDate}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600">Duration</p>
                    <p className="font-bold text-amber-600 text-lg">{leave.days} Day(s)</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 mb-1">Reason</p>
                    <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">{leave.reason}</p>
                  </div>

                  <div className="text-xs text-gray-500">
                    Applied on: {leave.appliedDate}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                    <button
                      onClick={() => onApprove(leave.id, 'Approved')}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium"
                    >
                      <CheckCircle size={18} />
                      Approve
                    </button>
                    <button
                      onClick={() => onApprove(leave.id, 'Rejected')}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium"
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

      {/* Approved/Rejected Leaves */}
      {processedLeaves.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">Processed Applications</h3>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm">ID</th>
                    <th className="px-4 py-3 text-left text-sm">Employee</th>
                    <th className="px-4 py-3 text-left text-sm">Leave Type</th>
                    <th className="px-4 py-3 text-left text-sm">Duration</th>
                    <th className="px-4 py-3 text-left text-sm">Dates</th>
                    <th className="px-4 py-3 text-center text-sm">Status</th>
                    <th className="px-4 py-3 text-center text-sm">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pagination.paginatedItems.map((leave) => (
                    <tr key={leave.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{leave.id}</td>
                      <td className="px-4 py-3 text-sm">{leave.employeeName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getLeaveTypeColor(leave.leaveType)}`}>
                          {leave.leaveType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{leave.days} day(s)</td>
                      <td className="px-4 py-3 text-sm">{leave.fromDate} to {leave.toDate}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          leave.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => onViewDetail(leave)}
                          className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                        >
                          <Eye size={16} />
                        </button>
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
