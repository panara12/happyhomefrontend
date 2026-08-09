import { useState } from 'react';
import { Plus, Search, Download, Eye, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function PurchaseBills() {
  const [bills, setBills] = useState([
    {
      id: 'PB-001',
      date: '2026-04-15',
      supplier: 'Samsung India',
      supplierGSTIN: '29AABCS1234F1Z5',
      billNumber: 'SI-2024-001',
      store: 'Store 1',
      items: [
        { product: 'LED TV 43"', hsn: '8528', quantity: 10, rate: 20000, taxableValue: 200000, cgst: 14000, sgst: 14000, igst: 0 }
      ],
      subtotal: 200000,
      cgst: 14000,
      sgst: 14000,
      igst: 0,
      total: 228000,
      paymentStatus: 'Paid'
    },
    {
      id: 'PB-002',
      date: '2026-04-18',
      supplier: 'LG Electronics',
      supplierGSTIN: '27AABCL1234G1Z6',
      billNumber: 'LG-2024-045',
      store: 'Store 2',
      items: [
        { product: 'Refrigerator 190L', hsn: '8418', quantity: 8, rate: 12000, taxableValue: 96000, cgst: 8640, sgst: 8640, igst: 0 }
      ],
      subtotal: 96000,
      cgst: 8640,
      sgst: 8640,
      igst: 0,
      total: 113280,
      paymentStatus: 'Pending'
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    supplier: '',
    supplierGSTIN: '',
    billNumber: '',
    date: new Date().toISOString().split('T')[0],
    store: 'Store 1',
    items: [{ product: '', hsn: '', quantity: 1, rate: 0, gstRate: 18 }]
  });

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: '', hsn: '', quantity: 1, rate: 0, gstRate: 18 }]
    });
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const calculateItemTotal = (item) => {
    const taxableValue = item.quantity * item.rate;
    const gstAmount = (taxableValue * item.gstRate) / 100;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;
    return { taxableValue, cgst, sgst, total: taxableValue + gstAmount };
  };

  const calculateBillTotal = () => {
    let subtotal = 0;
    let totalCGST = 0;
    let totalSGST = 0;

    formData.items.forEach(item => {
      const { taxableValue, cgst, sgst } = calculateItemTotal(item);
      subtotal += taxableValue;
      totalCGST += cgst;
      totalSGST += sgst;
    });

    return {
      subtotal,
      cgst: totalCGST,
      sgst: totalSGST,
      total: subtotal + totalCGST + totalSGST
    };
  };

  const handleCreateBill = () => {
    if (formData.supplier && formData.billNumber && formData.items.length > 0) {
      const totals = calculateBillTotal();
      const newBill = {
        id: `PB-${String(bills.length + 1).padStart(3, '0')}`,
        date: formData.date,
        supplier: formData.supplier,
        supplierGSTIN: formData.supplierGSTIN,
        billNumber: formData.billNumber,
        store: formData.store,
        items: formData.items.map(item => ({
          ...item,
          taxableValue: item.quantity * item.rate,
          cgst: ((item.quantity * item.rate * item.gstRate) / 100) / 2,
          sgst: ((item.quantity * item.rate * item.gstRate) / 100) / 2,
          igst: 0
        })),
        ...totals,
        igst: 0,
        paymentStatus: 'Pending'
      };
      setBills([newBill, ...bills]);
      setFormData({
        supplier: '',
        supplierGSTIN: '',
        billNumber: '',
        date: new Date().toISOString().split('T')[0],
        store: 'Store 1',
        items: [{ product: '', hsn: '', quantity: 1, rate: 0, gstRate: 18 }]
      });
      setShowAddModal(false);
      toast.success('Purchase bill created successfully!');
    }
  };

  const filteredBills = bills.filter(bill =>
    bill.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Purchase Bills</h2>
          <p className="text-gray-600 mt-1">Manage GST purchase invoices</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg"
        >
          <Plus size={20} />
          Add Purchase Bill
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Bills</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{bills.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
          <p className="text-green-600 text-sm">Total Purchase Value</p>
          <p className="text-2xl font-bold text-green-600 mt-1">₹{bills.reduce((sum, b) => sum + b.total, 0).toLocaleString()}</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4 border border-blue-200">
          <p className="text-blue-600 text-sm">Total GST Input</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">₹{bills.reduce((sum, b) => sum + b.cgst + b.sgst + b.igst, 0).toLocaleString()}</p>
        </div>
        <div className="bg-orange-50 rounded-lg shadow p-4 border border-orange-200">
          <p className="text-orange-600 text-sm">Pending Payments</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{bills.filter(b => b.paymentStatus === 'Pending').length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by supplier, bill number, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Bill ID</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Supplier</th>
                <th className="px-4 py-3 text-left">Bill Number</th>
                <th className="px-4 py-3 text-left">Store</th>
                <th className="px-4 py-3 text-right">Taxable Value</th>
                <th className="px-4 py-3 text-right">GST</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBills.map(bill => (
                <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{bill.id}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {bill.date}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800">{bill.supplier}</p>
                      <p className="text-xs text-gray-500">GSTIN: {bill.supplierGSTIN}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{bill.billNumber}</td>
                  <td className="px-4 py-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {bill.store}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">₹{bill.subtotal.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-gray-600">₹{(bill.cgst + bill.sgst + bill.igst).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold text-green-600">₹{bill.total.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      bill.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {bill.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600" title="View">
                        <Eye size={16} />
                      </button>
                      <button className="p-2 hover:bg-purple-50 rounded-lg transition-colors text-purple-600" title="Download">
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Bill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 my-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Add Purchase Bill</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="Enter supplier name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier GSTIN</label>
                <input
                  type="text"
                  value={formData.supplierGSTIN}
                  onChange={(e) => setFormData({...formData, supplierGSTIN: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="29AABCS1234F1Z5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bill Number</label>
                <input
                  type="text"
                  value={formData.billNumber}
                  onChange={(e) => setFormData({...formData, billNumber: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="Supplier's bill number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bill Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Store</label>
                <select
                  value={formData.store}
                  onChange={(e) => setFormData({...formData, store: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                >
                  <option value="Store 1">Store 1</option>
                  <option value="Store 2">Store 2</option>
                  <option value="Store 3">Store 3</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">Items</label>
                <button
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-amber-600 hover:text-amber-700 text-sm font-medium"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 bg-gray-50 rounded-lg">
                    <div className="col-span-3">
                      <label className="block text-xs text-gray-600 mb-1">Product</label>
                      <input
                        type="text"
                        value={item.product}
                        onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        placeholder="Product name"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">HSN Code</label>
                      <input
                        type="text"
                        value={item.hsn}
                        onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        placeholder="HSN"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs text-gray-600 mb-1">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Rate</label>
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">GST %</label>
                      <select
                        value={item.gstRate}
                        onChange={(e) => handleItemChange(index, 'gstRate', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      {formData.items.length > 1 && (
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Taxable Value:</span>
                <span className="font-bold text-gray-800">₹{calculateBillTotal().subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">CGST:</span>
                <span className="font-medium text-gray-800">₹{calculateBillTotal().cgst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">SGST:</span>
                <span className="font-medium text-gray-800">₹{calculateBillTotal().sgst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-xl font-bold text-gray-800">Total Amount:</span>
                <span className="text-2xl font-bold text-amber-600">₹{calculateBillTotal().total.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBill}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all"
              >
                Create Purchase Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}