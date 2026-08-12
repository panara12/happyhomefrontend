// Shared by LeaveApplicationsTab and LeaveDetailModal so the two badge
// colorings can't drift apart.
export function getLeaveTypeColor(type) {
  switch (type) {
    case 'Sick Leave': return 'bg-red-100 text-red-800';
    case 'Casual Leave': return 'bg-blue-100 text-blue-800';
    case 'Earned Leave': return 'bg-green-100 text-green-800';
    case 'Emergency Leave': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
