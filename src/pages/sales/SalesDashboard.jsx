import { useState } from 'react';
import { FileText, Send, Plus, Calendar, UserCheck, LogOut } from 'lucide-react';
import { CustomerSearch } from './CustomerSearch';
import { ItemSearch } from './ItemSearch';
import { InvoiceItems } from './InvoiceItems';
import { PendingInvoices } from './PendingInvoices';
import { LeaveApplication } from './LeaveApplication';
import { LeaveRequests } from './LeaveRequests';
import logoImg from "../../assets/logo.jpg";
import { useSelector } from 'react-redux';
import { useLogout } from '../../hooks/useAuth';

export default function SalesmanDashboard() {
  const user = useSelector((state) => state.app.userInfo);
  const { mutate: logout } = useLogout();

  const [activeTab, setActiveTab] = useState('create');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [invoices, setInvoices] = useState(() => {
    const stored = localStorage.getItem('invoices');
    return stored ? JSON.parse(stored) : [];
  });
  const [leaveRequests, setLeaveRequests] = useState(() => {
    const stored = localStorage.getItem('leaveRequests');
    return stored ? JSON.parse(stored) : [];
  });

  const generateInvoiceNumber = () => {
    const prefix = 'INV';
    const timestamp = Date.now().toString().slice(-8);
    return `${prefix}${timestamp}`;
  };

  const handleAddItem = (item, quantity, price) => {
    const total = quantity * price;
    setInvoiceItems([...invoiceItems, { item, quantity, price, total }]);
  };

  const handleRemoveItem = (index) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index, quantity) => {
    const updated = [...invoiceItems];
    updated[index].quantity = quantity;
    updated[index].total = quantity * updated[index].price;
    setInvoiceItems(updated);
  };

  const handleLogout = () => {
    logout();
    setActiveTab('create');
  };

  const handleUpdatePrice = (index, price) => {
    const updated = [...invoiceItems];
    updated[index].price = price;
    updated[index].total = updated[index].quantity * price;
    setInvoiceItems(updated);
  };

  const handleSendForApproval = () => {
    if (!selectedCustomer || invoiceItems.length === 0 || !user) {
      alert('Please select a customer and add items to the invoice.');
      return;
    }

    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    const newInvoice = {
      id: Date.now().toString(),
      invoiceNumber: generateInvoiceNumber(),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      items: invoiceItems,
      subtotal,
      tax,
      total,
      status: 'pending',
      createdAt: new Date().toISOString(),
      createdBy: user.fullName || user.name
    };

    const updatedInvoices = [...invoices, newInvoice];
    setInvoices(updatedInvoices);
    localStorage.setItem('invoices', JSON.stringify(updatedInvoices));

    setSelectedCustomer(null);
    setInvoiceItems([]);

    alert(`Invoice #${newInvoice.invoiceNumber} sent for approval!`);
  };

  const handleApproveInvoice = (invoiceId) => {
    const updatedInvoices = invoices.map(inv =>
      inv.id === invoiceId ? { ...inv, status: 'approved' } : inv
    );
    setInvoices(updatedInvoices);
    localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
  };

  const handleRejectInvoice = (invoiceId) => {
    const updatedInvoices = invoices.map(inv =>
      inv.id === invoiceId ? { ...inv, status: 'rejected' } : inv
    );
    setInvoices(updatedInvoices);
    localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
  };

  const handleSubmitLeave = (leave) => {
    const newLeave = {
      ...leave,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const updatedRequests = [...leaveRequests, newLeave];
    setLeaveRequests(updatedRequests);
    localStorage.setItem('leaveRequests', JSON.stringify(updatedRequests));
    alert('Leave request submitted successfully!');
  };

  const handleApproveLeave = (requestId) => {
    const updatedRequests = leaveRequests.map(req =>
      req.id === requestId
        ? { ...req, status: 'approved', approvedBy: user?.fullName || user?.name, approvedAt: new Date().toISOString() }
        : req
    );
    setLeaveRequests(updatedRequests);
    localStorage.setItem('leaveRequests', JSON.stringify(updatedRequests));
  };

  const handleRejectLeave = (requestId) => {
    const updatedRequests = leaveRequests.map(req =>
      req.id === requestId
        ? { ...req, status: 'rejected', approvedBy: user?.fullName || user?.name, approvedAt: new Date().toISOString() }
        : req
    );
    setLeaveRequests(updatedRequests);
    localStorage.setItem('leaveRequests', JSON.stringify(updatedRequests));
  };

  const handleNewInvoice = () => {
    setSelectedCustomer(null);
    setInvoiceItems([]);
    setActiveTab('create');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Happy Home" className="h-12 w-12 object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Happy Home</h1>
                <p className="text-sm text-gray-600">Sales Invoice System</p>
              </div>
            </div>
            {user && (
              <div className="text-right">
                <div className="text-sm text-gray-600">Salesman</div>
                <div className="font-medium">{user.fullName || user.name}</div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
              
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'create'
                  ? 'border-amber-600 text-amber-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-5 h-5" />
              Create Invoice
            </button>
            <button
              onClick={() => setActiveTab('leave')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'leave'
                  ? 'border-amber-600 text-amber-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-5 h-5" />
              Leave Requests
            </button>
            <button
              onClick={() => setActiveTab('manager')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'manager'
                  ? 'border-amber-600 text-amber-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserCheck className="w-5 h-5" />
              Approvals
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'create' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Create New Invoice</h2>
              {invoiceItems.length > 0 && (
                <button
                  onClick={handleNewInvoice}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Invoice
                </button>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-medium mb-4">Customer Information</h3>
              <CustomerSearch
                onSelectCustomer={setSelectedCustomer}
                selectedCustomer={selectedCustomer}
              />
            </div>

            {selectedCustomer && (
              <>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="font-medium mb-4">Add Items</h3>
                  <ItemSearch onAddItem={handleAddItem} />
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="font-medium mb-4">Invoice Items</h3>
                  <InvoiceItems
                    items={invoiceItems}
                    onRemoveItem={handleRemoveItem}
                    onUpdateQuantity={handleUpdateQuantity}
                    onUpdatePrice={handleUpdatePrice}
                  />

                  {invoiceItems.length > 0 && (
                    <button
                      onClick={handleSendForApproval}
                      className="mt-6 w-full px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2 text-lg font-medium"
                    >
                      <Send className="w-5 h-5" />
                      Send for Manager Approval
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'leave' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>

            <LeaveApplication
              employeeName={user?.fullName || user?.name}
              onSubmit={handleSubmitLeave}
            />

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-medium mb-4">My Leave Requests</h3>
              <LeaveRequests
                requests={leaveRequests}
                currentUser={user?.fullName || user?.name}
              />
            </div>
          </div>
        )}

        {activeTab === 'manager' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Approvals Dashboard</h2>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-medium text-lg mb-4">Pending Invoice Approvals</h3>
              <PendingInvoices
                invoices={invoices.filter(inv => inv.status === 'pending')}
                onApprove={handleApproveInvoice}
                onReject={handleRejectInvoice}
                showActions={true}
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-medium text-lg mb-4">Pending Leave Requests</h3>
              <LeaveRequests
                requests={leaveRequests.filter(req => req.status === 'pending')}
                onApprove={handleApproveLeave}
                onReject={handleRejectLeave}
                showActions={true}
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-medium text-lg mb-4">All Invoices</h3>
              <PendingInvoices invoices={invoices} />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-medium text-lg mb-4">All Leave Requests</h3>
              <LeaveRequests requests={leaveRequests} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}