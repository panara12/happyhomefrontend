import Modal, { modalSecondaryBtnClass } from '../../components/ui/Modal';
import { getLeaveTypeColor } from './leaveBadges';

export function LeaveDetailModal({ leave, onClose }) {
  return (
    <Modal
      title="Leave Details"
      onClose={onClose}
      size="md"
      footer={
        <button type="button" onClick={onClose} className={modalSecondaryBtnClass}>
          Close
        </button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Employee Name</p>
          <p className="font-medium text-gray-800 text-sm">{leave.employeeName}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Leave Type</p>
          <span className={`inline-block px-3 py-1 rounded-full text-xs ${getLeaveTypeColor(leave.leaveType)}`}>
            {leave.leaveType}
          </span>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">From Date</p>
          <p className="font-medium text-gray-800 text-sm">{leave.fromDate}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">To Date</p>
          <p className="font-medium text-gray-800 text-sm">{leave.toDate}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs text-gray-500 mb-1.5">Reason</p>
          <p className="text-gray-800 bg-gray-50 p-3 rounded-lg text-sm">{leave.reason}</p>
        </div>
      </div>
    </Modal>
  );
}
