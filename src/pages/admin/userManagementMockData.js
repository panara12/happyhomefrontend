// Advance requests aren't backed by a real API yet — this seed data stands
// in until that endpoint exists. Leave applications now come from
// /leave/getallleave (see useLeave.jsx).
export const INITIAL_ADVANCE_REQUESTS = [
  {
    id: 'AR-001',
    employeeName: 'Ramesh Kumar',
    employeeId: 'sales1',
    amount: 5000,
    reason: 'Medical emergency - mother hospitalization',
    requestDate: '2026-04-22',
    status: 'Pending',
    store: 'Store 1'
  },
  {
    id: 'AR-002',
    employeeName: 'Amit Patel',
    employeeId: 'sales3',
    amount: 3000,
    reason: 'House rent advance needed',
    requestDate: '2026-04-21',
    status: 'Pending',
    store: 'Store 1'
  },
];
