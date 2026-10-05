import { useMemo, useState } from 'react';
import { Plus, Search, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/ui/Pagination';
import Modal, { modalInputClass, modalLabelClass, modalPrimaryBtnClass, modalSecondaryBtnClass } from '../../components/ui/Modal';
import { useStoreContext } from '../../context/storeContext';
import { useCreateDistributerReturn, useGetDistributerReturns, useSearchPurchaseBills } from '../../hooks/useDistributerReturn';

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = () => ({ billId: '', billNumber: '', supplierName: '', supplierGSTIN: '', returnDate: today(), reason: '', items: [] });

export default function DistributorReturns() {
  const { stores } = useStoreContext();
  const returnsQuery = useGetDistributerReturns();
  const createReturn = useCreateDistributerReturn();
  const [returnsSearch, setReturnsSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [storeId, setStoreId] = useState('');
  const [billText, setBillText] = useState('');
  const [billMenuOpen, setBillMenuOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const billQuery = useSearchPurchaseBills(billText, storeId);
  const returns = returnsQuery.data?.distributerReturns || [];
  const suggestions = billQuery.data?.bills || [];

  const selectBill = (bill) => {
    setForm({
      billId: bill._id, billNumber: bill.billNumber, supplierName: bill.supplierName || '', supplierGSTIN: bill.supplierGSTIN || '',
      returnDate: form.returnDate || today(), reason: form.reason,
      items: (bill.items || []).map(item => ({ productId: item.product_sr_no?._id || item.product_sr_no, productName: item.barcode_text, brand: item.brand?.name || '', category: item.category || '', unit: item.unitName || item.unit || '', hsn: item.hsncode || '', mrp: Number(item.mrp || 0), purchasedQuantity: Number(item.quantity || 0), quantity: Number(item.quantity || 0), rate: Number(item.purchaseRate || 0), gst: Number(item.gst ?? 18) }))
    });
    setBillText(bill.billNumber);
    setBillMenuOpen(false);
  };
  const updateItem = (index, field, value) => setForm(previous => ({ ...previous, items: previous.items.map((item, i) => i === index ? { ...item, [field]: value } : item) }));
  const itemAmount = item => Number(item.quantity || 0) * Number(item.rate || 0) * (1 + Number(item.gst || 0) / 100);
  const totalAmount = form.items.reduce((sum, item) => sum + itemAmount(item), 0);
  const chosenStore = stores.find(store => store.storeId === storeId);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const items = form.items.filter(item => Number(item.quantity) > 0);
    if (!form.billId || !items.length || !form.reason.trim()) { toast.error('Choose a bill, enter a reason, and include at least one item with a quantity.'); return; }
    if (items.some(item => Number(item.quantity) > item.purchasedQuantity || Number(item.rate) < 0 || Number(item.gst) < 0)) { toast.error('Return quantities cannot exceed the bill quantity. Check item rates and GST.'); return; }
    try {
      await createReturn.mutateAsync({ billId: form.billId, returnDate: form.returnDate, reason: form.reason, items: items.map(({ productId, quantity, rate, gst }) => ({ productId, quantity: Number(quantity), rate: Number(rate), gst: Number(gst) })) });
      setShowModal(false); setForm(emptyForm()); setBillText(''); setStoreId('');
    } catch { /* mutation displays the server error */ }
  };

  const filtered = useMemo(() => returns.filter(row => `${row.returnId} ${row.billNumber} ${row.supplierName}`.toLowerCase().includes(returnsSearch.toLowerCase())), [returns, returnsSearch]);
  const pagination = usePagination(filtered);
  const summary = { count: returns.length, amount: returns.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0) };

  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"><div><h1 className="text-2xl font-bold text-gray-900">Distributor Returns</h1><p className="text-sm text-gray-600 mt-1">Return items from a purchase bill and update store inventory.</p></div><button onClick={() => { setShowModal(true); setForm(emptyForm()); setBillText(''); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Plus size={20}/>New Return</button></div>
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3"><Package className="text-blue-600 mt-0.5" size={20}/><p className="text-sm text-blue-900">Creating a return deducts the returned quantities from the original bill’s store inventory.</p></div>
    <div className="grid grid-cols-2 gap-4"><div className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-600">Total Returns</p><p className="text-2xl font-bold mt-1">{summary.count}</p></div><div className="bg-purple-50 rounded-lg shadow p-4"><p className="text-sm text-purple-800">Total Return Amount</p><p className="text-2xl font-bold text-purple-900 mt-1">₹{summary.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p></div></div>
    <div className="bg-white rounded-lg shadow p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/><input placeholder="Search return, distributor, or bill number..." value={returnsSearch} onChange={e => setReturnsSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"/></div></div>
    <div className="bg-white rounded-lg shadow overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr>{['Return #','Bill #','Distributor','Store','Date','Amount','Reason','Created By'].map(name => <th key={name} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">{name}</th>)}</tr></thead><tbody className="divide-y divide-gray-200">{pagination.paginatedItems.map(row => <tr key={row._id}><td className="px-4 py-3 text-sm font-medium">{row.returnId}</td><td className="px-4 py-3 text-sm">{row.billNumber}</td><td className="px-4 py-3 text-sm">{row.supplierName}<div className="text-xs text-gray-500">{row.supplierGSTIN}</div></td><td className="px-4 py-3 text-sm">{row.store || row.storeId}</td><td className="px-4 py-3 text-sm">{new Date(row.returnDate).toLocaleDateString()}</td><td className="px-4 py-3 text-sm">₹{Number(row.totalAmount).toFixed(2)}</td><td className="px-4 py-3 text-sm max-w-xs truncate">{row.reason}</td><td className="px-4 py-3 text-sm">{row.createdBy?.fullName || row.createdBy?.username || ''}</td></tr>)}{!pagination.paginatedItems.length && <tr><td colSpan="8" className="p-8 text-center text-gray-500">{returnsQuery.isLoading ? 'Loading returns…' : 'No distributor returns found.'}</td></tr>}</tbody></table></div><Pagination page={pagination.page} totalPages={pagination.totalPages} totalItems={pagination.totalItems} pageSize={pagination.pageSize} onPageChange={pagination.goToPage}/></div>
    {showModal && <Modal title="New Distributor Return" size="lg" onClose={() => setShowModal(false)} footer={<><button type="button" onClick={() => setShowModal(false)} className={modalSecondaryBtnClass}>Cancel</button><button type="submit" form="distributor-return-form" disabled={createReturn.isPending} className={`${modalPrimaryBtnClass} !bg-indigo-600 hover:!bg-indigo-700 !from-indigo-600 !to-indigo-600`}>{createReturn.isPending ? 'Creating…' : 'Create Return'}</button></>}>
      <form id="distributor-return-form" onSubmit={handleSubmit} className="space-y-4">
        <div><label className={modalLabelClass}>Store <span className="text-red-500">*</span></label><select value={storeId} onChange={e => { setStoreId(e.target.value); setForm(emptyForm()); setBillText(''); }} className={modalInputClass} required><option value="">Select store</option>{stores.map(store => <option key={store.storeId} value={store.storeId}>{store.name}</option>)}</select></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="relative"><label className={modalLabelClass}>Original Bill Number <span className="text-red-500">*</span></label><input value={billText} disabled={!storeId} onFocus={() => setBillMenuOpen(true)} onChange={e => { setBillText(e.target.value); setForm(previous => ({ ...previous, billId: '' })); setBillMenuOpen(true); }} placeholder="Start typing a purchase bill number" className={modalInputClass} required/><input type="hidden" value={form.billId}/>{billMenuOpen && storeId && billText && <div className="absolute z-20 w-full max-h-56 overflow-y-auto bg-white border rounded-lg shadow-lg">{suggestions.map(bill => <button type="button" key={bill._id} onClick={() => selectBill(bill)} className="block w-full text-left px-3 py-2 hover:bg-indigo-50"><span className="font-medium">{bill.billNumber}</span><span className="block text-xs text-gray-500">{bill.supplierName} · {new Date(bill.billDate).toLocaleDateString()}</span></button>)}{!billQuery.isLoading && !suggestions.length && <p className="p-3 text-sm text-gray-500">No bills found.</p>}</div>}</div>
          <div><label className={modalLabelClass}>Return Date <span className="text-red-500">*</span></label><input type="date" value={form.returnDate} onChange={e => setForm({ ...form, returnDate: e.target.value })} className={modalInputClass} required/></div>
          <div><label className={modalLabelClass}>Distributor Name <span className="text-red-500">*</span></label><input value={form.supplierName} readOnly className={modalInputClass} placeholder="Filled from purchase bill" required/></div><div><label className={modalLabelClass}>Distributor GSTIN</label><input value={form.supplierGSTIN} readOnly className={modalInputClass} placeholder="Filled from purchase bill"/></div>
        </div>
        <div><label className={modalLabelClass}>Reason for Return <span className="text-red-500">*</span></label><textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className={modalInputClass} rows={2} placeholder="e.g., Damaged goods, Excess stock, Quality issues" required/></div>
        {form.billId && <div><div className="flex items-center justify-between mb-2"><label className={modalLabelClass}>Return Items <span className="text-red-500">*</span></label><span className="text-xs text-gray-500">{chosenStore?.name || storeId}</span></div><div className="space-y-2">{form.items.map((item, index) => <div key={item.productId} className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded-lg items-center"><div className="col-span-12 md:col-span-4"><div className="font-medium text-sm">{item.productName}</div><div className="text-xs text-gray-500">HSN: {item.hsn} · Brand: {item.brand || '—'} · Category: {item.category || '—'} · Unit: {item.unit || '—'} · MRP: ₹{item.mrp.toFixed(2)} · Bill qty: {item.purchasedQuantity}</div></div><div className="col-span-4 md:col-span-2"><label className="text-xs text-gray-500">Qty</label><input type="number" min="0" max={item.purchasedQuantity} step="any" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} className="w-full px-2 py-1.5 text-sm border rounded"/></div><div className="col-span-4 md:col-span-2"><label className="text-xs text-gray-500">Rate</label><input type="number" min="0" step="any" value={item.rate} onChange={e => updateItem(index, 'rate', e.target.value)} className="w-full px-2 py-1.5 text-sm border rounded"/></div><div className="col-span-4 md:col-span-2"><label className="text-xs text-gray-500">GST %</label><input type="number" min="0" step="any" value={item.gst} onChange={e => updateItem(index, 'gst', e.target.value)} className="w-full px-2 py-1.5 text-sm border rounded"/></div><div className="col-span-10 md:col-span-1 text-sm font-medium">₹{itemAmount(item).toFixed(2)}</div><div className="col-span-2 md:col-span-1 text-right"><button type="button" onClick={() => setForm(previous => ({ ...previous, items: previous.items.filter((_, i) => i !== index) }))} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Remove item"><Trash2 size={16}/></button></div></div>)}</div></div>}
        <div className="flex justify-end"><div className="bg-indigo-50 rounded-lg p-3"><p className="text-sm text-indigo-800">Total Return Amount</p><p className="text-xl font-bold text-indigo-900">₹{totalAmount.toFixed(2)}</p></div></div>
      </form>
    </Modal>}
  </div>;
}
