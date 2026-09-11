import { useMemo, useState } from 'react';
import { Clock, CheckCircle, XCircle, Eye, Calendar } from 'lucide-react';
import { useLeaveContext } from '../../context/leaveContext';
import Modal, { modalSecondaryBtnClass } from '../../components/ui/Modal';

export function LeaveRequests({ requests,onApprove, onReject, showActions = false, currentUser }) {
  const [selectedRequest, setSelectedRequest] = useState(null);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4" />
            Pending
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4" />
            Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
            <XCircle className="w-4 h-4" />
            Rejected
          </span>
        );
    }
  };

  const getLeaveTypeBadge = (type) => {
    const colors = {
      'Sick Leave': 'bg-blue-100 text-blue-800',
      'Casual Leave': 'bg-purple-100 text-purple-800',
      'Annual Leave': 'bg-green-100 text-green-800',
      'Emergency Leave': 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };


  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p>No leave requests found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {requests.map((request) => (
          <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <h3 className="font-medium text-lg">{request.userId.fullName}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${getLeaveTypeBadge(request.leave_type)}`}>
                    {request.leave_type}
                  </span>
                  {getStatusBadge(request.status)}
                </div>

                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {request.start_date.toString().split("T")[0]} - {request.end_date.toString().split("T")[0]}
                    </span>
                    <span className="font-medium">({request.number_of_days} {request.number_of_days === 1 ? 'day' : 'days'})</span>
                  </div>
                  <div className="text-gray-500">
                    Applied: {request.applied_date.toString().split("T")[0]}
                  </div>
                  {request.status !== 'Pending' && request.approved_user_id && (
                    <div className="text-gray-500">
                      {request.status === 'Approved' ? 'Approved' : 'Rejected'} by {request.approved_user_id.fullName} on {request.updatedAt && request.updatedAt.toString().split("T")[0]}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex sm:flex-col gap-2">
                <button
                  onClick={() => setSelectedRequest(request)}
                  className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>

                {showActions && request.status === 'pending' && onApprove && onReject && (
                  <>
                    <button
                      onClick={() => onApprove(request.leave_id)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => onReject(request.leave_id)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedRequest && (
        <Modal
          title={
            <div>
              <h3 className="text-xl font-bold text-gray-800">Leave Request Details</h3>
              <div className="text-sm text-gray-600 mt-0.5">
                Submitted on {selectedRequest.applied_date.toString().split('T')[0]}
              </div>
            </div>
          }
          size="md"
          onClose={() => setSelectedRequest(null)}
          footer={
            <button
              type="button"
              onClick={() => setSelectedRequest(null)}
              className={modalSecondaryBtnClass}
            >
              Close
            </button>
          }
        >
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Employee Name</div>
                <div className="font-medium">{selectedRequest.userId.fullName}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Leave Type</div>
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${getLeaveTypeBadge(selectedRequest.leave_type)}`}>
                  {selectedRequest.leave_type}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Start Date</div>
                <div className="font-medium">{selectedRequest.start_date.toString().split('T')[0]}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">End Date</div>
                <div className="font-medium">{selectedRequest.end_date.toString().split('T')[0]}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Total Days</div>
                <div className="font-medium text-amber-600">
                  {selectedRequest.number_of_days}{' '}
                  {selectedRequest.number_of_days === 1 ? 'day' : 'days'}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Reason</div>
              <div className="text-gray-800">{selectedRequest.reason}</div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Status</div>
              {getStatusBadge(selectedRequest.status)}
              {selectedRequest.status !== 'Pending' && selectedRequest.approvedBy && (
                <div className="mt-2 text-sm text-gray-600">
                  {selectedRequest.status === 'Approved' ? 'Approved' : 'Rejected'} by{' '}
                  {selectedRequest.approved_user_id.fullName} on{' '}
                  {selectedRequest.updatedAt && selectedRequest.updatedAt.toString().split('T')[0]}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}