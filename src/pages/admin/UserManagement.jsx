import { useCallback, useMemo, useState } from 'react';
import { Plus, Users, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useActiveUser, useAddUser, useDeleteUser, useUpdateUser, useGetAllUsers } from '../../hooks/useUser';
import { useGetAllLeaves, useUpdateLeave } from '../../hooks/useLeave';
import { useStoreContext } from '../../context/storeContext';
import { UserFormModal } from './UserFormModal';
import { ConfirmModal } from './ConfirmModal';
import { TeamMembersTab } from './TeamMembersTab';
import { LeaveApplicationsTab } from './LeaveApplicationsTab';
import { AdvanceRequestsTab } from './AdvanceRequestsTab';
import { LeaveDetailModal } from './LeaveDetailModal';
import { INITIAL_ADVANCE_REQUESTS } from './userManagementMockData';
import { useLeaveContext } from '../../context/leaveContext';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '');

// Stable reference so the `?? EMPTY_ARRAY` fallback below doesn't hand
// useMemo a new array (and therefore a new dep) every render.
const EMPTY_ARRAY = [];

export default function UserManagement({ user }) {
  const [activeTab, setActiveTab] = useState('team');
  const {stores} = useStoreContext()
  const {data:userlist} = useGetAllUsers()
  const {leaves:leaveApplications} = useLeaveContext();
  // Derive directly from the query — no useEffect/local-state mirroring,
  // and this defaults to [] so nothing downstream ever sees `undefined`.
  const users = userlist?.data ?? EMPTY_ARRAY;

  // The backend already scopes /leave/getallleave to what this session's
  // user is allowed to see (admin: all, manager: their store, sales/
  // accounting: their own) — no client-side store filtering needed here,
  // unlike the mock-data advance requests below.
  // Deferred until the Leave tab is actually opened, so it doesn't fire on
  // every visit to this page regardless of which tab is active — the
  // tradeoff is the "Pending Leaves" stat/badge below read 0 until then.
  const { data: leaveData } = useGetAllLeaves({ enabled: activeTab === 'leave' });
  const leaves = leaveData?.leaves ?? EMPTY_ARRAY;
  const updateLeaveMutation = useUpdateLeave();

  const [advanceRequests, setAdvanceRequests] = useState(INITIAL_ADVANCE_REQUESTS);

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
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    userType: '',
    mobile: "",
    storeId: "",
    password: ''
  });

  const handleEditUser = useCallback((u) => {
    setSelectedUser(u);
    setFormData({ ...u, userId: u._id });
    setShowUpdateModal(true);
  }, []);

  const handleDeleteUserClick = useCallback((u) => {
    setSelectedUser(u);
    setShowDeleteModal(true);
  }, []);

  const handleActivateUserClick = useCallback((u) => {
    setSelectedUser(u);
    setShowActiveUserModal(true);
  }, []);

  const handleViewLeaveDetail = useCallback((leave) => {
    setSelectedItem(leave);
    setShowDetailModal(true);
  }, []);

  const handleAddUser = useCallback((e) => {
    e.preventDefault();
    if (formData.fullName && formData.username && formData.email) {
      addUserMutation.mutate(formData);
      setFormData({ fullName: '', username: '', email: '', userType: '',mobile: "", storeId: "", password: '' });
      setShowAddModal(false);
      toast.success('Sales person added successfully!');
    } else {
      toast.error('Please fill all required fields');
    }
  }, [formData, addUserMutation]);

  const handleUpdateUser = useCallback((e) => {
    e.preventDefault();
    if (formData.fullName && formData.username && formData.email) {
      updateUserMutation.mutate(formData, {
        onSuccess: () => {
          setShowUpdateModal(false);
          toast.success("Updated successfully");
        }
      });
      setFormData({ fullName: '', username: '', email: '', userType: '',mobile: "", storeId: "", password: '' });
    } else {
      toast.error('Please fill all required fields');
    }
  }, [formData, updateUserMutation]);

  const handleDeleteUser = useCallback((e) => {
    e.preventDefault();
    deleteUserMutation.mutate({userId: selectedUser._id, storeId: selectedUser.storeId}, {
      onSuccess: () => {
        setShowDeleteModal(false);
        toast.success("Deleted successfully");
      }
    });
  }, [deleteUserMutation, selectedUser]);

  const handleActiveUser = useCallback((e) => {
    e.preventDefault();
    activeUserMutation.mutate({userId: selectedUser._id}, {
      onSuccess: () => {
        setShowActiveUserModal(false);
        toast.success("User active successfully");
      }
    });
  }, [activeUserMutation, selectedUser]);

  const handleLeaveApproval = useCallback((id, status) => {
    updateLeaveMutation.mutate({ leaveId: id, status }, {
      onSuccess: () => {
        toast.success(`Leave application ${status.toLowerCase()} successfully!`);
      },
    });
  }, [updateLeaveMutation]);

  const handleAdvanceApproval = (id, status) => {
    setAdvanceRequests(advanceRequests.map(adv =>
      adv.id === id ? { ...adv, status } : adv
    ));
    toast.success(`Advance request ${status.toLowerCase()} successfully!`);
  };

  // Access-control filtering (who this user is allowed to see) stays here;
  // each tab owns its own search/pagination over the list it's handed.
  const accessScopedUsers = useMemo(() => users.filter(u =>
    user.userType === 'admin' || (user.storeId && u.store === `Store ${user.storeId}`) || u.store === 'All Stores'
  ), [users, user.userType, user.storeId]);

  const filteredAdvances = useMemo(() => advanceRequests.filter(adv =>
    user.userType === 'admin' || (user.storeId && adv.store === `Store ${user.storeId}`)
  ), [advanceRequests, user.userType, user.storeId]);

  // /leave/getallleave doesn't populate the employee — join against the
  // already-fetched user list instead of adding a backend round trip.
  const usersById = useMemo(() => new Map(users.map(u => [u._id, u])), [users]);

  const normalizedLeaves = useMemo(() => leaves.map(l => ({
    id: l.leave_id,
    employeeName: usersById.get(l.userId)?.fullName ?? 'Unknown',
    leaveType: l.leave_type,
    fromDate: formatDate(l.start_date),
    toDate: formatDate(l.end_date),
    days: l.number_of_days,
    reason: l.reason,
    status: l.status,
    appliedDate: formatDate(l.applied_date),
    store: l.store_id,
  })), [leaves, usersById]);

  const pendingLeaves = useMemo(() => normalizedLeaves.filter(l => l.status === 'Pending'), [normalizedLeaves]);
  const pendingAdvances = useMemo(() => filteredAdvances.filter(a => a.status === 'Pending'), [filteredAdvances]);
  const processedLeaves = useMemo(() => normalizedLeaves.filter(l => l.status !== 'Pending'), [normalizedLeaves]);
  const processedAdvances = useMemo(() => filteredAdvances.filter(a => a.status !== 'Pending'), [filteredAdvances]);

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

      {activeTab === 'team' && (
        <TeamMembersTab
          users={accessScopedUsers}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUserClick}
          onActivateUser={handleActivateUserClick}
        />
      )}

      {activeTab === 'leave' && (
        <LeaveApplicationsTab
          pendingLeaves={pendingLeaves}
          processedLeaves={processedLeaves}
          onApprove={handleLeaveApproval}
          onViewDetail={handleViewLeaveDetail}
        />
      )}

      {activeTab === 'advance' && (
        <AdvanceRequestsTab
          pendingAdvances={pendingAdvances}
          processedAdvances={processedAdvances}
          onApprove={handleAdvanceApproval}
        />
      )}

      {/* Add / Update User Modal */}
      {showAddModal && (
        <UserFormModal
          mode="add"
          formData={formData}
          setFormData={setFormData}
          stores={stores}
          onSubmit={handleAddUser}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {showUpdateModal && (
        <UserFormModal
          mode="edit"
          formData={formData}
          setFormData={setFormData}
          stores={stores}
          onSubmit={handleUpdateUser}
          onClose={() => setShowUpdateModal(false)}
        />
      )}

      {/* Delete / Activate confirmation */}
      {showDeleteModal && selectedUser && (
        <ConfirmModal
          title="Delete Sales Person"
          message={<>Are you sure you want to delete <span className="font-medium">{selectedUser.fullName}</span>?</>}
          confirmLabel="Delete"
          confirmClassName="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
          onConfirm={handleDeleteUser}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
      {showActiveUserModal && selectedUser && (
        <ConfirmModal
          title="Active User"
          message={<>Are you sure you want to active <span className="font-medium">{selectedUser.fullName}</span>?</>}
          confirmLabel="Active"
          confirmClassName="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
          onConfirm={handleActiveUser}
          onClose={() => setShowActiveUserModal(false)}
        />
      )}

      {showDetailModal && selectedItem && (
        <LeaveDetailModal
          leave={selectedItem}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
}
