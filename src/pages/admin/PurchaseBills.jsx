import { useMemo, useState } from 'react';
import { Plus, Search, Download, Eye, Calendar, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/ui/Pagination';
import { useStoreContext } from '../../context/storeContext';
import { useGetAllPurchaseBill } from '../../hooks/usePurchaseBill';
import { useGetAllStockGroup } from '../../hooks/useStockGroup';
import { useSyncPendingTally } from '../../hooks/useTally';
import { useStockCategoryContext } from '../../context/stockcategoryContext';
import { useGetAllUnits } from '../../hooks/useUnit';
import { useAddPurchaseBill } from '../../hooks/usePurchaseBill';
import { useGetAllProducts } from '../../hooks/useProduct';
import Modal, {
  modalInputClass,
  modalLabelClass,
  modalPrimaryBtnClass,
  modalSecondaryBtnClass,
} from '../../components/ui/Modal';

const emptyItem = {
  brand: '',
  category: '',
  barcode_text: '',
  hsncode: '',
  quantity: 1,
  purchaseRate: 0,
  gst: 18,
  mrp: 0,
  disc: 0,
  dict_amt: 0,
  offer_price: 0,
  discType: 'percent',
  unit: '',
};

const emptyForm = {
  supplierName: '',
  supplierGSTIN: '',
  supplierId: '',
  billNumber: '',
  billDate: new Date().toISOString().split('T')[0],
  storeId: '',
  items: [{ ...emptyItem }],
};

function roundUpMoney(value) {
  return Math.ceil(Number(value) || 0);
}

function applyItemDiscount(item) {
  const mrp = roundUpMoney(item.mrp);
  const discType = item.discType === 'value' ? 'value' : 'percent';

  if (discType === 'value') {
    const dict_amt = Math.min(roundUpMoney(item.dict_amt), mrp);
    const offer_price = Math.max(0, mrp - dict_amt);
    const disc = mrp > 0 ? Number(((dict_amt / mrp) * 100).toFixed(2)) : 0;
    return { ...item, mrp, discType, disc, dict_amt, offer_price };
  }

  const disc = Math.min(Math.max(Number(item.disc) || 0, 0), 100);
  const dict_amt = Math.min(roundUpMoney((mrp * disc) / 100), mrp);
  const offer_price = Math.max(0, mrp - dict_amt);
  return { ...item, mrp, discType, disc, dict_amt, offer_price };
}

export default function PurchaseBills() {
  const { stores } = useStoreContext();
  const { data: purchaseBillsData, isLoading: billsLoading } = useGetAllPurchaseBill();
  const bills = purchaseBillsData?.bills ?? [];
  const syncPendingTally = useSyncPendingTally();
  const { data: stockGroupData } = useGetAllStockGroup();
  const stockGroup = stockGroupData?.data ?? [];
  const { stockCategory } = useStockCategoryContext();
  const { data: unitList, isLoading: isUnitLoading } = useGetAllUnits();
  const units = unitList?.units || [];
  const { mutate: addPurchaseBill, isPending: isSubmitting } = useAddPurchaseBill();

  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingBill, setViewingBill] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [activeSearchIndex, setActiveSearchIndex] = useState(null);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const { data: itemProductSearchData } = useGetAllProducts(itemSearchTerm);
  const itemSearchResults = itemSearchTerm ? (itemProductSearchData?.products || []) : [];

  const openAddModal = () => {
    setFormData({
      ...emptyForm,
      billDate: new Date().toISOString().split('T')[0],
      items: [{ ...emptyItem }],
    });
    setActiveSearchIndex(null);
    setItemSearchTerm('');
    setShowAddModal(true);
  };

  const handleSupplierChange = (supplierId) => {
    const selectedSupplier = stockGroup.find((group) => group._id === supplierId);
    setFormData((prev) => ({
      ...prev,
      supplierId,
      supplierName: selectedSupplier?.name || '',
      supplierGSTIN: selectedSupplier?.gstNumber || '',
    }));
  };

  const handleAddItem = () => {
    setFormData((prev) => ({ ...prev, items: [...prev.items, { ...emptyItem }] }));
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    if (activeSearchIndex === index) {
      setActiveSearchIndex(null);
      setItemSearchTerm('');
    }
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const items = [...prev.items];
      let nextItem = { ...items[index], [field]: value };
      if (field === 'mrp' || field === 'disc' || field === 'dict_amt' || field === 'discType') {
        nextItem = applyItemDiscount(nextItem);
      }
      items[index] = nextItem;
      return { ...prev, items };
    });
  };

  const handleItemSearchChange = (index, value) => {
    setActiveSearchIndex(index);
    setItemSearchTerm(value);
  };

  const handleSelectProduct = (index, product) => {
    setFormData((prev) => {
      const items = [...prev.items];
      items[index] = applyItemDiscount({
        ...items[index],
        brand: product.brand || items[index].brand,
        category: product.category || items[index].category,
        barcode_text: product.barcode_text || items[index].barcode_text,
        hsncode: product.hsncode || items[index].hsncode,
        unit: product.unit || items[index].unit,
        gst: product.gst ?? items[index].gst,
        mrp: product.mrp ?? items[index].mrp,
        disc: product.disc ?? items[index].disc,
        dict_amt: product.dict_amt ?? items[index].dict_amt,
        offer_price: product.offer_price ?? items[index].offer_price,
        discType: 'percent',
      });
      return { ...prev, items };
    });
    setActiveSearchIndex(null);
    setItemSearchTerm('');
  };

  const billFormTotals = useMemo(() => {
    let subtotal = 0, totalCGST = 0, totalSGST = 0;
    formData.items.forEach(item => {
      const taxableValue = (item.quantity || 0) * (item.purchaseRate || 0);
      const gstAmount = (taxableValue * (item.gst || 0)) / 100;
      subtotal += taxableValue;
      totalCGST += gstAmount / 2;
      totalSGST += gstAmount / 2;
    });
    return { subtotal, cgst: totalCGST, sgst: totalSGST, total: subtotal + totalCGST + totalSGST };
  }, [formData.items]);

  const handleCreateBill = () => {
    const invalidItems = formData.items.filter(
      (item) => !item.barcode_text.trim() || !item.brand || !item.category || !item.hsncode.trim() || !item.unit || !item.mrp || Number(item.quantity) <= 0
    );
    if (!formData.supplierId || !formData.billNumber.trim() || !formData.storeId || invalidItems.length > 0) {
      toast.error('Please complete the supplier, bill, store, and required item details.');
      return;
    }

    const payload = {
      billNumber: formData.billNumber.trim(),
      billDate: formData.billDate,
      supplierId: formData.supplierId,
      storeId: formData.storeId,
      items: formData.items.map((item) => {
        const priced = applyItemDiscount(item);
        return {
          brand: priced.brand,
          category: priced.category,
          barcode_text: priced.barcode_text.trim(),
          hsncode: priced.hsncode.trim(),
          quantity: Number(priced.quantity),
          purchaseRate: Number(priced.purchaseRate) || 0,
          gst: Number(priced.gst) || 0,
          mrp: priced.mrp,
          disc: priced.disc,
          dict_amt: priced.dict_amt,
          offer_price: priced.offer_price,
          unit: priced.unit,
        };
      }),
      taxableValue: billFormTotals.subtotal,
      CGSTplusSGST: billFormTotals.cgst + billFormTotals.sgst,
      totalAmount: billFormTotals.total,
    };

    addPurchaseBill(payload, {
      onSuccess: () => {
        toast.success('Purchase bill created and inventory updated.');
        setFormData(emptyForm);
        setShowAddModal(false);
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || 'Failed to create purchase bill.');
      },
    });
  };

  const getStoreName = (storeId) => stores.find(s => s.storeId === storeId)?.name || storeId;

  const filteredBills = useMemo(() => bills.filter(bill => {
    const supplierName = bill.supplierId?.name || '';
    return supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.billId?.toLowerCase().includes(searchTerm.toLowerCase());
  }), [bills, searchTerm]);

  const billStats = useMemo(() => ({
    totalValue: bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
    totalGST: bills.reduce((sum, b) => sum + (b.CGSTplusSGST || 0), 0),
    itemsPurchased: bills.reduce((sum, b) => sum + (b.items || []).reduce((s, i) => s + (i.quantity || 0), 0), 0),
  }), [bills]);

  const billsPagination = usePagination(filteredBills);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Purchase Bills</h2>
          <p className="text-gray-600 mt-1">Manage GST purchase invoices</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => syncPendingTally.mutate({})}
            disabled={syncPendingTally.isPending}
            className="flex items-center gap-2 border border-gray-300 bg-white text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-50 transition-all shadow-sm disabled:opacity-60"
          >
            <RefreshCw size={20} className={syncPendingTally.isPending ? 'animate-spin' : ''} />
            {syncPendingTally.isPending ? 'Syncing Tally…' : 'Sync Pending to Tally'}
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg"
          >
            <Plus size={20} />
            Add Purchase Bill
          </button>
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
          <p className="text-2xl font-bold text-green-600 mt-1">₹{billStats.totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4 border border-blue-200">
          <p className="text-blue-600 text-sm">Total GST Input</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">₹{billStats.totalGST.toLocaleString()}</p>
        </div>
        <div className="bg-purple-50 rounded-lg shadow p-4 border border-purple-200">
          <p className="text-purple-600 text-sm">Items Purchased</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{billStats.itemsPurchased}</p>
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
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {billsLoading && (
                <tr><td colSpan={9} className="px-4 py-6 text-center text-gray-500">Loading purchase bills...</td></tr>
              )}
              {!billsLoading && billsPagination.paginatedItems.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-6 text-center text-gray-500">No purchase bills found.</td></tr>
              )}
              {billsPagination.paginatedItems.map(bill => (
                <tr key={bill.billId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{bill.billId}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {new Date(bill.billDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800">{bill.supplierId?.name || '—'}</p>
                      <p className="text-xs text-gray-500">GSTIN: {bill.supplierId?.gstNumber || '—'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{bill.billNumber}</td>
                  <td className="px-4 py-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {getStoreName(bill.storeId)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">₹{(bill.taxableValue || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-gray-600">₹{(bill.CGSTplusSGST || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-bold text-green-600">₹{(bill.totalAmount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingBill(bill)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        className="p-2 hover:bg-purple-50 rounded-lg transition-colors text-purple-600"
                        title="Download"
                      >
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

      {viewingBill && (
        <Modal
          title={`Purchase Bill — ${viewingBill.billId}`}
          size="xl"
          onClose={() => setViewingBill(null)}
          footer={
            <button
              type="button"
              onClick={() => setViewingBill(null)}
              className={modalSecondaryBtnClass}
            >
              Close
            </button>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Bill Number</p>
              <p className="font-medium text-gray-800 text-sm">{viewingBill.billNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Bill Date</p>
              <p className="font-medium text-gray-800 text-sm">
                {new Date(viewingBill.billDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Store</p>
              <p className="font-medium text-gray-800 text-sm">{getStoreName(viewingBill.storeId)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Supplier</p>
              <p className="font-medium text-gray-800 text-sm">
                {viewingBill.supplierId?.name || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Supplier GSTIN</p>
              <p className="font-medium text-gray-800 text-sm">
                {viewingBill.supplierId?.gstNumber || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                <CheckCircle size={12} />
                Inventory Updated
              </span>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
            <div className="thin-scroll overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-left">HSN</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-right">Rate</th>
                    <th className="px-3 py-2 text-right">MRP</th>
                    <th className="px-3 py-2 text-center">GST%</th>
                    <th className="px-3 py-2 text-right">Disc%</th>
                    <th className="px-3 py-2 text-right">Offer</th>
                    <th className="px-3 py-2 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(viewingBill.items || []).map((item, idx) => {
                    const lineTotal = (item.quantity || 0) * (item.purchaseRate || 0);
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <p className="font-medium text-gray-800">{item.barcode_text || '—'}</p>
                          <p className="text-xs text-gray-500">{item.unit || ''}</p>
                        </td>
                        <td className="px-3 py-2 text-gray-600">{item.hsncode || '—'}</td>
                        <td className="px-3 py-2 text-center text-gray-800">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-gray-800">
                          ₹{Number(item.purchaseRate || 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-800">
                          ₹{Number(item.mrp || 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-center text-gray-600">{item.gst ?? 0}%</td>
                        <td className="px-3 py-2 text-right text-gray-600">{item.disc ?? 0}%</td>
                        <td className="px-3 py-2 text-right text-gray-800">
                          ₹{Number(item.offer_price || 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">
                          ₹{lineTotal.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3 space-y-1.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">Taxable Value:</span>
              <span className="font-bold text-gray-800">
                ₹{Number(viewingBill.taxableValue || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">CGST + SGST:</span>
              <span className="font-medium text-gray-800">
                ₹{Number(viewingBill.CGSTplusSGST || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-base font-bold text-gray-800">Total Amount:</span>
              <span className="text-xl font-bold text-amber-600">
                ₹{Number(viewingBill.totalAmount || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Bill Modal */}
      {showAddModal && (
        <Modal
          title="Add Purchase Bill with Pricing"
          onClose={() => setShowAddModal(false)}
          size="xl"
          footer={
            <>
              <button type="button" onClick={() => setShowAddModal(false)} className={modalSecondaryBtnClass}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateBill}
                disabled={isSubmitting}
                className={`${modalPrimaryBtnClass} disabled:opacity-60`}
              >
                {isSubmitting ? 'Creating…' : 'Create Purchase Bill'}
              </button>
            </>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mb-4">
            <div>
              <label className={modalLabelClass}>Supplier / Brand *</label>
              <select value={formData.supplierId} onChange={(e) => handleSupplierChange(e.target.value)} className={modalInputClass}>
                <option value="">Select supplier / brand</option>
                {stockGroup.map((supplier) => (
                  <option value={supplier._id} key={supplier._id}>{supplier.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={modalLabelClass}>Supplier GSTIN</label>
              <input
                type="text"
                value={formData.supplierGSTIN}
                readOnly
                className={`${modalInputClass} bg-gray-100`}
                placeholder="Auto-filled from selected brand"
              />
            </div>
            <div>
              <label className={modalLabelClass}>Bill Number</label>
              <input
                type="text"
                value={formData.billNumber}
                onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                className={modalInputClass}
                placeholder="Supplier's bill number"
              />
            </div>
            <div>
              <label className={modalLabelClass}>Bill Date</label>
              <input
                type="date"
                value={formData.billDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, billDate: e.target.value }))}
                className={modalInputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={modalLabelClass}>Store</label>
              <select
                value={formData.storeId}
                onChange={(e) => setFormData((prev) => ({ ...prev, storeId: e.target.value }))}
                className={modalInputClass}
              >
                <option value="">Select Store</option>
                {stores.map((store) => (
                  <option value={store.storeId} key={store.storeId}>{store.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Items</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-amber-600 hover:text-amber-700 text-sm font-medium"
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <div className="relative mb-3">
                    <label className="block text-xs text-gray-600 mb-1">Search Existing Product (optional)</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={activeSearchIndex === index ? itemSearchTerm : ''}
                        onChange={(e) => handleItemSearchChange(index, e.target.value)}
                        onFocus={() => setActiveSearchIndex(index)}
                        placeholder="Search by name, code, or barcode..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                      />
                    </div>
                    {activeSearchIndex === index && itemSearchTerm.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
                        {itemSearchResults.length > 0 ? itemSearchResults.map((product) => (
                          <button
                            key={product._id}
                            type="button"
                            onClick={() => handleSelectProduct(index, product)}
                            className="w-full text-left p-3 hover:bg-amber-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <span className="font-medium text-gray-800">{product.sku_code || product.product_name || product.barcode_text}</span>
                            <span className="block text-sm text-gray-600">Code: {product.product_code || '—'} · Barcode: {product.barcode_text || '—'}</span>
                          </button>
                        )) : (
                          <div className="p-3 text-sm text-gray-500">No matching product found. Enter the item details below.</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-12 gap-3 mb-3">
                    <div className="col-span-12 md:col-span-3">
                      <label className="block text-xs text-gray-600 mb-1">Barcode / Product Text *</label>
                      <input type="text" value={item.barcode_text} onChange={(e) => handleItemChange(index, 'barcode_text', e.target.value)} className={modalInputClass} placeholder="Barcode text" />
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">HSN Code *</label>
                      <input type="text" value={item.hsncode} onChange={(e) => handleItemChange(index, 'hsncode', e.target.value)} className={modalInputClass} placeholder="HSN" />
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Stock Group *</label>
                      <select value={item.brand} onChange={(e) => handleItemChange(index, 'brand', e.target.value)} className={modalInputClass}>
                        <option value="">Select group</option>
                        {stockGroup.map((group) => <option value={group._id} key={group._id}>{group.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Stock Category *</label>
                      <select value={item.category} onChange={(e) => handleItemChange(index, 'category', e.target.value)} className={modalInputClass}>
                        <option value="">Select category</option>
                        {stockCategory.map((category) => <option value={category.categoryId} key={category.categoryId}>{category.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Unit *</label>
                      <select value={item.unit} onChange={(e) => handleItemChange(index, 'unit', e.target.value)} className={modalInputClass}>
                        <option value="">Select unit</option>
                        {!isUnitLoading && units.map((unit) => <option value={unit._id} key={unit._id}>{unit.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-6 md:col-span-1">
                      <label className="block text-xs text-gray-600 mb-1">Qty *</label>
                      <input type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value, 10) || 0)} className={modalInputClass} />
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Purchase Rate *</label>
                      <input type="number" min="0" value={item.purchaseRate} onChange={(e) => handleItemChange(index, 'purchaseRate', parseFloat(e.target.value) || 0)} className={modalInputClass} placeholder="0" />
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">GST %</label>
                      <select value={item.gst} onChange={(e) => handleItemChange(index, 'gst', parseFloat(e.target.value))} className={modalInputClass}>
                        <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option><option value="28">28%</option>
                      </select>
                    </div>
                    <div className="col-span-12 sm:col-span-2">
                      {formData.items.length > 1 && (
                        <button type="button" onClick={() => handleRemoveItem(index)} className="w-full px-3 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm">
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-3 pt-3 border-t border-gray-300">
                    <div className="col-span-12 md:col-span-3">
                      <label className="block text-xs font-medium text-amber-700 mb-1">MRP *</label>
                      <input type="number" min="0" value={item.mrp} onChange={(e) => handleItemChange(index, 'mrp', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-amber-50" placeholder="0" />
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-xs font-medium text-purple-700 mb-1">Disc Type</label>
                      <select value={item.discType || 'percent'} onChange={(e) => handleItemChange(index, 'discType', e.target.value)} className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-purple-50">
                        <option value="percent">%</option><option value="value">Value (₹)</option>
                      </select>
                    </div>
                    <div className="col-span-6 md:col-span-3">
                      <label className="block text-xs font-medium text-purple-700 mb-1">{item.discType === 'value' ? 'Discount Value (₹)' : 'Discount %'}</label>
                      {item.discType === 'value' ? (
                        <input type="number" min="0" value={item.dict_amt ?? 0} onChange={(e) => handleItemChange(index, 'dict_amt', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-purple-50" placeholder="0" />
                      ) : (
                        <input type="number" min="0" max="100" value={item.disc ?? 0} onChange={(e) => handleItemChange(index, 'disc', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-purple-50" placeholder="0" />
                      )}
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <label className="block text-xs font-medium text-green-700 mb-1">Final Selling Price</label>
                      <input type="number" value={item.offer_price ?? 0} readOnly className="w-full px-3 py-2 border-2 border-green-300 rounded-lg bg-green-50 font-bold text-green-700" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3 space-y-1.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">Taxable Value:</span>
              <span className="font-bold text-gray-800">₹{billFormTotals.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">CGST + SGST:</span>
              <span className="font-medium text-gray-800">₹{(billFormTotals.cgst + billFormTotals.sgst).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-base font-bold text-gray-800">Total Amount:</span>
              <span className="text-xl font-bold text-amber-600">₹{billFormTotals.total.toLocaleString()}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}