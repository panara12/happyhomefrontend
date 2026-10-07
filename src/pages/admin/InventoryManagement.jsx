import { useEffect, useMemo, useRef, useState } from 'react';
import { Package, Search, Printer, Barcode, Minus, Plus, Edit2, Trash2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import Modal, {
  modalInputClass,
  modalLabelClass,
  modalPrimaryBtnClass,
  modalSecondaryBtnClass,
} from '../../components/ui/Modal';
import { useStoreContext } from '../../context/storeContext';
import { useGetAllStockGroup } from '../../hooks/useStockGroup';
import { useStockCategoryContext } from '../../context/stockcategoryContext';
import { useAddProduct, useDeleteProduct, useGetAllProducts, useUpdateProduct } from '../../hooks/useProduct';
import { useGetAllAccountingConst } from '../../hooks/useGetAllAccountStates';
import { useGetAllUnits } from '../../hooks/useUnit';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/ui/Pagination';
import { BARCODE_STICKER_SPEC, printBarcodeStickers } from '../../utils/printBarcodeStickers';

function buildEditForm(product, stores) {
  const qtyByStore = {};
  stores.forEach((store) => {
    qtyByStore[store.storeId] = product.qty?.find((q) => q.storeId === store.storeId)?.qty ?? 0;
  });
  return {
    id: product._id,
    barcode_text: product.barcode_text || '',
    alias: product.alias || '',
    brand: product.brand?._id || product.brand || '',
    category: product.category || '',
    unit: product.unit || '',
    hsncode: product.hsncode || '',
    mrp: product.mrp ?? 0,
    oldOfferPrice: product.offer_price ?? product.mrp ?? 0,
    offer_price: null,
    gst: product.gst ?? 0,
    discount: product.disc ?? 0,
    discType: 'percent',
    qtyByStore,
  };
}

function calculateProductPricing(mrpValue, discountValue, discountType) {
  const mrp = Math.max(0, Number(mrpValue) || 0);
  const discount = Math.max(0, Number(discountValue) || 0);
  const dict_amt = discountType === 'value'
    ? Math.min(discount, mrp)
    : Math.min((mrp * Math.min(discount, 100)) / 100, mrp);
  const disc = mrp > 0 ? Number(((dict_amt / mrp) * 100).toFixed(2)) : 0;

  return { disc, dict_amt, offer_price: Math.max(0, mrp - dict_amt) };
}

function FilterSelect({ label, value, onChange, options, isAccounting }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const listId = `filter-options-${label.toLowerCase()}`;
  const selectedOption = options.find((option) => option.value === value);
  const selectedOptionClass = isAccounting
    ? 'bg-purple-50 font-medium text-purple-800'
    : 'bg-amber-50 font-medium text-amber-800';
  const hoverClass = isAccounting ? 'hover:bg-purple-50' : 'hover:bg-amber-50';
  const focusRingClass = isAccounting ? 'focus:ring-purple-500' : 'focus:ring-amber-500';

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onKeyDown={(event) => {
        if (event.key === 'Escape') setIsOpen(false);
      }}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={listId}
        onClick={() => setIsOpen((open) => !open)}
        className={`flex w-full items-center justify-between gap-2 px-4 py-3 border border-gray-300 rounded-lg bg-white text-left focus:ring-2 ${focusRingClass} focus:border-transparent outline-none`}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown size={18} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div
          id={listId}
          role="menu"
          aria-label={`${label} options`}
          className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={option.value === value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`block w-full px-4 py-2 text-left text-sm ${hoverClass} ${
                option.value === value ? selectedOptionClass : 'text-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function InventoryManagement({ user }) {
  const role = user?.userType || user?.role || '';
  const storeId = user?.storeId;
  const { stores } = useStoreContext();
  const { data: stockGroupData } = useGetAllStockGroup();
  const stockGroup = stockGroupData?.data ?? [];
  const { stockCategory } = useStockCategoryContext();
  const { data: unitsData, isLoading: isUnitLoading } = useGetAllUnits();
  const units = unitsData?.units || unitsData?.data || [];

  const { data: productsData, isLoading: productsLoading } = useGetAllProducts('', { fetchAll: true });
  const { data: accounting } = useGetAllAccountingConst();
  const addProductMutation = useAddProduct();
  const deleteProductMutation = useDeleteProduct();
  const updateProductMutation = useUpdateProduct();
  const products = productsData?.products ?? [];

  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterBrand, setFilterBrand] = useState('All');
  const [barcodeQuantities, setBarcodeQuantities] = useState({});
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [barcodeStoreId, setBarcodeStoreId] = useState('');

  const editableStores = useMemo(() => {
    if (role === 'manager' && storeId) {
      return stores.filter((s) => String(s.storeId) === String(storeId));
    }
    return stores;
  }, [role, storeId, stores]);

  const getBrandName = (brandId) => stockGroup.find(sg => sg._id === brandId)?.name || '-';
  const getCategoryName = (categoryId) => stockCategory.find(sc => sc.categoryId === categoryId)?.name || categoryId || '-';
  const getStoreQty = (product, sid) => product.qty?.find(q => q.storeId === sid)?.qty || 0;
  const getTotalStock = (product) => (product.qty || []).reduce((sum, q) => sum + (q.qty || 0), 0);

  const openBarcodeModal = () => {
    setBarcodeSearch('');
    setBarcodeQuantities({});
    setBarcodeStoreId(storeId || '');
    setShowBarcodeModal(true);
  };

  const openAddProductModal = () => {
    setNewProduct({
      barcode_text: '',
      alias: '',
      brand: '',
      category: '',
      unit: '',
      hsncode: '',
      mrp: '',
      gst: '0',
      discount: '0',
      discType: 'percent',
      offer_price: null,
      quantity: '0',
      storeId: role === 'admin' ? '' : (storeId || ''),
    });
    setShowAddProductModal(true);
  };

  const closeAddProductModal = () => {
    setShowAddProductModal(false);
    setNewProduct(null);
  };

  const handleCreateProduct = () => {
    if (!newProduct) return;
    const targetStoreId = role === 'admin' ? newProduct.storeId : storeId;
    const mrp = Number(newProduct.mrp);
    if (
      !newProduct.barcode_text.trim() ||
      !newProduct.brand ||
      !newProduct.category ||
      !newProduct.unit ||
      !targetStoreId ||
      newProduct.mrp === '' ||
      !Number.isFinite(mrp) ||
      mrp < 0
    ) {
      toast.error('Please complete the product name, brand, category, unit, store, and a valid MRP.');
      return;
    }

    const { disc, dict_amt, offer_price } = calculateProductPricing(
      mrp,
      newProduct.discount,
      newProduct.discType
    );
    const enteredOfferPrice = newProduct.offer_price === null || newProduct.offer_price === ''
      ? offer_price
      : Number(newProduct.offer_price);
    if (!Number.isFinite(enteredOfferPrice) || enteredOfferPrice < 0) {
      toast.error('Please enter a valid offer price.');
      return;
    }

    addProductMutation.mutate(
      {
        barcode_text: newProduct.barcode_text.trim(),
        alias: newProduct.alias.trim(),
        brand: newProduct.brand,
        category: newProduct.category,
        unit: newProduct.unit,
        hsncode: newProduct.hsncode.trim(),
        mrp,
        gst: Number(newProduct.gst) || 0,
        disc,
        dict_amt,
        offer_price: enteredOfferPrice,
        storeId: targetStoreId,
        qty: [{ storeId: targetStoreId, qty: Math.max(0, Number(newProduct.quantity) || 0) }],
      },
      { onSuccess: closeAddProductModal }
    );
  };

  const closeBarcodeModal = () => {
    setShowBarcodeModal(false);
    setBarcodeSearch('');
    setBarcodeQuantities({});
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setEditForm(buildEditForm(product, stores));
  };

  const closeEdit = () => {
    setEditingProduct(null);
    setEditForm(null);
  };

  const handleDeleteProduct = () => {
    if (!deletingProduct?._id) return;
    deleteProductMutation.mutate(deletingProduct._id, {
      onSuccess: () => setDeletingProduct(null),
    });
  };

  const handleEditField = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'mrp' || field === 'discount' || field === 'discType' ? { offer_price: null } : {}),
    }));
  };

  const handleEditQty = (sid, value) => {
    setEditForm((prev) => ({
      ...prev,
      qtyByStore: {
        ...prev.qtyByStore,
        [sid]: Math.max(0, Number(value) || 0),
      },
    }));
  };

  const handleSaveEdit = () => {
    if (!editForm?.id) return;
    if (!editForm.barcode_text?.trim()) {
      toast.error('Barcode is required');
      return;
    }

    const mrp = Number(editForm.mrp) || 0;
    const pricing = calculateProductPricing(mrp, editForm.discount, editForm.discType);
    const { disc, dict_amt } = pricing;
    const offer_price = editForm.offer_price === null || editForm.offer_price === ''
      ? pricing.offer_price
      : Number(editForm.offer_price);
    if (!Number.isFinite(offer_price) || offer_price < 0) {
      toast.error('Please enter a valid offer price.');
      return;
    }

    const qty = editableStores.map((store) => ({
      storeId: store.storeId,
      qty: Number(editForm.qtyByStore?.[store.storeId] ?? 0),
    }));

    updateProductMutation.mutate(
      {
        id: editForm.id,
        barcode_text: editForm.barcode_text.trim(),
        alias: editForm.alias.trim(),
        brand: editForm.brand || undefined,
        category: editForm.category || undefined,
        unit: editForm.unit || undefined,
        hsncode: editForm.hsncode || '',
        mrp,
        gst: Number(editForm.gst) || 0,
        disc,
        dict_amt,
        offer_price,
        qty,
      },
      {
        onSuccess: () => closeEdit(),
      }
    );
  };

  const isBarcodeSelected = (productId) => (barcodeQuantities[productId] || 0) > 0;

  const toggleBarcodeSelect = (productId) => {
    setBarcodeQuantities((prev) => {
      const next = { ...prev };
      if ((next[productId] || 0) > 0) {
        delete next[productId];
      } else {
        next[productId] = 1;
      }
      return next;
    });
  };

  const handleBarcodeQuantityChange = (productId, change) => {
    setBarcodeQuantities((prev) => {
      const current = prev[productId] || 0;
      const newValue = Math.max(0, current + change);
      const next = { ...prev };
      if (newValue <= 0) {
        delete next[productId];
      } else {
        next[productId] = newValue;
      }
      return next;
    });
  };

  const setBarcodeQuantity = (productId, value) => {
    const qty = Math.max(0, Number(value) || 0);
    setBarcodeQuantities((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[productId];
      } else {
        next[productId] = qty;
      }
      return next;
    });
  };

  const handlePrintBarcodes = () => {
    const selectedStore = stores.find((store) => String(store.storeId) === String(barcodeStoreId));
    if (!selectedStore) {
      toast.error('Please select a store before printing');
      return;
    }

    const selectedProducts = Object.entries(barcodeQuantities).filter(([, qty]) => qty > 0);

    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product to print');
      return;
    }

    const selections = selectedProducts.map(([productId, quantity]) => {
      const product = products.find((p) => String(p._id) === String(productId));
      return { product, quantity };
    }).filter((s) => s.product);

    if (selections.length === 0) {
      toast.error('Selected products could not be found');
      return;
    }

    const { ok, count } = printBarcodeStickers(selections, selectedStore.name);
    if (!ok) {
      toast.error('Could not open print dialog');
      return;
    }

    toast.success(
      `Printing ${count} sticker(s) — ${BARCODE_STICKER_SPEC.widthMm}×${BARCODE_STICKER_SPEC.heightMm} mm, ${BARCODE_STICKER_SPEC.perRow}/row (${BARCODE_STICKER_SPEC.printer})`
    );
  };

  const selectedProductCount = useMemo(
    () => Object.values(barcodeQuantities).filter((qty) => qty > 0).length,
    [barcodeQuantities]
  );

  const totalSelectedStickers = useMemo(
    () => Object.values(barcodeQuantities).reduce((sum, qty) => sum + qty, 0),
    [barcodeQuantities]
  );

  const barcodeFilteredProducts = useMemo(() => {
    const q = barcodeSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (item) =>
        item.barcode_text?.toLowerCase().includes(q) ||
        item.sku_code?.toLowerCase().includes(q) ||
        item.product_code?.toLowerCase().includes(q) ||
        getBrandName(item.brand?._id || item.brand)?.toLowerCase().includes(q) ||
        getCategoryName(item.category)?.toLowerCase().includes(q)
    );
  }, [products, barcodeSearch, stockGroup, stockCategory]);

  const barcodePagination = usePagination(barcodeFilteredProducts, { pageSize: 25 });

  const displayInventory = useMemo(() => products.filter(item => {
    const matchesSearch =
      item.barcode_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || String(item.category) === filterCategory;
    const brandId = item.brand?._id || item.brand;
    const matchesBrand = filterBrand === 'All' || String(brandId) === filterBrand;
    return matchesSearch && matchesCategory && matchesBrand;
  }), [products, searchTerm, filterCategory, filterBrand]);

  const inventoryPagination = usePagination(displayInventory);

  // const totalStockAcrossAll = useMemo(
  //   () => products.reduce((sum, item) => sum + getTotalStock(item), 0),
  //   [products]
  // );

  // const totalValueAcrossAll = useMemo(
  //   () => products.reduce((sum, item) => sum + (getTotalStock(item) * (item.mrp || 0)), 0),
  //   [products]
  // );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Master Inventory</h2>
          <p className="text-gray-600 mt-1">
            {role === 'admin'
              ? 'Manage inventory across all stores'
              : 'View inventory across all stores'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={openBarcodeModal}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            <Printer size={20} />
            print labels
          </button>
          {['admin', 'manager', 'accounting'].includes(role) && (
            <button
              type="button"
              onClick={openAddProductModal}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg"
            >
              <Plus size={20} />
              Add Product
            </button>
          )}
        </div>
      </div>

      {role === 'manager' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="bg-purple-500 text-white p-2 rounded-lg">
              <Package size={20} />
            </div>
            <div>
              <h3 className="font-bold text-purple-900 mb-1">Master Inventory Access</h3>
              <p className="text-sm text-purple-800">
                You can view inventory levels across <strong>all stores</strong>. {storeId && `Your store's stock is highlighted in `}<span className="font-bold text-amber-600">amber</span> for easy identification.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Items</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{products.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Stock</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{accounting?.state?.items_purchased}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Value</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">₹{accounting?.state?.total_purchased_value}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,17rem)_minmax(12rem,17rem)_auto] items-end gap-4">
        <label className="min-w-0 sm:col-span-2 lg:col-span-1">
          <span className="block text-sm font-medium text-gray-700 mb-1">Search</span>
          <span className="relative block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by barcode, SKU, or product code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            />
          </span>
        </label>
        <label className="min-w-0">
          <span className="block text-sm font-medium text-gray-700 mb-1">Category</span>
          <FilterSelect
            label="Category"
            value={filterCategory}
            onChange={setFilterCategory}
            isAccounting={role === 'accounting'}
            options={[
              { value: 'All', label: 'All categories' },
              ...stockCategory.map((cat) => ({ value: cat.categoryId, label: cat.name })),
            ]}
          />
        </label>
        <label className="min-w-0">
          <span className="block text-sm font-medium text-gray-700 mb-1">Brand</span>
          <FilterSelect
            label="Brand"
            value={filterBrand}
            onChange={setFilterBrand}
            isAccounting={role === 'accounting'}
            options={[
              { value: 'All', label: 'All brands' },
              ...stockGroup.map((brand) => ({ value: brand._id, label: brand.name })),
            ]}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setSearchTerm('');
            setFilterCategory('All');
            setFilterBrand('All');
          }}
          disabled={!searchTerm && filterCategory === 'All' && filterBrand === 'All'}
          className="sm:col-span-2 lg:col-span-1 h-[50px] px-4 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear filters
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {role == "accounting" 
            ? 
            <thead className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                {stores.map(store => (
                  <th key={store.storeId} className="px-4 py-3 text-center">{store.name}</th>
                ))}
                <th className="px-4 py-3 text-center">Total</th>
                <th className="px-4 py-3 text-center">Sync Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            : <thead className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                {stores.map(store => (
                  <th key={store.storeId} className="px-4 py-3 text-center">{store.name}</th>
                ))}
                <th className="px-4 py-3 text-center">Total</th>
                <th className="px-4 py-3 text-center">Sync Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            }
            {/* <thead className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                {stores.map(store => (
                  <th key={store.storeId} className="px-4 py-3 text-center">{store.name}</th>
                ))}
                <th className="px-4 py-3 text-center">Total</th>
                <th className="px-4 py-3 text-center">Sync Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead> */}
            <tbody className="divide-y divide-gray-200">
              {productsLoading && (
                <tr>
                  <td colSpan={6 + stores.length} className="px-4 py-6 text-center text-gray-500">
                    Loading inventory...
                  </td>
                </tr>
              )}
              {!productsLoading && inventoryPagination.paginatedItems.map(item => (
              // {displayInventory.map(item => (
                <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Package size={20} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{item.barcode_text}</p>
                        <p className="text-xs text-gray-500">{getBrandName(item.brand)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.sku_code}</td>
                  <td className="px-4 py-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {getCategoryName(item.category)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">₹{(item.mrp || 0).toLocaleString()}</td>
                  {stores.map(store => (
                    <td
                      key={store.storeId}
                      className={`px-4 py-3 text-center ${
                        role === 'manager' && storeId === store.storeId ? 'font-bold text-amber-600' : 'text-gray-600'
                      }`}
                    >
                      {getStoreQty(item, store.storeId)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center font-bold text-gray-800">{getTotalStock(item)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.syncStatus === 'synced' ? 'bg-green-100 text-green-700' :
                      item.syncStatus === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.syncStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {role !== 'sales' && (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                          title="Edit product"
                        >
                          <Edit2 size={16} />
                        </button>
                        {role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => setDeletingProduct(item)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                            title="Delete product"
                            aria-label={`Delete ${item.barcode_text || 'product'}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={inventoryPagination.page}
          totalPages={inventoryPagination.totalPages}
          totalItems={inventoryPagination.totalItems}
          pageSize={inventoryPagination.pageSize}
          onPageChange={inventoryPagination.goToPage}
        />
      </div>

      {showAddProductModal && newProduct && (
        <Modal
          title="Add Product"
          size="lg"
          onClose={closeAddProductModal}
          footer={
            <>
              <button type="button" onClick={closeAddProductModal} className={modalSecondaryBtnClass}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateProduct}
                disabled={addProductMutation.isPending}
                className={`${modalPrimaryBtnClass} disabled:opacity-60`}
              >
                {addProductMutation.isPending ? 'Saving...' : 'Add Product'}
              </button>
            </>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <div className="sm:col-span-2">
              <label className={modalLabelClass}>Product Name / Barcode *</label>
              <input
                type="text"
                value={newProduct.barcode_text}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, barcode_text: e.target.value }))}
                className={modalInputClass}
                placeholder="Enter product name or barcode"
              />
            </div>
            <div>
              <label className={modalLabelClass}>Brand *</label>
              <select
                value={newProduct.brand}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, brand: e.target.value }))}
                className={modalInputClass}
              >
                <option value="">Select brand</option>
                {stockGroup.map((group) => (
                  <option key={group._id} value={group._id}>{group.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={modalLabelClass}>Alias</label>
              <input
                type="text"
                value={newProduct.alias}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, alias: e.target.value }))}
                className={modalInputClass}
                placeholder="Optional product alias"
              />
            </div>
            <div>
              <label className={modalLabelClass}>Category *</label>
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, category: e.target.value }))}
                className={modalInputClass}
              >
                <option value="">Select category</option>
                {stockCategory.map((category) => (
                  <option key={category.categoryId} value={category.categoryId}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={modalLabelClass}>Unit *</label>
              <select
                value={newProduct.unit}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, unit: e.target.value }))}
                className={modalInputClass}
              >
                <option value="">Select unit</option>
                {!isUnitLoading && units.map((unit) => (
                  <option key={unit._id || unit.unitId} value={unit._id || unit.unitId}>
                    {unit.name || unit.unitId}
                  </option>
                ))}
              </select>
            </div>
            {role === 'admin' && (
              <div>
                <label className={modalLabelClass}>Store *</label>
                <select
                  value={newProduct.storeId}
                  onChange={(e) => setNewProduct((prev) => ({ ...prev, storeId: e.target.value }))}
                  className={modalInputClass}
                >
                  <option value="">Select Store</option>
                  {stores.map((store) => (
                    <option value={store.storeId} key={store.storeId}>{store.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className={modalLabelClass}>HSN Code</label>
              <input
                type="text"
                value={newProduct.hsncode}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, hsncode: e.target.value }))}
                className={modalInputClass}
                placeholder="Enter HSN code"
              />
            </div>
            <div>
              <label className={modalLabelClass}>MRP (₹) *</label>
              <input
                type="number"
                min="0"
                value={newProduct.mrp}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, mrp: e.target.value, offer_price: null }))}
                className={modalInputClass}
                placeholder="0"
              />
            </div>
            <div>
              <label className={modalLabelClass}>GST (%)</label>
              <select
                value={newProduct.gst}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, gst: e.target.value }))}
                className={modalInputClass}
              >
                {[0, 5, 12, 18, 28].map((rate) => <option key={rate} value={rate}>{rate}%</option>)}
              </select>
            </div>
            <div>
              <label className={modalLabelClass}>Discount</label>
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-2">
                <select
                  value={newProduct.discType}
                  onChange={(e) => setNewProduct((prev) => ({ ...prev, discType: e.target.value, offer_price: null }))}
                  className={`${modalInputClass} min-w-0`}
                  aria-label="Discount type"
                >
                  <option value="percent">%</option>
                  <option value="value">Value (₹)</option>
                </select>
                <input
                  type="number"
                  min="0"
                  max={newProduct.discType === 'percent' ? 100 : undefined}
                  value={newProduct.discount}
                  onChange={(e) => setNewProduct((prev) => ({ ...prev, discount: e.target.value, offer_price: null }))}
                  className={`${modalInputClass} min-w-0`}
                  placeholder={newProduct.discType === 'percent' ? 'Discount %' : 'Discount amount'}
                />
              </div>
            </div>
            <div>
              <label className={modalLabelClass}>Offer Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newProduct.offer_price ?? calculateProductPricing(newProduct.mrp, newProduct.discount, newProduct.discType).offer_price}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, offer_price: e.target.value }))}
                className={modalInputClass}
              />
            </div>
            <div>
              <label className={modalLabelClass}>Initial Stock Quantity</label>
              <input
                type="number"
                min="0"
                value={newProduct.quantity}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, quantity: e.target.value }))}
                className={modalInputClass}
                placeholder="0"
              />
            </div>
          </div>
        </Modal>
      )}

      {deletingProduct && (
        <Modal
          title="Delete Product"
          size="sm"
          onClose={() => {
            if (!deleteProductMutation.isPending) setDeletingProduct(null);
          }}
          footer={
            <>
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                disabled={deleteProductMutation.isPending}
                className={modalSecondaryBtnClass}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={deleteProductMutation.isPending}
                className="w-full sm:w-48 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium text-center shrink-0 disabled:opacity-60"
              >
                {deleteProductMutation.isPending ? 'Deleting...' : 'Delete Product'}
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-600">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-gray-800">
              {deletingProduct.barcode_text || deletingProduct.sku_code}
            </span>
            ? This action cannot be undone.
          </p>
        </Modal>
      )}

      {editingProduct && editForm && (
        <Modal
          title={`Edit Product — ${editingProduct.sku_code || editingProduct.barcode_text}`}
          onClose={closeEdit}
          size="lg"
          footer={
            <>
              <button type="button" onClick={closeEdit} className={modalSecondaryBtnClass}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={updateProductMutation.isPending}
                className={modalPrimaryBtnClass}
              >
                {updateProductMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <div className="sm:col-span-2">
              <label className={modalLabelClass}>Barcode *</label>
              <input
                type="text"
                value={editForm.barcode_text}
                onChange={(e) => handleEditField('barcode_text', e.target.value)}
                className={modalInputClass}
              />
            </div>
            <div>
              <label className={modalLabelClass}>Brand</label>
              <select
                value={editForm.brand}
                onChange={(e) => handleEditField('brand', e.target.value)}
                className={modalInputClass}
              >
                <option value="">Select brand</option>
                {stockGroup.map((sg) => (
                  <option key={sg._id} value={sg._id}>{sg.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={modalLabelClass}>Alias</label>
              <input
                type="text"
                value={editForm.alias}
                onChange={(e) => handleEditField('alias', e.target.value)}
                className={modalInputClass}
                placeholder="Optional product alias"
              />
            </div>
            <div>
              <label className={modalLabelClass}>Category</label>
              <select
                value={editForm.category}
                onChange={(e) => handleEditField('category', e.target.value)}
                className={modalInputClass}
              >
                <option value="">Select category</option>
                {stockCategory.map((cat) => (
                  <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={modalLabelClass}>Unit</label>
              <select
                value={editForm.unit}
                onChange={(e) => handleEditField('unit', e.target.value)}
                className={modalInputClass}
              >
                <option value="">Select unit</option>
                {units.map((u) => (
                  <option key={u.unitId || u._id} value={u.unitId || u._id}>
                    {u.name || u.unitId}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={modalLabelClass}>HSN Code</label>
              <input
                type="text"
                value={editForm.hsncode}
                onChange={(e) => handleEditField('hsncode', e.target.value)}
                className={modalInputClass}
              />
            </div>
            <div>
              <label className={modalLabelClass}>MRP (₹)</label>
              <input
                type="number"
                min="0"
                value={editForm.mrp}
                onChange={(e) => handleEditField('mrp', e.target.value)}
                className={modalInputClass}
              />
            </div>
            <div>
              <label className={modalLabelClass}>
                Offer Price (₹) <span className="font-normal text-gray-500">Old: ₹{editForm.oldOfferPrice}</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editForm.offer_price ?? calculateProductPricing(editForm.mrp, editForm.discount, editForm.discType).offer_price}
                onChange={(e) => handleEditField('offer_price', e.target.value)}
                className={modalInputClass}
              />
            </div>
            <div>
              <label className={modalLabelClass}>GST (%)</label>
              <input
                type="number"
                min="0"
                value={editForm.gst}
                onChange={(e) => handleEditField('gst', e.target.value)}
                className={modalInputClass}
              />
            </div>
            <div>
              <label className={modalLabelClass}>Discount</label>
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-2">
                <select
                  value={editForm.discType}
                  onChange={(e) => handleEditField('discType', e.target.value)}
                  className={`${modalInputClass} min-w-0`}
                  aria-label="Discount type"
                >
                  <option value="percent">%</option>
                  <option value="value">Value (₹)</option>
                </select>
                <input
                  type="number"
                  min="0"
                  max={editForm.discType === 'percent' ? 100 : undefined}
                  value={editForm.discount}
                  onChange={(e) => handleEditField('discount', e.target.value)}
                  className={`${modalInputClass} min-w-0`}
                  placeholder={editForm.discType === 'percent' ? 'Discount %' : 'Discount amount'}
                />
              </div>
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Stock Quantity {role === 'manager' ? '(Your Store)' : '(All Stores)'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {editableStores.map((store) => (
                  <div key={store.storeId}>
                    <label className={modalLabelClass}>{store.name}</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.qtyByStore?.[store.storeId] ?? 0}
                      onChange={(e) => handleEditQty(store.storeId, e.target.value)}
                      className={modalInputClass}
                    />
                  </div>
                ))}
                {editableStores.length === 0 && (
                  <p className="text-sm text-gray-500">No store assigned to edit stock.</p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showBarcodeModal && (
        <Modal
          title={
            <div className="flex items-center gap-3">
              <Barcode className="text-purple-600" size={28} />
              <div>
                <h3 className="text-xl font-bold text-gray-800">print label Stickers</h3>
                <p className="text-sm text-gray-500">
                  {BARCODE_STICKER_SPEC.printer} · {BARCODE_STICKER_SPEC.widthMm} × {BARCODE_STICKER_SPEC.heightMm} mm · {BARCODE_STICKER_SPEC.perRow} stickers / row
                </p>
              </div>
            </div>
          }
          size="xl"
          onClose={closeBarcodeModal}
          footer={
            <>
              <button
                type="button"
                onClick={closeBarcodeModal}
                className={modalSecondaryBtnClass}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePrintBarcodes}
                disabled={totalSelectedStickers === 0}
                className={`w-full sm:w-56 px-4 py-2.5 flex items-center justify-center gap-2 rounded-lg font-medium text-sm transition-all shrink-0 ${
                  totalSelectedStickers > 0
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Printer size={18} />
                Print ({totalSelectedStickers})
              </button>
            </>
          }
        >
          <div className="mb-4">
            <label className={modalLabelClass}>Store *</label>
            <select
              value={barcodeStoreId}
              onChange={(e) => setBarcodeStoreId(e.target.value)}
              className={modalInputClass}
            >
              <option value="">Select Store</option>
              {stores.map((store) => (
                <option value={store.storeId} key={store.storeId}>{store.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-purple-800">
                <span className="font-bold text-lg text-purple-900">{selectedProductCount}</span>
                {' '}product{selectedProductCount === 1 ? '' : 's'} selected
              </span>
              <span className="text-purple-600">·</span>
              <span className="text-purple-800">
                <span className="font-bold text-lg text-purple-900">{totalSelectedStickers}</span>
                {' '}sticker{totalSelectedStickers === 1 ? '' : 's'}
              </span>
            </div>
            {selectedProductCount > 0 && (
              <button
                type="button"
                onClick={() => setBarcodeQuantities({})}
                className="text-sm text-purple-700 hover:text-purple-900 font-medium underline"
              >
                Clear selection
              </button>
            )}
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={barcodeSearch}
              onChange={(e) => setBarcodeSearch(e.target.value)}
              placeholder="Search barcode, SKU, product code, brand, or category..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              autoFocus
            />
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="max-h-[420px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr className="text-left text-xs text-gray-600 uppercase tracking-wide">
                    <th className="px-3 py-2.5 w-10">Select</th>
                    <th className="px-3 py-2.5">Barcode</th>
                    <th className="px-3 py-2.5 hidden sm:table-cell">SKU</th>
                    <th className="px-3 py-2.5 hidden md:table-cell">Brand</th>
                    <th className="px-3 py-2.5 hidden lg:table-cell">MRP</th>
                    <th className="px-3 py-2.5 text-center w-36">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {barcodePagination.paginatedItems.map((product) => {
                    const selected = isBarcodeSelected(product._id);
                    const qty = barcodeQuantities[product._id] || 0;
                    return (
                      <tr
                        key={product._id}
                        className={`border-t border-gray-100 ${selected ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleBarcodeSelect(product._id)}
                            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <p className="font-medium text-gray-800 whitespace-normal break-words">{product.barcode_text}</p>
                          <p className="text-xs text-gray-500 sm:hidden">{product.sku_code}</p>
                        </td>
                        <td className="px-3 py-2 text-gray-600 hidden sm:table-cell">{product.sku_code || '—'}</td>
                        <td className="px-3 py-2 text-gray-600 hidden md:table-cell">
                          {getBrandName(product.brand?._id || product.brand)}
                        </td>
                        <td className="px-3 py-2 text-gray-800 hidden lg:table-cell">
                          ₹{(product.mrp || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleBarcodeQuantityChange(product._id, -1)}
                              disabled={qty === 0}
                              className={`p-1.5 rounded ${
                                qty === 0
                                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                  : 'bg-red-100 text-red-600 hover:bg-red-200'
                              }`}
                            >
                              <Minus size={14} />
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={qty}
                              onChange={(e) => setBarcodeQuantity(product._id, e.target.value)}
                              onFocus={() => {
                                if (!selected) setBarcodeQuantity(product._id, 1);
                              }}
                              className="w-14 text-center border border-gray-300 rounded py-1 font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleBarcodeQuantityChange(product._id, 1)}
                              className="p-1.5 rounded bg-green-100 text-green-700 hover:bg-green-200"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {barcodeFilteredProducts.length === 0 && !productsLoading && (
                <div className="text-center py-12 px-4">
                  <Package className="mx-auto text-gray-400 mb-3" size={48} />
                  <p className="font-medium text-gray-800">
                    {barcodeSearch.trim() ? 'No products match your search' : 'No products available'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {barcodeSearch.trim()
                      ? 'Try a different barcode, SKU, or brand'
                      : 'Add products via purchase bill to print stickers'}
                  </p>
                </div>
              )}
            </div>

            {barcodeFilteredProducts.length > 0 && (
              <div className="border-t border-gray-200 px-3 py-2 bg-white">
                <Pagination
                  page={barcodePagination.page}
                  totalPages={barcodePagination.totalPages}
                  totalItems={barcodePagination.totalItems}
                  pageSize={barcodePagination.pageSize}
                  onPageChange={barcodePagination.goToPage}
                />
              </div>
            )}
          </div>
        </Modal>
      )}

    </div>
  );
}
