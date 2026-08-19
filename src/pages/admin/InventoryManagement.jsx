import { useMemo, useState } from 'react';
import { Package, Search, Filter, Printer, Barcode, CheckCircle, Minus, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/ui/Pagination';
import { useStoreContext } from '../../context/storeContext';
import { useGetAllStockGroup } from '../../hooks/useStockGroup';
import { useStockCategoryContext } from '../../context/stockcategoryContext';
import { useGetAllProducts } from '../../hooks/useProduct';
import { useGetAllAccountingConst } from '../../hooks/useGetAllAccountStates';

export default function InventoryManagement({ user }) {
  const { stores } = useStoreContext();
  const { data: stockGroupData } = useGetAllStockGroup();
  const stockGroup = stockGroupData?.data ?? [];
  const { stockCategory } = useStockCategoryContext();

  const { data: productsData, isLoading: productsLoading } = useGetAllProducts();
  const { data: accounting} = useGetAllAccountingConst();
  console.log("data",accounting)
  const products = productsData?.products ?? [];

  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [barcodeQuantities, setBarcodeQuantities] = useState({});

  const getBrandName = (brandId) => stockGroup.find(sg => sg._id === brandId)?.name || '-';
  const getCategoryName = (categoryId) => stockCategory.find(sc => sc.categoryId === categoryId)?.name || categoryId || '-';
  const getStoreQty = (product, storeId) => product.qty?.find(q => q.storeId === storeId)?.qty || 0;
  const getTotalStock = (product) => (product.qty || []).reduce((sum, q) => sum + (q.qty || 0), 0);

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

    window.print();
  };

  const totalSelectedStickers = useMemo(
    () => Object.values(barcodeQuantities).reduce((sum, qty) => sum + qty, 0),
    [barcodeQuantities]
  );

  const displayInventory = useMemo(() => products.filter(item => {
    const matchesSearch =
      item.barcode_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  }), [products, searchTerm, filterCategory]);

  // const inventoryPagination = usePagination(displayInventory);

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
        </div>
      </div>

      {user.role === 'manager' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="bg-purple-500 text-white p-2 rounded-lg">
              <Package size={20} />
            </div>
            <div>
              <h3 className="font-bold text-purple-900 mb-1">Master Inventory Access</h3>
              <p className="text-sm text-purple-800">
                You can view inventory levels across <strong>all stores</strong>. {user.storeId && `Your store's stock is highlighted in `}<span className="font-bold text-amber-600">amber</span> for easy identification.
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

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by barcode, SKU, or product code..."
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
            <option value="All">All</option>
            {stockCategory.map(cat => (
              <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
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
            <tbody className="divide-y divide-gray-200">
              {productsLoading && (
                <tr>
                  <td colSpan={6 + stores.length} className="px-4 py-6 text-center text-gray-500">
                    Loading inventory...
                  </td>
                </tr>
              )}
              {/* {!productsLoading && inventoryPagination.paginatedItems.map(item => ( */}
              {displayInventory.map(item => (
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
                        user.role === 'manager' && user.storeId === store.storeId ? 'font-bold text-amber-600' : 'text-gray-600'
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
        {/* <Pagination
          page={inventoryPagination.page}
          totalPages={inventoryPagination.totalPages}
          totalItems={inventoryPagination.totalItems}
          pageSize={inventoryPagination.pageSize}
          onPageChange={inventoryPagination.goToPage}
        /> */}
      </div>

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
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-600 text-white p-3 rounded-lg">
                      <CheckCircle size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-purple-700">Total Stickers Selected</p>
                      <p className="text-3xl font-bold text-purple-900">{totalSelectedStickers}</p>
                    </div>
                  </div>
                  <button
                    onClick={handlePrintBarcodes}
                    disabled={totalSelectedStickers === 0}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                      totalSelectedStickers > 0
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Printer size={20} />
                    Print Stickers
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div key={product._id} className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-purple-300 hover:shadow-lg transition-all">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 border-b-2 border-dashed border-gray-300">
                      <div className="bg-white p-3 rounded-lg shadow-inner">
                        <div className="text-center mb-2">
                          <p className="text-xs font-bold text-gray-800 truncate">{product.barcode_text}</p>
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
                          <p className="text-xs font-mono font-bold text-gray-700">{product.sku_code}</p>
                          <p className="text-lg font-bold text-green-600 mt-1">₹{(product.mrp || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm mb-1">{product.barcode_text}</h3>
                        <p className="text-xs text-gray-600">SKU: {product.sku_code}</p>
                        <p className="text-xs text-gray-600">Category: {getCategoryName(product.category)}</p>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-2">
                        <p className="text-xs text-blue-700">Available Stock</p>
                        <p className="text-lg font-bold text-blue-900">{getTotalStock(product)} units</p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-2 font-medium">Print Quantity</p>
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleBarcodeQuantityChange(product._id, -1)}
                            disabled={(barcodeQuantities[product._id] || 0) === 0}
                            className={`p-2 rounded-lg transition-all ${
                              (barcodeQuantities[product._id] || 0) === 0
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
                              value={barcodeQuantities[product._id] || 0}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                setBarcodeQuantities(prev => ({ ...prev, [product._id]: Math.max(0, value) }));
                              }}
                              className="w-full text-center text-2xl font-bold bg-white border-2 border-purple-300 rounded-lg py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                            />
                          </div>

                          <button
                            onClick={() => handleBarcodeQuantityChange(product._id, 1)}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <div className="grid grid-cols-4 gap-1 mt-2">
                          {[5, 10, 20, 50].map((qty) => (
                            <button
                              key={qty}
                              onClick={() => setBarcodeQuantities(prev => ({ ...prev, [product._id]: qty }))}
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

              {products.length === 0 && !productsLoading && (
                <div className="text-center py-16">
                  <Package className="mx-auto text-gray-400 mb-4" size={64} />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Products Available</h3>
                  <p className="text-gray-600">Add products via a purchase bill or the products module to see them here</p>
                </div>
              )}
            </div>

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
                    disabled={totalSelectedStickers === 0}
                    className={`flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-all ${
                      totalSelectedStickers > 0
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Printer size={20} />
                    Print {totalSelectedStickers} Sticker{totalSelectedStickers !== 1 ? 's' : ''}
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