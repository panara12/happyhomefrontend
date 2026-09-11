import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import AutocompleteInput from '../../components/ui/AutocompleteInput';
import Modal, {
  modalInputClass,
  modalLabelClass,
  modalSecondaryBtnClass,
  modalPrimaryBtnClass,
} from '../../components/ui/Modal';
import { useSearchCustomers } from '../../hooks/useCustomer';
import { useGetAllStores } from '../../hooks/useStore';
import { useGetAllProducts } from '../../hooks/useProduct';
import { useSubmitInvoice } from '../../hooks/useInvoice';

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export default function CreateInvoiceModal({ onClose }) {
  const user = useSelector((state) => state.app.userInfo);

  const [customerQuery, setCustomerQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [phone, setPhone] = useState('');

  const [storeQuery, setStoreQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState(null);

  const [items, setItems] = useState([{ productId: '', productQuery: '', quantity: 1, price: 0 }]);
  const [activeProductRow, setActiveProductRow] = useState(0);

  const { data: customerSearchData } = useSearchCustomers(customerQuery);
  const { data: storesData } = useGetAllStores();
  const activeProductQuery = items[activeProductRow]?.productQuery || '';
  const { data: productsData } = useGetAllProducts(activeProductQuery);
  const submitInvoiceMutation = useSubmitInvoice();

  const stores = storesData?.stores || [];
  const products = productsData?.products || [];

  useEffect(() => {
    if (user?.storeId && stores.length && !selectedStore) {
      const match = stores.find((s) => s.storeId === user.storeId);
      if (match) {
        setSelectedStore(match);
        setStoreQuery(match.name || match.storeId);
      }
    }
  }, [user?.storeId, stores, selectedStore]);

  const customerOptions = useMemo(() => {
    return (customerSearchData?.customers || []).map((c) => ({
      id: c._id,
      label: c.name,
      subLabel: `${c.phone || ''}${c.clientType ? ` • ${c.clientType}` : ''}`,
      raw: c,
    }));
  }, [customerSearchData]);

  const storeOptions = useMemo(() => {
    const q = storeQuery.trim().toLowerCase();
    return stores
      .filter((s) => {
        if (!q) return true;
        return (
          String(s.name || '').toLowerCase().includes(q) ||
          String(s.storeId || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 20)
      .map((s) => ({
        id: s.storeId || s._id,
        label: s.name || s.storeId,
        subLabel: s.storeId,
        raw: s,
      }));
  }, [stores, storeQuery]);

  const productOptions = useMemo(() => {
    return products.slice(0, 20).map((p) => ({
      id: p._id,
      label: p.sku_code || p.barcode_text,
      subLabel: `Code: ${p.product_code || '-'} • ₹${p.offer_price || p.mrp || 0}`,
      raw: p,
    }));
  }, [products]);

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0),
    [items]
  );

  const handleSelectCustomer = (opt) => {
    setSelectedCustomer(opt.raw);
    setCustomerQuery(opt.label);
    setPhone(opt.raw.phone || '');
  };

  const handleSelectStore = (opt) => {
    setSelectedStore(opt.raw);
    setStoreQuery(opt.label);
  };

  const handleSelectProduct = (index, opt) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        productId: opt.id,
        productQuery: opt.label,
        price: opt.raw?.offer_price || opt.raw?.mrp || 0,
      };
      return next;
    });
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: field === 'quantity' || field === 'price' ? Number(value) || 0 : value,
      };
      if (field === 'productQuery') {
        next[index].productId = '';
      }
      return next;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { productId: '', productQuery: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleCreate = () => {
    if (!selectedCustomer?._id) {
      toast.error('Please select a customer from the list');
      return;
    }
    if (!items.length || items.some((item) => !item.productId || item.quantity <= 0)) {
      toast.error('Add at least one product with quantity');
      return;
    }

    const lineItems = items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      total: Number((item.quantity * item.price).toFixed(2)),
    }));

    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const tax = Number((subtotal * 0.18).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    submitInvoiceMutation.mutate(
      {
        customerId: selectedCustomer._id,
        storeId: user?.storeId,
        summary: { subtotal, tax, total },
        items: lineItems,
      },
      {
        onSuccess: () => onClose?.(),
      }
    );
  };

  return (
    <Modal
      title="Create New Invoice"
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={modalSecondaryBtnClass}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={submitInvoiceMutation.isPending || !selectedCustomer}
            className={modalPrimaryBtnClass}
          >
            {submitInvoiceMutation.isPending ? 'Creating...' : 'Create Invoice'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mb-4">
        <AutocompleteInput
          label="Customer Name"
          required
          placeholder="Enter customer name"
          value={customerQuery}
          onChange={(val) => {
            setCustomerQuery(val);
            setSelectedCustomer(null);
          }}
          onSelect={handleSelectCustomer}
          options={customerOptions}
        />
        <div>
          <label className={modalLabelClass}>Phone Number *</label>
          <input
            type="text"
            value={phone}
            readOnly
            placeholder="+91 XXXXX XXXXX"
            className={`${modalInputClass} bg-gray-50`}
          />
        </div>
        <div className="sm:col-span-2">
          <AutocompleteInput
            label="Store"
            placeholder="Search store..."
            value={storeQuery}
            onChange={(val) => {
              setStoreQuery(val);
              setSelectedStore(null);
            }}
            onSelect={handleSelectStore}
            options={storeOptions}
          />
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-800 text-sm">Items *</h4>
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
            <div key={index} className="bg-gray-50 rounded-lg p-3 grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
              <div className="md:col-span-6">
                <AutocompleteInput
                  label="Product"
                  placeholder="Select Product"
                  value={item.productQuery}
                  onFocus={() => setActiveProductRow(index)}
                  onChange={(val) => {
                    setActiveProductRow(index);
                    handleItemChange(index, 'productQuery', val);
                  }}
                  onSelect={(opt) => handleSelectProduct(index, opt)}
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
        <span className="text-gray-800 font-semibold">Total Amount:</span>
        <span className="text-2xl font-bold text-amber-600">{formatMoney(totalAmount)}</span>
      </div>
    </Modal>
  );
}
