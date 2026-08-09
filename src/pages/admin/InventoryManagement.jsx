import { useState } from 'react';
import { Plus, Edit2, Trash2, Package, Search, Filter, TrendingDown, Printer, Barcode, CheckCircle, Minus } from 'lucide-react';
import { toast } from 'sonner';

export default function InventoryManagement({ user }) {
  const [inventory, setInventory] = useState([
    {
      id: 1,
      name: 'LED TV 43"',
      sku: 'TV-LED-43-001',
      category: 'Electronics',
      totalStock: 45,
      store1: 15,
      store2: 18,
      store3: 12,
      price: 25999,
      minStock: 20,
      supplier: 'Samsung India'
    },
    {
      id: 2,
      name: 'Refrigerator 190L',
      sku: 'REF-190-001',
      category: 'Appliances',
      totalStock: 28,
      store1: 10,
      store2: 10,
      store3: 8,
      price: 15999,
      minStock: 15,
      supplier: 'LG Electronics'
    },
    {
      id: 3,
      name: 'Washing Machine 7kg',
      sku: 'WM-7KG-001',
      category: 'Appliances',
      totalStock: 35,
      store1: 12,
      store2: 13,
      store3: 10,
      price: 18999,
      minStock: 25,
      supplier: 'IFB Industries'
    },
    {
      id: 4,
      name: 'Microwave Oven',
      sku: 'MWO-20L-001',
      category: 'Kitchen',
      totalStock: 52,
      store1: 18,
      store2: 20,
      store3: 14,
      price: 7999,
      minStock: 30,
      supplier: 'Bajaj Electricals'
    },
    {
      id: 5,
      name: 'Air Cooler',
      sku: 'AC-50L-001',
      category: 'Cooling',
      totalStock: 15,
      store1: 5,
      store2: 6,
      store3: 4,
      price: 8999,
      minStock: 20,
      supplier: 'Symphony Ltd'
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [barcodeQuantities, setBarcodeQuantities] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    price: '',
    minStock: '',
    supplier: '',
    store1: '',
    store2: '',
    store3: ''
  });

  const categories = ['All', 'Electronics', 'Appliances', 'Kitchen', 'Cooling', 'Furniture'];

  const handleAddItem = () => {
    if (formData.name && formData.sku && formData.price) {
      const newItem = {
        id: inventory.length + 1,
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        price: parseFloat(formData.price),
        minStock: parseInt(formData.minStock) || 0,
        supplier: formData.supplier,
        store1: parseInt(formData.store1) || 0,
        store2: parseInt(formData.store2) || 0,
        store3: parseInt(formData.store3) || 0,
        totalStock: (parseInt(formData.store1) || 0) + (parseInt(formData.store2) || 0) + (parseInt(formData.store3) || 0)
      };
      setInventory([...inventory, newItem]);
      setFormData({ name: '', sku: '', category: '', price: '', minStock: '', supplier: '', store1: '', store2: '', store3: '' });
      setShowAddModal(false);
    }
  };

  const handleBarcodeQuantityChange = (productId, change) => {
    setBarcodeQuantities(prev => {
      const current = prev[productId] || 0;
      const newValue = Math.max(0, current + change);
      return { ...prev, [productId]: newValue };
    });
  };

  const handlePrintBarcodes = () => {
    const selectedProducts = Object.entries(barcodeQuantities).filter(([, qty]) => qty > 0);

    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product to print');
      return;
    }

    const totalStickers = selectedProducts.reduce((sum, [, qty]) => sum + qty, 0);
    toast.success(`Printing ${totalStickers} barcode sticker(s) for ${selectedProducts.length} product(s)...`);

    // Trigger browser print
    window.print();
  };

  const getTotalSelectedStickers = () => {
    return Object.values(barcodeQuantities).reduce((sum, qty) => sum + qty, 0);
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Managers can now see full master inventory
  const displayInventory = filteredInventory;

  // Check low stock items
  const lowStockItems = inventory.filter(item => item.totalStock < item.minStock);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Master Inventory</h2>
          <p className="text-gray-600 mt-1">
            {user.role === 'admin'
              ? 'Manage inventory across all stores'
              : 'View inventory across all stores'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBarcodeModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            <Printer size={20} />
            Print Barcodes
          </button>
          {user.role === 'admin' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg"
            >
              <Plus size={20} />
              Add New Item
            </button>
          )}
        </div>
      </div>

      {/* Info Banner for Managers */}
      {user.role === 'manager' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="bg-purple-500 text-white p-2 rounded-lg">
              <Package size={20} />
            </div>
            <div>
              <h3 className="font-bold text-purple-900 mb-1">Master Inventory Access</h3>
              <p className="text-sm text-purple-800">
                You can view inventory levels across <strong>all stores</strong>. {user.storeId && `Your store's stock (Store ${user.storeId}) is highlighted in `}<span className="font-bold text-amber-600">amber</span> for easy identification.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Items</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{inventory.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Stock</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{inventory.reduce((sum, item) => sum + item.totalStock, 0)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Total Value</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">₹{(inventory.reduce((sum, item) => sum + (item.totalStock * item.price), 0)).toLocaleString()}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4 border border-red-200">
          <p className="text-red-600 text-sm flex items-center gap-1">
            <TrendingDown size={16} />
            Low Stock Items
          </p>
          <p className="text-2xl font-bold text-red-600 mt-1">{lowStockItems.length}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-500" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">SKU</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-center">Store 1</th>
                <th className="px-4 py-3 text-center">Store 2</th>
                <th className="px-4 py-3 text-center">Store 3</th>
                <th className="px-4 py-3 text-center">Total</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayInventory.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Package size={20} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.supplier}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.sku}</td>
                  <td className="px-4 py-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">₹{item.price.toLocaleString()}</td>
                  <td className={`px-4 py-3 text-center ${user.role === 'manager' && user.storeId && user.storeId === 1 ? 'font-bold text-amber-600' : 'text-gray-600'}`}>
                    {item.store1}
                  </td>
                  <td className={`px-4 py-3 text-center ${user.role === 'manager' && user.storeId && user.storeId === 2 ? 'font-bold text-amber-600' : 'text-gray-600'}`}>
                    {item.store2}
                  </td>
                  <td className={`px-4 py-3 text-center ${user.role === 'manager' && user.storeId && user.storeId === 3 ? 'font-bold text-amber-600' : 'text-gray-600'}`}>
                    {item.store3}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-gray-800">{item.totalStock}</td>
                  <td className="px-4 py-3 text-center">
                    {item.totalStock < item.minStock ? (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        Low Stock
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.role !== 'sales' && (
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600">
                          <Edit2 size={16} />
                        </button>
                        {user.role === 'admin' && (
                          <button className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600">
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
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 my-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Add New Inventory Item</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="e.g., LED TV 43 inch"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="e.g., TV-LED-43-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                >
                  <option value="">Select Category</option>
                  {categories.filter(c => c !== 'All').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="25999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Stock Level</label>
                <input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({...formData, minStock: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="Supplier name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Store 1 Stock</label>
                <input
                  type="number"
                  value={formData.store1}
                  onChange={(e) => setFormData({...formData, store1: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Store 2 Stock</label>
                <input
                  type="number"
                  value={formData.store2}
                  onChange={(e) => setFormData({...formData, store2: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="0"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Store 3 Stock</label>
                <input
                  type="number"
                  value={formData.store3}
                  onChange={(e) => setFormData({...formData, store3: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Printing Modal */}
      {showBarcodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <Barcode size={32} />
                    Print Barcode Stickers
                  </h2>
                  <p className="text-sm opacity-90 mt-1">Select products and quantity to print barcode stickers</p>
                </div>
                <button
                  onClick={() => setShowBarcodeModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Summary Bar */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-600 text-white p-3 rounded-lg">
                      <CheckCircle size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-purple-700">Total Stickers Selected</p>
                      <p className="text-3xl font-bold text-purple-900">{getTotalSelectedStickers()}</p>
                    </div>
                  </div>
                  <button
                    onClick={handlePrintBarcodes}
                    disabled={getTotalSelectedStickers() === 0}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                      getTotalSelectedStickers() > 0
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Printer size={20} />
                    Print Stickers
                  </button>
                </div>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventory.map((product) => (
                  <div key={product.id} className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-purple-300 hover:shadow-lg transition-all">
                    {/* Barcode Sticker Preview */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 border-b-2 border-dashed border-gray-300">
                      <div className="bg-white p-3 rounded-lg shadow-inner">
                        <div className="text-center mb-2">
                          <p className="text-xs font-bold text-gray-800 truncate">{product.name}</p>
                        </div>
                        <div className="flex justify-center mb-2">
                          <div className="bg-black/90 rounded px-4 py-2">
                            <div className="flex gap-[2px]">
                              {[...Array(12)].map((_, i) => (
                                <div
                                  key={i}
                                  className="bg-white"
                                  style={{
                                    width: `${Math.random() * 2 + 1}px`,
                                    height: '40px'
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-mono font-bold text-gray-700">{product.sku}</p>
                          <p className="text-lg font-bold text-green-600 mt-1">₹{product.price.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm mb-1">{product.name}</h3>
                        <p className="text-xs text-gray-600">SKU: {product.sku}</p>
                        <p className="text-xs text-gray-600">Category: {product.category}</p>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-2">
                        <p className="text-xs text-blue-700">Available Stock</p>
                        <p className="text-lg font-bold text-blue-900">{product.totalStock} units</p>
                      </div>

                      {/* Quantity Selector */}
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-2 font-medium">Print Quantity</p>
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleBarcodeQuantityChange(product.id, -1)}
                            disabled={(barcodeQuantities[product.id] || 0) === 0}
                            className={`p-2 rounded-lg transition-all ${
                              (barcodeQuantities[product.id] || 0) === 0
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-red-500 text-white hover:bg-red-600'
                            }`}
                          >
                            <Minus size={16} />
                          </button>

                          <div className="flex-1 text-center">
                            <input
                              type="number"
                              min="0"
                              value={barcodeQuantities[product.id] || 0}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                setBarcodeQuantities(prev => ({ ...prev, [product.id]: Math.max(0, value) }));
                              }}
                              className="w-full text-center text-2xl font-bold bg-white border-2 border-purple-300 rounded-lg py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            />
                          </div>

                          <button
                            onClick={() => handleBarcodeQuantityChange(product.id, 1)}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        {/* Quick Select Buttons */}
                        <div className="grid grid-cols-4 gap-1 mt-2">
                          {[5, 10, 20, 50].map((qty) => (
                            <button
                              key={qty}
                              onClick={() => setBarcodeQuantities(prev => ({ ...prev, [product.id]: qty }))}
                              className="text-xs py-1 px-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-all font-medium"
                            >
                              {qty}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {inventory.length === 0 && (
                <div className="text-center py-16">
                  <Package className="mx-auto text-gray-400 mb-4" size={64} />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Products Available</h3>
                  <p className="text-gray-600">Add products to inventory to print barcodes</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <p className="font-medium">💡 Tip: You can adjust quantities using +/- buttons or type directly</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setBarcodeQuantities({});
                      setShowBarcodeModal(false);
                    }}
                    className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePrintBarcodes}
                    disabled={getTotalSelectedStickers() === 0}
                    className={`flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-all ${
                      getTotalSelectedStickers() > 0
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Printer size={20} />
                    Print {getTotalSelectedStickers()} Sticker{getTotalSelectedStickers() !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}