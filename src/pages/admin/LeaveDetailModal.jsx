import { getLeaveTypeColor } from './leaveBadges';

export function LeaveDetailModal({ leave, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Leave Details</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Employee Name</p>
              <p className="font-medium text-gray-800">{leave.employeeName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Leave Type</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs ${getLeaveTypeColor(leave.leaveType)}`}>
                {leave.leaveType}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">From Date</p>
              <p className="font-medium text-gray-800">{leave.fromDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">To Date</p>
              <p className="font-medium text-gray-800">{leave.toDate}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Reason</p>
            <p className="text-gray-800 bg-gray-50 p-4 rounded-lg">{leave.reason}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
