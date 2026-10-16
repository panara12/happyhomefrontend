import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useGetAllProducts } from '../../hooks/useProduct';
import AutocompleteInput from '../../components/ui/AutocompleteInput';
import { CustomerSearch } from '../sales/CustomerSearch';
import Modal, {
  modalInputClass,
  modalLabelClass,
  modalSecondaryBtnClass,
  modalPrimaryBtnClass,
} from '../../components/ui/Modal';

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export default function EditInvoiceModal({ invoice, onClose, onSave, isSaving }) {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [items, setItems] = useState([]);
  const [activeProductRow, setActiveProductRow] = useState(0);
  const [gstType, setGstType] = useState('PRODUCT');
  const [payments, setPayments] = useState({ cash: '0', upi: '0', debit: '0' });
  const [pointsRedeemed, setPointsRedeemed] = useState('0');
  const [cashDiscount, setCashDiscount] = useState('0');
  const [invoiceTotal, setInvoiceTotal] = useState('0');
  const [invoiceDate, setInvoiceDate] = useState('');

  const activeProductQuery = items[activeProductRow]?.productQuery || '';
  const { data: productsData } = useGetAllProducts(activeProductQuery);
  const products = productsData?.products || [];
  const productOptions = useMemo(() => products.slice(0, 20).map((product) => ({
    id: product._id,
    label: product.barcode_text || product.sku_code,
    subLabel: `Code: ${product.product_code || product.sku_code || '-'} • ₹${product.offer_price || product.mrp || 0}`,
    raw: product,
  })), [products]);

  useEffect(() => {
    if (!invoice) return;
    console.log('Edit invoice details:', invoice);
    setSelectedCustomer({
      _id: invoice.customerId,
      name: invoice.customerName || '',
      phone: invoice.customerPhone || '',
      loyaltyPoints: invoice.customerPoints || 0,
      clientType: invoice.customerType || 'Regular',
    });
    setGstType(invoice.gstType || 'PRODUCT');
    setPayments({
      cash: String(invoice.paymentBreakdown?.cash ?? 0),
      upi: String(invoice.paymentBreakdown?.upi ?? 0),
      debit: String(invoice.paymentBreakdown?.debit ?? 0),
    });
    setPointsRedeemed(String(invoice.loyaltyPointsRedeemed ?? 0));
    setCashDiscount(String(invoice.cashDiscountAmount ?? 0));
    setInvoiceTotal(String(invoice.total ?? 0));
    const sourceDate = invoice.invoiceDate || invoice.createdAt;
    setInvoiceDate(sourceDate ? new Date(sourceDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    setItems(
      (invoice.items || []).map((item) => ({
        productId: String(item.productId || ''),
        productQuery: item.productName || item.productCode || '',
        quantity: item.quantity || 1,
        price: item.price || 0,
        gst: Number(item.gst ?? 0),
      }))
    );
  }, [invoice]);

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0),
    [items]
  );
  const amountDue = roundMoney(Number(invoiceTotal) - Number(pointsRedeemed || 0) - Number(cashDiscount || 0));
  const amountPaid = roundMoney(Number(payments.cash || 0) + Number(payments.upi || 0) + Number(payments.debit || 0));
  const remainingAmount = roundMoney(amountDue - amountPaid);
  const isPaymentMatched = remainingAmount === 0;

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      if (field === 'productId') {
        const product = products.find((p) => String(p._id) === String(value));
        next[index] = {
          ...next[index],
          productId: value,
          price: product?.offer_price || product?.mrp || next[index].price || 0,
          gst: Number(product?.gst ?? 0),
        };
      } else {
        next[index] = {
          ...next[index],
          [field]: field === 'quantity' || field === 'price' ? Number(value) || 0 : value,
        };
        if (field === 'productQuery') next[index].productId = '';
      }
      return next;
    });
  };

  const handleSelectProduct = (index, option) => {
    const product = option.raw;
    setItems((previous) => previous.map((item, rowIndex) => rowIndex === index ? {
      ...item,
      productId: option.id,
      productQuery: option.label,
      price: product?.offer_price || product?.mrp || 0,
      gst: Number(product?.gst ?? 0),
    } : item));
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { productId: '', productQuery: '', quantity: 1, price: 0, gst: 0 }]);
    setActiveProductRow(items.length);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!selectedCustomer?._id || !selectedCustomer.name?.trim() || !selectedCustomer.phone?.trim()) return;
    if (!items.length || items.some((item) => !item.productId || item.quantity <= 0)) return;
    const finalTotal = Number(invoiceTotal);
    const redeemed = Number(pointsRedeemed);
    const discount = Number(cashDiscount);
    if (![finalTotal, redeemed, discount].every(Number.isFinite) || finalTotal < 0 || redeemed < 0 || discount < 0) return;

    onSave({
      id: invoice._id || invoice.id,
      customerId: selectedCustomer._id,
      gstType,
      paymentBreakdown: {
        cash: Number(payments.cash) || 0,
        upi: Number(payments.upi) || 0,
        debit: Number(payments.debit) || 0,
      },
      loyaltyPointsRedeemed: redeemed,
      cashDiscountAmount: discount,
      total: finalTotal,
      invoiceDate,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        total: Number((item.quantity * item.price).toFixed(2)),
        gst: Number(item.gst ?? 0),
      })),
    });
  };

  if (!invoice) return null;

  return (
    <Modal
      title={`Edit Invoice - ${invoice.invoiceNumber}`}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={modalSecondaryBtnClass}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className={modalPrimaryBtnClass}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </>
      }
    >
      <div className="mb-4">
        <label className={modalLabelClass}>Invoice Date</label>
        <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className={modalInputClass} />
      </div>
      <div className="mb-4">
        <CustomerSearch
          selectedCustomer={selectedCustomer}
          onSelectCustomer={(customer) => {
            if (customer && String(customer._id) !== String(selectedCustomer?._id)) {
              setPointsRedeemed('0');
            }
            setSelectedCustomer(customer);
          }}
          skipNewCustomerButtonOnTab
        />
      </div>
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <span className="text-sm text-amber-800">Customer loyalty points: </span>
        <strong className="text-sm text-amber-900">
          {Number(selectedCustomer?.loyaltyPoints || 0).toLocaleString('en-IN')} points
        </strong>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-800 text-sm">Items</h4>
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-1 text-amber-600 hover:text-amber-700 font-medium text-sm"
          >
            <Plus size={18} />
            Add Item
          </button>
        </div>

        <div className="space-y-3">
          {console.log('Rendering items:', products)}
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
              <div className="md:col-span-4">
                <AutocompleteInput
                  label="Product"
                  placeholder="Search product by name or code"
                  value={item.productQuery || ''}
                  onFocus={() => setActiveProductRow(index)}
                  onChange={(value) => {
                    setActiveProductRow(index);
                    handleItemChange(index, 'productQuery', value);
                  }}
                  onSelect={(option) => handleSelectProduct(index, option)}
                  options={activeProductRow === index ? productOptions : []}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Qty</label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  className={modalInputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.price}
                  onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                  className={modalInputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">GST %</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.gst}
                  onChange={(e) => handleItemChange(index, 'gst', Number(e.target.value) || 0)}
                  className={modalInputClass}
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  disabled={items.length === 1}
                  className="w-full flex items-center justify-center gap-1 px-3 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-40 text-sm"
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t pt-4 space-y-4">
        <div>
          <label className={modalLabelClass}>Invoice GST Type</label>
          <select value={gstType} onChange={(e) => setGstType(e.target.value)} className={modalInputClass}>
            <option value="PRODUCT">Use each product&apos;s GST type</option>
            <option value="IGST">IGST</option>
            <option value="CGST/SGST">CGST + SGST</option>
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            ['cash', 'Cash'],
            ['upi', 'UPI'],
            ['debit', 'Debit'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className={modalLabelClass}>{label} Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={payments[key]}
                onChange={(e) => setPayments((current) => ({ ...current, [key]: e.target.value }))}
                className={modalInputClass}
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={modalLabelClass}>Loyalty Points Redeemed</label>
            <input
              type="number"
              min="0"
              max={Number(selectedCustomer?.loyaltyPoints || 0) + (String(selectedCustomer?._id) === String(invoice.customerId) ? Number(invoice.loyaltyPointsRedeemed || 0) : 0)}
              step="1"
              value={pointsRedeemed}
              onChange={(e) => setPointsRedeemed(e.target.value)}
              className={modalInputClass}
            />
            <p className="mt-1 text-xs text-gray-500">
              Current balance: {Number(selectedCustomer?.loyaltyPoints || 0).toLocaleString('en-IN')} points
            </p>
          </div>
          <div>
            <label className={modalLabelClass}>Cash Discount</label>
            <input type="number" min="0" step="0.01" value={cashDiscount} onChange={(e) => setCashDiscount(e.target.value)} className={modalInputClass} />
          </div>
          <div>
            <label className={modalLabelClass}>Invoice Total</label>
            <input type="number" min="0" step="0.01" value={invoiceTotal} onChange={(e) => setInvoiceTotal(e.target.value)} className={modalInputClass} />
          </div>
        </div>
        <div className="flex items-center justify-between border-t pt-3 text-sm text-gray-600">
          <span>Items subtotal</span>
          <span className="font-semibold">{formatMoney(totalAmount)}</span>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Amount due after points and discount</span>
            <span className="font-semibold text-gray-800">{formatMoney(amountDue)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Payment amount entered</span>
            <span className="font-semibold text-gray-800">{formatMoney(amountPaid)}</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-2">
            <span className="text-sm font-medium text-gray-700">
              {remainingAmount > 0 ? 'Remaining amount' : remainingAmount < 0 ? 'Overpaid amount' : 'Remaining amount'}
            </span>
            <span className={`font-semibold ${isPaymentMatched ? 'text-green-700' : 'text-red-700'}`}>
              {formatMoney(Math.abs(remainingAmount))}
            </span>
          </div>
          <div className="flex justify-end">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isPaymentMatched ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {isPaymentMatched ? 'Amount Matched' : 'Amount Not Matched'}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
