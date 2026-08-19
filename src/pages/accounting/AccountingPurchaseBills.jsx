import { useMemo, useState } from 'react';
import { Plus, Search, Download, Eye, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useStoreContext } from '../../context/storeContext';
import { useGetAllStockGroup } from '../../hooks/useStockGroup';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/ui/Pagination';
import { useStockCategoryContext } from '../../context/stockcategoryContext';
import { useGetAllUnits } from '../../hooks/useUnit';
import { useAddPurchaseBill, useGetAllPurchaseBill } from '../../hooks/usePurchaseBill';
import { useGetAllProducts } from '../../hooks/useProduct';

const emptyItem = { brand: '', category: '', barcode_text: '', hsncode: '', quantity: 1, purchaseRate: 0, gst: 18, mrp: 0, disc: 0,offer_price: 0, unit: '' };

const initialFormData = {
    supplierName: '',      // display-only, not sent to backend
    supplierGSTIN: '',    // display-only, not sent to backend
    supplierId: '',
    billNumber: '',
    billDate: new Date().toISOString().split('T')[0],
    storeId: '',
    items: [{ ...emptyItem }]
};

export default function AccountingPurchaseBills() {
    const { stores } = useStoreContext();
    const { data: stockGroupData } = useGetAllStockGroup();
    const { stockCategory } = useStockCategoryContext();
    const { data:unitlist, isLoading:isUnitLoading } = useGetAllUnits(); 
    const units = unitlist?.units || []

    const stockGroup = stockGroupData?.data ?? [];

    const { data: purchaseBillsData, isLoading: billsLoading } = useGetAllPurchaseBill();
    console.log(purchaseBillsData)
    const bills = purchaseBillsData?.bills ?? [];

    const { mutate: addPurchaseBill, isPending: isSubmitting } = useAddPurchaseBill(); // swap isPending -> isLoading if on an older react-query

    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState(initialFormData);

    // ---- Existing-product search (bound into each item row) ----
    // Only one row's dropdown is "active" at a time, so we only need a single
    // useGetAllProducts call here (keeps this a top-level hook, not one per row).
    const [activeSearchIndex, setActiveSearchIndex] = useState(null);
    const [itemSearchTerm, setItemSearchTerm] = useState('');
    const { data: itemProductSearchData } = useGetAllProducts(itemSearchTerm);
    const itemSearchResults = itemSearchTerm ? (itemProductSearchData?.products || []) : [];

    const handleAddItem = () => {
        setFormData({ ...formData, items: [...formData.items, { ...emptyItem }] });
    };

    const handleRemoveItem = (index) => {
        setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
        if (activeSearchIndex === index) {
            setActiveSearchIndex(null);
            setItemSearchTerm('');
        }
    };

    const handleSupplierChange = (supplierId) => {
      const selectedBrand = stockGroup.find(sg => sg._id === supplierId);
      setFormData({
          ...formData,
          supplierId,
          supplierName: selectedBrand?.name || '',       // for display only
          supplierGSTIN: selectedBrand?.gstNumber || ''   // for display only
      });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, items: newItems });
    };

    // Opens/updates the search dropdown for a specific item row.
    const handleItemSearchChange = (index, value) => {
        setActiveSearchIndex(index);
        setItemSearchTerm(value);
    };

    // Binds a selected existing product's data straight into that item row's fields.
    // Doesn't touch quantity/purchaseRate since those are bill-specific, not product-specific.
    const handleSelectProduct = (index, product) => {
        const newItems = [...formData.items];
        newItems[index] = {
            ...newItems[index],
            brand: product.brand || newItems[index].brand,
            category: product.category || newItems[index].category,
            barcode_text: product.barcode_text || newItems[index].barcode_text,
            hsncode: product.hsncode || newItems[index].hsncode,
            unit: product.unit || newItems[index].unit,
            gst: product.gst ?? newItems[index].gst,
            mrp: product.mrp ?? newItems[index].mrp,
            disc: product.disc ?? newItems[index].disc,
            offer_price: product.offer_price ?? newItems[index].offer_price,
        };
        setFormData({ ...formData, items: newItems });
        setActiveSearchIndex(null);
        setItemSearchTerm('');
    };

    const calculateBillTotal = () => {
        let subtotal = 0, totalCGST = 0, totalSGST = 0;
        formData.items.forEach(item => {
            const taxableValue = (item.quantity || 0) * (item.purchaseRate || 0);
            const gstAmount = (taxableValue * (item.gst || 0)) / 100;
            subtotal += taxableValue;
            totalCGST += gstAmount / 2;
            totalSGST += gstAmount / 2;
        });
        return { subtotal, cgst: totalCGST, sgst: totalSGST, total: subtotal + totalCGST + totalSGST };
    };

    const billFormTotals = useMemo(calculateBillTotal, [formData.items]);

    const handleCreateBill = () => {
        const invalidItems = formData.items.filter(
            item => !item.barcode_text || !item.brand || !item.category || !item.unit || !item.mrp
        );
        if (!formData.supplierId || !formData.billNumber || !formData.storeId || invalidItems.length > 0) {
            toast.error('Please fill all required fields for supplier, store, and every item!');
            return;
        }

        const totals = calculateBillTotal();

        const payload = {
            billNumber: formData.billNumber,
            billDate: formData.billDate,
            supplierId: formData.supplierId,
            storeId: formData.storeId,
           items: formData.items.map(item => ({
                brand: item.brand,
                category: item.category,
                barcode_text: item.barcode_text,
                hsncode: item.hsncode,
                quantity: item.quantity,
                purchaseRate: item.purchaseRate,
                gst: item.gst,
                mrp: item.mrp,
                disc: item.disc,
                dict_amt: item.mrp * (item.disc / 100),
                offer_price: item.mrp - (item.mrp * (item.disc / 100)),
                unit: item.unit
            })),
            taxableValue: totals.subtotal,
            CGSTplusSGST: totals.cgst + totals.sgst,
            totalAmount: totals.total
        };

        addPurchaseBill(payload, {
            onSuccess: () => {
                toast.success(
                    <div>
                        <p className="font-bold">Purchase bill created!</p>
                        <p className="text-sm">✓ Inventory updated for the selected store</p>
                    </div>
                );
                setFormData(initialFormData);
                setShowAddModal(false);
            },
            onError: (err) => {
                toast.error(err?.response?.data?.message || 'Failed to create purchase bill');
            }
        });
    };

    const filteredBills = useMemo(() => bills.filter(bill =>
        bill.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.billId?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [bills, searchTerm]);

    // NOTE: this paginates client-side over whatever the server already returned for one page.
    // If getPagination limits server-side by default, this will hide bills beyond page 1.
    // const billsPagination = usePagination(filteredBills);

    const getStoreName = (storeId) => stores.find(s => s.storeId === storeId)?.name || storeId;

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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <div className="bg-blue-500 text-white p-2 rounded-lg">
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-blue-900 mb-1">Auto Inventory Update Feature</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Purchase bills automatically update inventory for the selected store</li>
                            <li>• New products are created automatically if the barcode doesn't exist yet</li>
                            <li>• Inventory quantities are instantly reflected in the system</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-gray-600 text-sm">Total Bills</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{bills.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
                    <p className="text-green-600 text-sm">Total Purchase Value</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">₹{bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0).toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 rounded-lg shadow p-4 border border-blue-200">
                    <p className="text-blue-600 text-sm">Items Purchased</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{bills.reduce((sum, b) => sum + b.items.reduce((s, i) => s + i.quantity, 0), 0)}</p>
                </div>
                <div className="bg-purple-50 rounded-lg shadow p-4 border border-purple-200">
                    <p className="text-purple-600 text-sm">Inventory Updated</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">{bills.length}</p>
                </div>
            </div>

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
                            {billsLoading && (
                                <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-500">Loading purchase bills...</td></tr>
                            )}
                            {/* {!billsLoading && billsPagination.paginatedItems.map(bill => ( */}
                            {filteredBills.map(bill => (
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
                                            <p className="font-medium text-gray-800">{bill.supplierId?.name}</p>
                                            <p className="text-xs text-gray-500">{bill.billNumber}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                            {getStoreName(bill.storeId)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center font-medium text-gray-800">
                                        {bill.items.reduce((sum, item) => sum + item.quantity, 0)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-green-600">₹{bill.totalAmount.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center justify-center gap-1">
                                            <CheckCircle size={12} />
                                            Inventory Updated
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
                {/* <Pagination
                    page={billsPagination.page}
                    totalPages={billsPagination.totalPages}
                    totalItems={billsPagination.totalItems}
                    pageSize={billsPagination.pageSize}
                    onPageChange={billsPagination.goToPage}
                /> */}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6">Add Purchase Bill with Pricing</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">Supplier / Brand</label>
    <select
        value={formData.supplierId}
        onChange={(e) => handleSupplierChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
    >
        <option value="">select supplier / brand</option>
        {stockGroup.map((sg) => (
            <option value={sg._id} key={sg._id}>{sg.name}</option>
        ))}
    </select>
</div>
<div>
    <label className="block text-sm font-medium text-gray-700 mb-2">Supplier GSTIN</label>
    <input
        type="text"
        value={formData.supplierGSTIN}
        readOnly
        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 outline-none"
        placeholder="Auto-filled from selected supplier"
    />
</div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Bill Number</label>
                                <input
                                    type="text"
                                    value={formData.billNumber}
                                    onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                    placeholder="Supplier's bill number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Bill Date</label>
                                <input
                                    type="date"
                                    value={formData.billDate}
                                    onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Store (Inventory will be updated here)</label>
                                <select
                                    value={formData.storeId}
                                    onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                >
                                    <option value="">select store</option>
                                    {stores.map((store) => (
                                        <option value={store.storeId} key={store.storeId}>{store.name}</option>
                                    ))}
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

                                        {/* Search existing product — selecting one binds its data into the fields below.
                                            If nothing matches, just fill the fields manually to add it as a new product. */}
                                        <div className="relative mb-3">
                                            <label className="block text-xs text-gray-600 mb-1">Search Existing Product (optional)</label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={activeSearchIndex === index ? itemSearchTerm : ''}
                                                    onChange={(e) => handleItemSearchChange(index, e.target.value)}
                                                    onFocus={() => setActiveSearchIndex(index)}
                                                    placeholder="Search by name, code, or scan barcode..."
                                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                                />
                                            </div>

                                            {activeSearchIndex === index && itemSearchTerm.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
                                                    {itemSearchResults.length > 0 ? (
                                                        itemSearchResults.map((product) => (
                                                            <div
                                                                key={product._id}
                                                                onClick={() => handleSelectProduct(index, product)}
                                                                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                            >
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <div className="font-medium">{product.sku_code}</div>
                                                                        <div className="text-sm text-gray-600">
                                                                            Code: {product.product_code || '-'} • Barcode: {product.barcode_text}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="font-medium text-indigo-600">₹{product.mrp || 0}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="p-3 text-sm text-gray-500">
                                                            No matching product found. Just fill in the fields below to add it as a new product.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-12 gap-3 mb-3">
                                            <div className="col-span-12 md:col-span-3">
                                                <label className="block text-xs text-gray-600 mb-1">Barcode / Product Text *</label>
                                                <input
                                                    type="text"
                                                    value={item.barcode_text}
                                                    onChange={(e) => handleItemChange(index, 'barcode_text', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    placeholder="Barcode text"
                                                />
                                            </div>
                                            <div className="col-span-6 md:col-span-2">
                                                <label className="block text-xs text-gray-600 mb-1">HSN Code</label>
                                                <input
                                                    type="text"
                                                    value={item.hsncode}
                                                    onChange={(e) => handleItemChange(index, 'hsncode', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    placeholder="HSN"
                                                />
                                            </div>
                                            <div className="col-span-6 md:col-span-2">
                                                <label className="block text-xs text-gray-600 mb-1">Stock Group *</label>
                                                <select
                                                    value={item.brand}
                                                    onChange={(e) => handleItemChange(index, 'brand', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                >
                                                    <option value="">select group</option>
                                                    {stockGroup.map((sg) => (
                                                        <option value={sg._id} key={sg._id}>{sg.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-span-6 md:col-span-2">
                                                <label className="block text-xs text-gray-600 mb-1">Stock Category *</label>
                                                <select
                                                    value={item.category}
                                                    onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                >
                                                    <option value="">select category</option>
                                                    {stockCategory.map((sc) => (
                                                        <option value={sc.categoryId} key={sc.categoryId}>{sc.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-span-6 md:col-span-2">
                                                <label className="block text-xs text-gray-600 mb-1">Unit *</label>
                                                <select
                                                    value={item.unit}
                                                    onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                >
                                                    <option value="">select unit</option>
                                                    {!isUnitLoading && (units || []).map((u) => (
                                                        <option value={u._id} key={u._id}>{u.name}</option>
                                                    ))}
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
                                                    value={item.gst}
                                                    onChange={(e) => handleItemChange(index, 'gst', parseFloat(e.target.value))}
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
                                                    <>
                                                        <label className="block text-xs text-gray-600 mb-1">&nbsp;</label>
                                                        <button
                                                            onClick={() => handleRemoveItem(index)}
                                                            className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                        >
                                                            Remove
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-12 gap-3 pt-3 border-t border-gray-300">
                                            <div className="col-span-12 md:col-span-4">
                                                <label className="block text-xs font-medium text-indigo-700 mb-1">MRP *</label>
                                                <input
                                                    type="number"
                                                    value={item.mrp}
                                                    onChange={(e) => handleItemChange(index, 'mrp', parseFloat(e.target.value))}
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
                                                    value={item.disc}
                                                    onChange={(e) => handleItemChange(index, 'disc', parseFloat(e.target.value))}
                                                    className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-purple-50"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div className="col-span-12 md:col-span-4">
                                                <label className="block text-xs font-medium text-green-700 mb-1">Final Selling Price</label>
                                                <input
                                                    type="number"
                                                    value={item.mrp - (item.mrp * (item.disc / 100))}
                                                    onChange={(e) => handleItemChange(index, 'offer_price', parseFloat(e.target.value))}
                                                    className="w-full px-3 py-2 border-2 border-green-300 rounded-lg bg-green-50 font-bold text-green-700"
                                                    placeholder="0"
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
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? 'Creating...' : 'Create Bill & Update Inventory'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}