import { useMemo, useState } from 'react';
import { Search, Barcode, Plus } from 'lucide-react';

const DEFAULT_INVENTORY = [
  { id: '1', code: 'HH001', name: 'Ceiling Fan 52"', barcode: '1234567890123', price: 2500, category: 'Fans', stock: 45 },
  { id: '2', code: 'HH002', name: 'LED Bulb 9W', barcode: '1234567890124', price: 150, category: 'Lighting', stock: 200 },
  { id: '3', code: 'HH003', name: 'Wall Socket 3-Pin', barcode: '1234567890125', price: 85, category: 'Electrical', stock: 150 },
  { id: '4', code: 'HH004', name: 'Extension Cord 5m', barcode: '1234567890126', price: 450, category: 'Electrical', stock: 80 },
  { id: '5', code: 'HH005', name: 'Table Lamp Modern', barcode: '1234567890127', price: 1200, category: 'Lighting', stock: 30 },
  { id: '6', code: 'HH006', name: 'Door Lock Set', barcode: '1234567890128', price: 1800, category: 'Hardware', stock: 25 },
  { id: '7', code: 'HH007', name: 'Paint Brush 2"', barcode: '1234567890129', price: 120, category: 'Tools', stock: 100 },
  { id: '8', code: 'HH008', name: 'PVC Pipe 1" (6ft)', barcode: '1234567890130', price: 280, category: 'Plumbing', stock: 60 },
  { id: '9', code: 'HH009', name: 'Cement Bag 50kg', barcode: '1234567890131', price: 420, category: 'Construction', stock: 120 },
  { id: '10', code: 'HH010', name: 'Hammer Claw 16oz', barcode: '1234567890132', price: 350, category: 'Tools', stock: 40 }
];

export function ItemSearch({ onAddItem }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState('');
  const [showListPrice, setShowListPrice] = useState(false);

  // Mock inventory - in production this would come from Supabase.
  // Read once per mount: nothing in this component writes the 'inventory'
  // key afterwards, so re-parsing it on every render would be pure waste.
  const mockInventory = useMemo(
    () => JSON.parse(localStorage.getItem('inventory') || JSON.stringify(DEFAULT_INVENTORY)),
    []
  );

  useState(() => {
    if (!localStorage.getItem('inventory')) {
      localStorage.setItem('inventory', JSON.stringify(mockInventory));
    }
  });

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (value.length > 0) {
      const results = mockInventory.filter(item =>
        item.name.toLowerCase().includes(value.toLowerCase()) ||
        item.code.toLowerCase().includes(value.toLowerCase()) ||
        item.barcode.includes(value)
      );
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setCustomPrice(item.price.toString());
    setSearchTerm('');
    setShowResults(false);
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
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-auto">
            {searchResults.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectItem(item)}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-600">Code: {item.code} • Barcode: {item.barcode}</div>
                    <div className="text-sm text-gray-500">Stock: {item.stock} units</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-amber-600">₹{item.price}</div>
                    <div className="text-xs text-gray-500">{item.category}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="font-medium text-lg">{selectedItem.name}</div>
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
                  {showListPrice ? `List: ₹${selectedItem.price}` : 'Show List Price'}
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