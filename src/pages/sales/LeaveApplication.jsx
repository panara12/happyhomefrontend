import { useState } from 'react';
import { Calendar, FileText } from 'lucide-react';

export function LeaveApplication({ userId, onSubmit }) {
  const [leave_type, setLeaveType] = useState('Casual Leave');
  const [start_date, setStartDate] = useState('');
  const [end_date, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const calculateDays = () => {
    if (start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);
      const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return diff > 0 ? diff : 0;
    }
    return 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!start_date || !end_date || !reason.trim()) {
      alert('Please fill all required fields');
      return;
    }

    const number_of_days = calculateDays();
    if (number_of_days<0) {
      alert('End date must be after start date');
      return;
    }

    onSubmit({
      userId,
      leave_type,
      start_date,
      end_date,
      number_of_days,
      reason
    });

    setStartDate('');
    setEndDate('');
    setReason('');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-6 h-6 text-amber-600" />
        <h3 className="text-xl font-medium">Apply for Leave</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Leave Type *</label>
            <select
              value={leave_type}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="Casual Leave">Casual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Annual Leave">Annual Leave</option>
              <option value="Emergency Leave">Emergency Leave</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Number of Days</label>
            <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg font-medium">
              {calculateDays()} {calculateDays() === 1 ? 'day' : 'days'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Start Date *</label>
            <input
              type="date"
              value={start_date}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">End Date *</label>
            <input
              type="date"
              value={end_date}
              onChange={(e) => setEndDate(e.target.value)}
              min={start_date || new Date().toString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Reason *</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Please provide a reason for your leave request..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2 font-medium"
        >
          <FileText className="w-5 h-5" />
          Submit Leave Request
        </button>
      </form>
    </div>
  );
}