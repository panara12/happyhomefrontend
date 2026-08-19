import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Search, Barcode, Plus } from 'lucide-react';
import { useGetAllProducts } from '../../hooks/useProduct';

export function ItemSearch({ onAddItem }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState('');
  const [showListPrice, setShowListPrice] = useState(false);
  const user = useSelector((state) => state.app.userInfo);
  
  const { data: searchData } = useGetAllProducts(searchTerm);
  const searchResults = searchData?.products || [];

  const getStoreQty = (product, storeId) =>
  product?.qty?.find((entry) => entry.storeId === storeId)?.qty ?? 0;

  const handleSelectItem = (product) => {
    const item = {
      _id: product._id,
      code: product.product_code || product.sku_code,
      name: product.sku_code,
      barcode: product.barcode_text,
      price: product.offer_price || product.mrp || 0,
      mrp: product.mrp || 0,
      stock: getStoreQty(product, user?.storeId),
      gst: product.gst || 0,
      disc: product.disc || 0,
    };
    setSelectedItem(item);
    setCustomPrice(item.price.toString());
    setSearchTerm('');
    setShowListPrice(false);
  };

  const handleAddToInvoice = () => {
    if (selectedItem && quantity > 0) {
      onAddItem(selectedItem, quantity, parseFloat(customPrice) || selectedItem.price);
      setSelectedItem(null);
      setQuantity(1);
      setCustomPrice('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by item name, code, or scan barcode..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
        {searchTerm.length > 0 && searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-auto">
            {searchResults.map((product) => (
              <div
                key={product._id}
                onClick={() => handleSelectItem(product)}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{product.sku_code}</div>
                    <div className="text-sm text-gray-600">
                      Code: {product.product_code || '-'} • Barcode: {product.barcode_text}
                    </div>
                    <div className="text-sm text-gray-500">Stock: {getStoreQty(product, user?.storeId)} units</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-amber-600">₹{product.offer_price || product.mrp || 0}</div>
                    {product.mrp && product.offer_price && product.mrp !== product.offer_price && (
                      <div className="text-xs text-gray-400 line-through">₹{product.mrp}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {console.log(selectedItem)}
      {selectedItem && (
        <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="font-medium text-lg">{selectedItem.barcode}</div>
              <div className="text-sm text-gray-600">Code: {selectedItem.code}</div>
              <div className="text-sm text-gray-600">Available Stock: {selectedItem.stock} units</div>
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                max={selectedItem.stock}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center justify-between">
                <span>Price per Unit (₹)</span>
                <button
                  type="button"
                  onMouseEnter={() => setShowListPrice(true)}
                  onMouseLeave={() => setShowListPrice(false)}
                  className="text-xs text-gray-500 hover:text-amber-600 underline"
                >
                  {showListPrice ? `MRP: ₹${selectedItem.mrp}` : 'Show MRP'}
                </button>
              </label>
              <input
                type="number"
                step="0.01"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total</label>
              <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg font-medium">
                ₹{(quantity * (parseFloat(customPrice) || selectedItem.price)).toFixed(2)}
              </div>
            </div>
          </div>

          <button
            onClick={handleAddToInvoice}
            className="mt-3 w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add to Invoice
          </button>
        </div>
      )}
    </div>
  );
}
