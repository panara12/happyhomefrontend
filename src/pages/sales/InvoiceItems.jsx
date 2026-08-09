import { Trash2 } from 'lucide-react';

export function InvoiceItems({ items, onRemoveItem, onUpdateQuantity, onUpdatePrice }) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.18; // 18% GST
  const total = subtotal + tax;

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No items added yet. Search and add items to create an invoice.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-2">Item</th>
              <th className="text-center py-3 px-2 hidden sm:table-cell">Code</th>
              <th className="text-center py-3 px-2">Qty</th>
              <th className="text-right py-3 px-2">Price</th>
              <th className="text-right py-3 px-2">Total</th>
              <th className="py-3 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((invoiceItem, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-2">
                  <div className="font-medium">{invoiceItem.item.name}</div>
                  <div className="text-sm text-gray-500 sm:hidden">{invoiceItem.item.code}</div>
                </td>
                <td className="text-center py-3 px-2 text-sm text-gray-600 hidden sm:table-cell">
                  {invoiceItem.item.code}
                </td>
                <td className="text-center py-3 px-2">
                  <input
                    type="number"
                    min="1"
                    value={invoiceItem.quantity}
                    onChange={(e) => onUpdateQuantity(index, parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </td>
                <td className="text-right py-3 px-2">
                  <input
                    type="number"
                    step="0.01"
                    value={invoiceItem.price}
                    onChange={(e) => onUpdatePrice(index, parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </td>
                <td className="text-right py-3 px-2 font-medium">
                  ₹{invoiceItem.total.toFixed(2)}
                </td>
                <td className="text-center py-3 px-2">
                  <button
                    onClick={() => onRemoveItem(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t-2 border-gray-300 pt-4 space-y-2">
        <div className="flex justify-between text-gray-700">
          <span>Subtotal:</span>
          <span className="font-medium">₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>GST (18%):</span>
          <span className="font-medium">₹{tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
          <span>Total:</span>
          <span className="text-amber-600">₹{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}