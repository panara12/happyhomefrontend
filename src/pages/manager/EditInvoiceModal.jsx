import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useGetAllProducts } from '../../hooks/useProduct';
import Modal, {
  modalInputClass,
  modalLabelClass,
  modalSecondaryBtnClass,
  modalPrimaryBtnClass,
} from '../../components/ui/Modal';

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export default function EditInvoiceModal({ invoice, onClose, onSave, isSaving }) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState([]);

  const { data: productsData } = useGetAllProducts('');
  const products = productsData?.products || [];

  useEffect(() => {
    if (!invoice) return;
    setCustomerName(invoice.customerName || '');
    setCustomerPhone(invoice.customerPhone || '');
    setItems(
      (invoice.items || []).map((item) => ({
        productId: String(item.productId || ''),
        quantity: item.quantity || 1,
        price: item.price || 0,
      }))
    );
  }, [invoice]);

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0),
    [items]
  );

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      if (field === 'productId') {
        const product = products.find((p) => String(p._id) === String(value));
        next[index] = {
          ...next[index],
          productId: value,
          price: product?.offer_price || product?.mrp || next[index].price || 0,
        };
      } else {
        next[index] = {
          ...next[index],
          [field]: field === 'quantity' || field === 'price' ? Number(value) || 0 : value,
        };
      }
      return next;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { productId: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!customerName.trim() || !customerPhone.trim()) return;
    if (!items.length || items.some((item) => !item.productId || item.quantity <= 0)) return;

    onSave({
      id: invoice._id || invoice.id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        total: Number((item.quantity * item.price).toFixed(2)),
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mb-4">
        <div>
          <label className={modalLabelClass}>Customer Name</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className={modalInputClass}
          />
        </div>
        <div>
          <label className={modalLabelClass}>Phone Number</label>
          <input
            type="text"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className={modalInputClass}
          />
        </div>
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
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
              <div className="md:col-span-5">
                <label className="block text-xs text-gray-500 mb-1">Product</label>
                <select
                  value={item.productId}
                  onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                  className={modalInputClass}
                >
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.barcode_text || product.sku_code} ({product.product_code || product.sku_code})
                    </option>
                  ))}
                </select>
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
              <div className="md:col-span-3">
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

      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-gray-700 font-medium">Total Amount:</span>
        <span className="text-2xl font-bold text-amber-600">{formatMoney(totalAmount)}</span>
      </div>
    </Modal>
  );
}
