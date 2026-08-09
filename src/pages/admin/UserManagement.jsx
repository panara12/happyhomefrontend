import { useState } from 'react';
import { Plus, Shield, Users, Search, Calendar, CheckCircle, XCircle, DollarSign, Eye, Computer, Edit, Trash, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { useActiveUser, useAddUser, useDeleteUser, useUpdateUser, useGetAllUsers } from '../../hooks/useUser';
import { useStoreContext } from '../../context/storeContext';

export default function UserManagement({ user }) {
  const [activeTab, setActiveTab] = useState('team');
  const {stores} = useStoreContext()
  const {data:userlist} = useGetAllUsers()
  // Derive directly from the query — no useEffect/local-state mirroring,
  // and this defaults to [] so nothing downstream ever sees `undefined`.
  const users = userlist?.data ?? [];



  const [leaveApplications, setLeaveApplications] = useState([
    {
      id: 'LA-001',
      employeeName: 'Ramesh Kumar',
      employeeId: 'sales1',
      leaveType: 'Sick Leave',
      fromDate: '2026-04-25',
      toDate: '2026-04-26',
      days: 2,
      reason: 'Suffering from viral fever, doctor advised rest',
      status: 'Pending',
      appliedDate: '2026-04-23',
      store: 'Store 1'
    },
    {
      id: 'LA-002',
      employeeName: 'Priya Sharma',
      employeeId: 'sales2',
      leaveType: 'Casual Leave',
      fromDate: '2026-04-28',
      toDate: '2026-04-30',
      days: 3,
      reason: 'Family function - sister wedding',
      status: 'Pending',
      appliedDate: '2026-04-22',
      store: 'Store 1'
    },
    {
      id: 'LA-003',
      employeeName: 'Amit Patel',
      employeeId: 'sales3',
      leaveType: 'Earned Leave',
      fromDate: '2026-05-05',
      toDate: '2026-05-09',
      days: 5,
      reason: 'Planning family vacation to Goa',
      status: 'Approved',
      appliedDate: '2026-04-20',
      store: 'Store 1'
    },
    {
      id: 'LA-004',
      employeeName: 'Ramesh Kumar',
      employeeId: 'sales1',
      leaveType: 'Emergency Leave',
      fromDate: '2026-04-15',
      toDate: '2026-04-15',
      days: 1,
      reason: 'Mother hospitalized - emergency',
      status: 'Approved',
      appliedDate: '2026-04-15',
      store: 'Store 1'
    },
  ]);


  const [advanceRequests, setAdvanceRequests] = useState([
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
  ]);
  const addUserMutation = useAddUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const activeUserMutation = useActiveUser();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showActiveUserModal, setShowActiveUserModal]  = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    userType: '',
    mobile: "",
    storeId: "",
    password: ''
  });

  const handleAddUser = (e) => {
    e.preventDefault();
    if (formData.fullName && formData.username && formData.email) {
      addUserMutation.mutate(formData);
      setFormData({ fullName: '', username: '', email: '', userType: '',mobile: "", storeId: "", password: '' });
      setShowAddModal(false);
      toast.success('Sales person added successfully!');
    } else {
      toast.error('Please fill all required fields');
    }
  };

  const handleUpdateUser = (e) => {
    e.preventDefault();
    if (formData.fullName && formData.username && formData.email) {
      updateUserMutation.mutate(formData, {
    onSuccess: () => {
        setShowUpdateModal(false);
        toast.success("Updated successfully");
    }
});
      setFormData({ fullName: '', username: '', email: '', userType: '',mobile: "", storeId: "", password: '' });
      // setShowUpdateModal(false);
      // toast.success('Sales person updated successfully!');
    } else {
      toast.error('Please fill all required fields');
    }
  };

  const handleDeleteUser = (e)=>{
      e.preventDefault();
      deleteUserMutation.mutate({userId: selectedUser._id, storeId: selectedUser.storeId}, {
        onSuccess: () => {
            setShowDeleteModal(false);
            toast.success("Deleted successfully");
        }
    });
  }
  const handleActiveUser = (e)=>{
      e.preventDefault();
      activeUserMutation.mutate({userId: selectedUser._id}, {
        onSuccess: () => {
            setShowActiveUserModal(false);
            toast.success("User active successfully");
        }
    });
  }

  const handleLeaveApproval = (id, status) => {
    setLeaveApplications(leaveApplications.map(app =>
      app.id === id ? { ...app, status } : app
    ));
    toast.success(`Leave application ${status.toLowerCase()} successfully!`);
  };


  const handleAdvanceApproval = (id, status) => {
    setAdvanceRequests(advanceRequests.map(adv =>
      adv.id === id ? { ...adv, status } : adv
    ));
    toast.success(`Advance request ${status.toLowerCase()} successfully!`);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStore = user.userType === 'admin' || (user.storeId && u.store === `Store ${user.storeId}`) || u.store === 'All Stores';
    return matchesSearch && matchesStore;
  });

  const filteredLeaves = leaveApplications.filter(leave =>
    user.userType === 'admin' || (user.storeId && leave.store === `Store ${user.storeId}`)
  );

  const filteredAdvances = advanceRequests.filter(adv =>
    user.userType === 'admin' || (user.storeId && adv.store === `Store ${user.storeId}`)
  );

  const pendingLeaves = filteredLeaves.filter(l => l.status === 'Pending');
  const pendingAdvances = filteredAdvances.filter(a => a.status === 'Pending');

  const getLeaveTypeColor = (type) => {
    switch (type) {
      case 'Sick Leave': return 'bg-red-100 text-red-800';
      case 'Casual Leave': return 'bg-blue-100 text-blue-800';
      case 'Earned Leave': return 'bg-green-100 text-green-800';
      case 'Emergency Leave': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleBadge = (userType) => {
    switch (userType) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'manager': return 'bg-blue-100 text-blue-700';
      case 'sales': return 'bg-green-100 text-green-700';
      case 'accounting': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleIcon = (userType) => {
    switch (userType) {
      case 'admin': return <Shield size={18} className="text-purple-600" />;
      case 'manager': return <Users size={18} className="text-blue-600" />;
      case 'accounting': return <Computer size={18} className='text-yellow-600' />
      default: return <Users size={18} className="text-green-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Sales Team Management</h2>
          <p className="text-gray-600 mt-1">
            {user.userType === 'admin' ? 'Manage team and approvals' : 'Manage your sales team and approve requests'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg"
        >
          <Plus size={20} />
          Add Sales Person
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Sales Team</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{userlist?.totalUsers}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-yellow-700">Pending Leaves</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">{pendingLeaves.length}</p>
        </div>
        <div className="bg-purple-50 rounded-lg shadow p-4 border-l-4 border-purple-500">
          <p className="text-sm text-purple-700">Pending Advances</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">{pendingAdvances.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow p-2 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeTab === 'team'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <Users size={18} />
          Team Members
        </button>
        <button
          onClick={() => setActiveTab('leave')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all relative ${
            activeTab === 'leave'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <Calendar size={18} />
          Leave Applications
          {pendingLeaves.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {pendingLeaves.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('advance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all relative ${
            activeTab === 'advance'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <DollarSign size={18} />
          Advance Requests
          {pendingAdvances.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {pendingAdvances.length}
            </span>
          )}
        </button>
      </div>

      {/* Team Members Tab */}
      {activeTab === 'team' && (
        <>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Employee</th>
                    <th className="px-4 py-3 text-left">Username</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-center">Role</th>
                    <th className="px-4 py-3 text-left">Store</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                            {u.fullName.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-800">{u.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.username}</td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {getRoleIcon(u.userType)}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadge(u.userType)}`}>
                            {u.userType}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{u.storeId || "admin"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          u.active === true ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {u.active === true ? 'Active' : 'Deactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 space-x-3 text-center">
                        <button className="text-blue-500 hover:text-blue-700" 
                        onClick={() => {
                          setSelectedUser(u);
                          setFormData({...u, userId: u._id});
                          setShowUpdateModal(true);
                        }}>
                          <Edit size={18} />
                        </button>
                        {
                          u.active == true ? <button className="text-red-500 hover:text-red-700"
                            onClick={() => {
                              setSelectedUser(u);
                              setShowDeleteModal(true);
                            }}>
                              <Trash size={18} />
                            </button> :
                            <button className="text-green-500 hover:text-green-700"
                              onClick={() => {
                                setSelectedUser(u);
                                setShowActiveUserModal(true);
                              }}>
                                <Undo2 size={18} />
                            </button>
                        }
                        
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Leave Applications Tab */}
      {activeTab === 'leave' && (
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
                          onClick={() => handleLeaveApproval(leave.id, 'Approved')}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium"
                        >
                          <CheckCircle size={18} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleLeaveApproval(leave.id, 'Rejected')}
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
          {filteredLeaves.filter(l => l.status !== 'Pending').length > 0 && (
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
                      {filteredLeaves.filter(l => l.status !== 'Pending').map((leave) => (
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
                              onClick={() => {
                                setSelectedItem(leave);
                                setShowDetailModal(true);
                              }}
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
              </div>
            </div>
          )}
        </div>
      )}


      {/* Advance Requests Tab */}
      {activeTab === 'advance' && (
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
                          onClick={() => handleAdvanceApproval(advance.id, 'Approved')}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                        >
                          <CheckCircle size={18} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleAdvanceApproval(advance.id, 'Rejected')}
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

          {filteredAdvances.filter(a => a.status !== 'Pending').length > 0 && (
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
                      {filteredAdvances.filter(a => a.status !== 'Pending').map((advance) => (
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
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Add New Sales Person</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="johndoe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number *</label>
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Store</label>
                <select
                  value={formData.storeId}
                  onChange={(e) => setFormData({...formData, storeId: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                >
                  <option value="">Select a store</option>
                  {stores.map((store) => {
                    return <option key={store.storeId} value={store.storeId}>{store.name}</option>
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User role</label>
                <select
                  value={formData.userType}
                  onChange={(e) => setFormData({...formData, userType: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                >
                  <option value="">Select a role</option>
                  <option value="sales">Sales Person</option>
                  <option value="manager">Manager</option>
                  <option value="accounting">Accounting</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all"
              >
                Add Sales Person
              </button>
            </div>
          </div>
        </div>
      )}

      {/* update user model */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Update Sales Person</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="johndoe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number *</label>
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Store</label>
                <select
                  value={formData.storeId}
                  onChange={(e) => setFormData({...formData, storeId: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                >
                  <option value="">Select a store</option>
                  {stores.map((store) => {
                    return <option key={store.storeId} value={store.storeId}>{store.name}</option>
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User role</label>
                <select
                  value={formData.userType}
                  onChange={(e) => setFormData({...formData, userType: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                >
                  <option value="">Select a role</option>
                  <option value="sales">Sales Person</option>
                  <option value="manager">Manager</option>
                  <option value="accounting">Accounting</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all"
              >
                update Sales Person
              </button>
            </div>
          </div>
        </div>
      )}

      {/* delete user model */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Delete Sales Person</h3>
            <p className="text-gray-700 mb-6">Are you sure you want to delete <span className="font-medium">{selectedUser.fullName}</span>?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* active user model */}
      {showActiveUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Active User</h3>
            <p className="text-gray-700 mb-6">Are you sure you want to active <span className="font-medium">{selectedUser.fullName}</span>?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowActiveUserModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleActiveUser}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all"
              >
                Active
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Leave Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Employee Name</p>
                  <p className="font-medium text-gray-800">{selectedItem.employeeName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Leave Type</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs ${getLeaveTypeColor(selectedItem.leaveType)}`}>
                    {selectedItem.leaveType}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">From Date</p>
                  <p className="font-medium text-gray-800">{selectedItem.fromDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">To Date</p>
                  <p className="font-medium text-gray-800">{selectedItem.toDate}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Reason</p>
                <p className="text-gray-800 bg-gray-50 p-4 rounded-lg">{selectedItem.reason}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowDetailModal(false);
                setSelectedItem(null);
              }}
              className="w-full mt-6 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}