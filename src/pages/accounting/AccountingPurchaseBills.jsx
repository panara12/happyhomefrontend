import { useCallback, useMemo, useState } from 'react';
import { Plus, Search, Download, Eye, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useStoreContext } from '../../context/storeContext';
import { useGetAllStockGroup } from '../../hooks/useStockGroup';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/ui/Pagination';
import { useStockCategoryContext } from '../../context/stockcategoryContext';

export default function AccountingPurchaseBills() {
  const {stores} = useStoreContext()
  const {data:stockGroupData} = useGetAllStockGroup()
  const {stockCategory, stockCategoryLoading} = useStockCategoryContext()
  // Derive directly from the query — no useEffect/local-state mirroring,
  // and this defaults to [] so nothing downstream ever sees `undefined`.
  const stockGroup = stockGroupData?.data ?? [];
  const [bills, setBills] = useState([
    {
      id: 'PB-001',
      date: '2026-04-15',
      supplier: 'Samsung India',
      supplierGSTIN: '29AABCS1234F1Z5',
      billNumber: 'SI-2024-001',
      store: 'Store 1',
      items: [
        {
          product: 'LED TV 43"',
          hsn: '8528',
          quantity: 10,
          purchaseRate: 20000,
          salesPrice: 27000,
          discount: 5,
          finalSellingPrice: 25650,
          taxableValue: 200000,
          cgst: 14000,
          sgst: 14000
        }
      ],
      subtotal: 200000,
      cgst: 14000,
      sgst: 14000,
      total: 228000,
      inventoryUpdated: true
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
    items: [{ product: '', hsn: '', quantity: 1, purchaseRate: 0, salesPrice: 0, discount: 0, gstRate: 18 }]
  });

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: '', hsn: '', quantity: 1, purchaseRate: 0, salesPrice: 0, discount: 0, gstRate: 18 }]
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

    // Auto-calculate final selling price when sales price or discount changes
    if (field === 'salesPrice' || field === 'discount') {
      const salesPrice = field === 'salesPrice' ? parseFloat(value) : newItems[index].salesPrice;
      const discount = field === 'discount' ? parseFloat(value) : newItems[index].discount;
      const finalSellingPrice = salesPrice - (salesPrice * discount / 100);
      newItems[index].finalSellingPrice = finalSellingPrice;
    }

    setFormData({ ...formData, items: newItems });
  };

  const calculateBillTotal = useCallback(() => {
    let subtotal = 0;
    let totalCGST = 0;
    let totalSGST = 0;

    formData.items.forEach(item => {
      const taxableValue = item.quantity * item.purchaseRate;
      const gstAmount = (taxableValue * item.gstRate) / 100;
      subtotal += taxableValue;
      totalCGST += gstAmount / 2;
      totalSGST += gstAmount / 2;
    });

    return {
      subtotal,
      cgst: totalCGST,
      sgst: totalSGST,
      total: subtotal + totalCGST + totalSGST
    };
  }, [formData.items]);

  // Recomputed once per render instead of once per each of the 3 JSX reads below
  const billFormTotals = useMemo(() => calculateBillTotal(), [calculateBillTotal]);

  const handleCreateBill = () => {
    if (formData.supplier && formData.billNumber && formData.items.length > 0) {
      // Validate all items have required pricing fields
      const invalidItems = formData.items.filter(item =>
        !item.product || !item.salesPrice || item.salesPrice <= 0
      );

      if (invalidItems.length > 0) {
        toast.error('Please fill sales price for all items!');
        return;
      }

      const totals = calculateBillTotal();
      const newBill = {
        id: `PB-${String(bills.length + 1).padStart(3, '0')}`,
        date: formData.date,
        supplier: formData.supplier,
        supplierGSTIN: formData.supplierGSTIN,
        billNumber: formData.billNumber,
        store: formData.store,
        items: formData.items.map(item => {
          const finalSellingPrice = item.salesPrice - (item.salesPrice * item.discount / 100);
          return {
            ...item,
            finalSellingPrice,
            taxableValue: item.quantity * item.purchaseRate,
            cgst: ((item.quantity * item.purchaseRate * item.gstRate) / 100) / 2,
            sgst: ((item.quantity * item.purchaseRate * item.gstRate) / 100) / 2,
          };
        }),
        ...totals,
        inventoryUpdated: true
      };

      setBills([newBill, ...bills]);

      // Show success message with inventory update confirmation
      toast.success(
        <div>
          <p className="font-bold">Purchase bill created!</p>
          <p className="text-sm">✓ Inventory updated for {formData.store}</p>
          <p className="text-sm">✓ Pricing configured for all items</p>
        </div>
      );

      setFormData({
        supplier: '',
        supplierGSTIN: '',
        billNumber: '',
        date: new Date().toISOString().split('T')[0],
        store: 'Store 1',
        items: [{ product: '', hsn: '', quantity: 1, purchaseRate: 0, salesPrice: 0, discount: 0, gstRate: 18 }]
      });
      setShowAddModal(false);
    }
  };

  const filteredBills = useMemo(() => bills.filter(bill =>
    bill.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.id.toLowerCase().includes(searchTerm.toLowerCase())
  ), [bills, searchTerm]);

  const billsPagination = usePagination(filteredBills);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Purchase Bills</h2>
          <p className="text-gray-600 mt-1">Create bills with auto inventory & pricing update</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
        >
          <Plus size={20} />
          Add Purchase Bill
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-500 text-white p-2 rounded-lg">
            <CheckCircle size={20} />
          </div>
          <div>
            <h3 className="font-bold text-blue-900 mb-1">Auto Inventory Update Feature</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Purchase bills automatically update inventory for the selected store</li>
              <li>• Set sales price, discount %, and final selling price for each item</li>
              <li>• Inventory quantities are instantly reflected in the system</li>
            </ul>
          </div>
        </div>
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
          <p className="text-blue-600 text-sm">Items Purchased</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{bills.reduce((sum, b) => sum + b.items.reduce((s, i) => s + i.quantity, 0), 0)}</p>
        </div>
        <div className="bg-purple-50 rounded-lg shadow p-4 border border-purple-200">
          <p className="text-purple-600 text-sm">Inventory Updated</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{bills.filter(b => b.inventoryUpdated).length}</p>
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
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Bill ID</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Supplier</th>
                <th className="px-4 py-3 text-left">Store</th>
                <th className="px-4 py-3 text-center">Items</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {billsPagination.paginatedItems.map(bill => (
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
                      <p className="text-xs text-gray-500">{bill.billNumber}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {bill.store}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-gray-800">
                    {bill.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-green-600">₹{bill.total.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    {bill.inventoryUpdated && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center justify-center gap-1">
                        <CheckCircle size={12} />
                        Inventory Updated
                      </span>
                    )}
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
        <Pagination
          page={billsPagination.page}
          totalPages={billsPagination.totalPages}
          totalItems={billsPagination.totalItems}
          pageSize={billsPagination.pageSize}
          onPageChange={billsPagination.goToPage}
        />
      </div>

      {/* Add Bill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Add Purchase Bill with Pricing</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Enter supplier name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier GSTIN</label>
                <input
                  type="text"
                  value={formData.supplierGSTIN}
                  onChange={(e) => setFormData({...formData, supplierGSTIN: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="29AABCS1234F1Z5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bill Number</label>
                <input
                  type="text"
                  value={formData.billNumber}
                  onChange={(e) => setFormData({...formData, billNumber: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Supplier's bill number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bill Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Store (Inventory will be updated here)</label>
                <select
                  value={formData.store}
                  onChange={(e) => setFormData({...formData, store: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  <option value="">select store</option>
                  {
                    stores.map((store)=>{
                      return <option value={store.storeId} key={store.storeId}>{store.name}</option>
                    })
                  }
                </select>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">Items with Pricing</label>
                <button
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {formData.items.map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <div className="grid grid-cols-12 gap-3 mb-3">
                      <div className="col-span-12 md:col-span-3">
                        <label className="block text-xs text-gray-600 mb-1">Product Name *</label>
                        <input
                          type="text"
                          value={item.product}
                          onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="Product name"
                        />
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <label className="block text-xs text-gray-600 mb-1">HSN Code</label>
                        <input
                          type="text"
                          value={item.hsn}
                          onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="HSN"
                        />
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <label className="block text-xs text-gray-600 mb-1">Stock Group</label>
                        <select 
                        onChange={(e) => setFormData({...formData, stockgroup: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                          <option value="">select group</option>
                          {
                            stockGroup.map((sg)=>{
                              return <option value={sg._id} key={sg._id}>{sg.name}</option>
                            })
                          }
                        </select>
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <label className="block text-xs text-gray-600 mb-1">Stock Category</label>
                        <select 
                        onChange={(e) => setFormData({...formData, stockgroup: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                          <option value="">select category</option>
                          {
                            stockCategory.map((sc)=>{
                              return <option value={sc.categoryId} key={sc.categoryId}>{sc.name}</option>
                            })
                          }
                        </select>
                      </div>
                      <div className="col-span-6 md:col-span-1">
                        <label className="block text-xs text-gray-600 mb-1">Qty *</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <label className="block text-xs text-gray-600 mb-1">Purchase Rate *</label>
                        <input
                          type="number"
                          value={item.purchaseRate}
                          onChange={(e) => handleItemChange(index, 'purchaseRate', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="0"
                        />
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <label className="block text-xs text-gray-600 mb-1">GST %</label>
                        <select
                          value={item.gstRate}
                          onChange={(e) => handleItemChange(index, 'gstRate', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </div>
                      <div className="col-span-12 md:col-span-2">
                        {formData.items.length > 1 && (
                          <label className="block text-xs text-gray-600 mb-1">&nbsp;</label>
                        )}
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

                    {/* Pricing Section */}
                    <div className="grid grid-cols-12 gap-3 pt-3 border-t border-gray-300">
                      <div className="col-span-12 md:col-span-4">
                        <label className="block text-xs font-medium text-indigo-700 mb-1">Sales Price (MRP) *</label>
                        <input
                          type="number"
                          value={item.salesPrice}
                          onChange={(e) => handleItemChange(index, 'salesPrice', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-indigo-50"
                          placeholder="0"
                        />
                      </div>
                      <div className="col-span-12 md:col-span-4">
                        <label className="block text-xs font-medium text-purple-700 mb-1">Discount %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-purple-50"
                          placeholder="0"
                        />
                      </div>
                      <div className="col-span-12 md:col-span-4">
                        <label className="block text-xs font-medium text-green-700 mb-1">Final Selling Price</label>
                        <input
                          type="number"
                          value={item.salesPrice - (item.salesPrice * item.discount / 100) || 0}
                          readOnly
                          className="w-full px-3 py-2 border-2 border-green-300 rounded-lg bg-green-50 font-bold text-green-700"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Taxable Value:</span>
                <span className="font-bold text-gray-800">₹{billFormTotals.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">CGST + SGST:</span>
                <span className="font-medium text-gray-800">₹{(billFormTotals.cgst + billFormTotals.sgst).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-xl font-bold text-gray-800">Total Amount:</span>
                <span className="text-2xl font-bold text-indigo-600">₹{billFormTotals.total.toLocaleString()}</span>
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
                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
              >
                Create Bill & Update Inventory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}