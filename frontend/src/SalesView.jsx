import React, { useState, useEffect, useRef } from 'react';
import { processSaleApi } from './api';

export default function SalesView({ products, onSaleComplete }) {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [completedSale, setCompletedSale] = useState(null);
  const [receiptFormat, setReceiptFormat] = useState('thermal'); // 'thermal' | 'a4'
  const searchRef = useRef(null);

  const mockCustomers = [
    { id: 'c-1', name: 'John Doe Builders', store_credit: 0 },
    { id: 'c-2', name: 'Apex Construction', store_credit: 0 },
    { id: 'c-3', name: 'Samuel Miller', store_credit: 500000 }
  ];

  const custObj = mockCustomers.find(c => c.id === selectedCustomer);
  const availableCredit = custObj ? custObj.store_credit : 0;

  // Global barcode scanner listener — any keystrokes while not in an input auto-focus and fill the search box
  useEffect(() => {
    let buffer = '';
    let timer = null;
    const handleKey = (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      if (e.key === 'Enter') {
        if (buffer.length > 3) {
          setSearch(buffer);
          if (searchRef.current) searchRef.current.focus();
        }
        buffer = '';
        clearTimeout(timer);
        return;
      }
      if (e.key.length === 1) {
        buffer += e.key;
        clearTimeout(timer);
        timer = setTimeout(() => { buffer = ''; }, 100);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const activeProducts = products || [];

  const filteredProducts = activeProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search))
  );

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock_quantity) return;
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      if (product.stock_quantity <= 0) return;
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);

  const handlePrint = (receipt) => {
    const isThermal = receiptFormat === 'thermal';
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt ${receipt.id}</title>
          <style>
            ${isThermal ? `
              body { font-family: monospace; padding: 10px; width: 300px; font-size: 12px; }
              h2 { text-align: center; font-size: 14px; margin-bottom: 4px; }
              .center { text-align: center; }
              .border { border-top: 1px dashed #000; margin: 8px 0; }
              .item { display: flex; justify-content: space-between; font-size: 11px; }
              .bold { font-weight: bold; }
            ` : `
              body { font-family: Arial, sans-serif; padding: 40px; max-width: 700px; margin: 0 auto; font-size: 13px; color: #111; }
              h2 { font-size: 20px; margin-bottom: 4px; }
              .subtitle { color: #555; font-size: 12px; margin-bottom: 20px; }
              .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 12px; }
              th { background: #f7f7f7; font-weight: bold; }
              .total { font-size: 16px; font-weight: bold; text-align: right; }
              .footer { color: #999; font-size: 11px; margin-top: 30px; text-align: center; }
              .border { border-top: 1px solid #eee; margin: 12px 0; }
            `}
          </style>
        </head>
        <body>
          <h2>HardwareDesk Uganda</h2>
          ${isThermal ? `
            <div class="center" style="font-size:11px;">Hardware Store Management (UGX)</div>
            <div class="border"></div>
            <div><strong>Receipt #:</strong> ${receipt.id}</div>
            <div><strong>Date:</strong> ${new Date(receipt.timestamp).toLocaleString()}</div>
            <div><strong>Payment:</strong> ${receipt.payment_method}</div>
            <div class="border"></div>
            ${receipt.items.map(i => `
              <div class="item">
                <span>${i.quantity}x ${i.name}</span>
                <span>UGX ${(i.selling_price * i.quantity).toLocaleString()}</span>
              </div>
            `).join('')}
            <div class="border"></div>
            <div class="item bold"><span>TOTAL:</span><span>UGX ${receipt.total.toLocaleString()}</span></div>
            <div class="border"></div>
            <div class="center" style="font-size:10px; margin-top:15px;">Webale Nnyo / Thank you for your business!</div>
          ` : `
            <div class="subtitle">Official Sale Tax Invoice</div>
            <div class="meta">
              <div>
                <div><strong>Receipt #:</strong> ${receipt.id}</div>
                <div><strong>Payment Method:</strong> ${receipt.payment_method}</div>
              </div>
              <div style="text-align:right;">
                <div><strong>Date:</strong> ${new Date(receipt.timestamp).toLocaleString()}</div>
              </div>
            </div>
            <table>
              <thead><tr><th>Item</th><th>Qty</th><th>Unit Price (UGX)</th><th>Subtotal (UGX)</th></tr></thead>
              <tbody>
                ${receipt.items.map(i => `
                  <tr>
                    <td>${i.name}</td>
                    <td>${i.quantity}</td>
                    <td>UGX ${i.selling_price.toLocaleString()}</td>
                    <td>UGX ${(i.selling_price * i.quantity).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total">TOTAL: UGX ${receipt.total.toLocaleString()}</div>
            <div class="footer">HardwareDesk — Webale Nnyo / Thank you for your business!</div>
          `}
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const saleRecord = {
      id: `REC-${Math.floor(100000 + Math.random() * 900000)}`,
      total: totalAmount,
      payment_method: paymentMethod,
      timestamp: new Date().toISOString(),
      items: cart
    };
    
    setCompletedSale(saleRecord);

    // Sync with FastAPI backend
    await processSaleApi({
      items: cart.map(i => ({ product_id: i.id, quantity: i.quantity, unit_price: i.selling_price })),
      payment_method: paymentMethod,
      amount_paid: totalAmount
    });

    if (onSaleComplete) {
      onSaleComplete(saleRecord);
    }
    setCart([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Selection Panel */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center gap-3">
          <input 
            ref={searchRef}
            type="text" 
            placeholder="🔍 Scan Barcode or Search product..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            autoFocus
          />
          <div className="flex items-center space-x-1 bg-slate-100 rounded px-1 py-1">
            <button
              onClick={() => setReceiptFormat('thermal')}
              className={`text-xs font-semibold px-2 py-1 rounded transition ${receiptFormat === 'thermal' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
              title="80mm Thermal Receipt"
            >
              🧾 80mm
            </button>
            <button
              onClick={() => setReceiptFormat('a4')}
              className={`text-xs font-semibold px-2 py-1 rounded transition ${receiptFormat === 'a4' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
              title="A4 Invoice"
            >
              📄 A4
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredProducts.length === 0 ? (
            <div className="col-span-2 bg-white p-8 rounded-lg border text-center text-gray-400 text-sm">
              No products found matching "{search}".
            </div>
          ) : (
            filteredProducts.map(p => (
              <div 
                key={p.id} 
                onClick={() => addToCart(p)}
                className={`p-3 bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:border-amber-500 transition ${p.stock_quantity === 0 ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">{p.name}</h4>
                    <span className="text-xs text-gray-400 font-mono">{p.sku}</span>
                  </div>
                  <span className="font-bold text-amber-600">UGX {(p.selling_price || 0).toLocaleString()}</span>
                </div>
                <div className="mt-2 flex justify-between items-center text-xs">
                  <span className={`font-semibold ${p.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Stock: {p.stock_quantity} {p.unit || 'pcs'}
                  </span>
                  <button className="bg-amber-100 text-amber-800 font-medium px-2 py-0.5 rounded hover:bg-amber-200">
                    + Add
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cart & Checkout Panel */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between h-[520px]">
        <div>
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-b pb-2 mb-3">Quick POS Sale (UGX)</h2>
          
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">Cart is empty. Select products on the left.</p>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm border border-gray-100">
                  <div>
                    <div className="font-medium text-gray-800 text-xs">{item.name}</div>
                    <div className="text-xs text-gray-500">UGX {(item.selling_price || 0).toLocaleString()} each</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-0.5 bg-gray-200 rounded font-bold text-xs">-</button>
                    <span className="font-bold text-xs">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="px-2 py-0.5 bg-gray-200 rounded font-bold text-xs">+</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t pt-3 space-y-3">
          <div className="flex justify-between items-center font-bold text-lg text-gray-900">
            <span>Total:</span>
            <span className="text-amber-600">UGX {totalAmount.toLocaleString()}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Customer (Optional for Store Credit)</label>
            <select 
              value={selectedCustomer} 
              onChange={e => setSelectedCustomer(e.target.value)}
              className="w-full border rounded px-3 py-1.5 text-xs mb-2"
            >
              <option value="">Walk-in Customer</option>
              {mockCustomers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.store_credit > 0 ? `(UGX ${c.store_credit.toLocaleString()} Store Credit)` : ''}
                </option>
              ))}
            </select>

            <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Method & Network</label>
            <select 
              value={paymentMethod} 
              onChange={e => setPaymentMethod(e.target.value)}
              className="w-full border rounded px-3 py-1.5 text-xs font-semibold"
            >
              <option value="Cash">💵 Cash</option>
              <option value="MTN Mobile Money">🟡 MTN Mobile Money (MoMo)</option>
              <option value="Airtel Money">🔴 Airtel Money</option>
              <option value="Bank Transfer">🏦 Bank Transfer</option>
              {availableCredit > 0 && <option value="Store Credit">💳 Use Store Credit (UGX {availableCredit.toLocaleString()})</option>}
              <option value="Customer Credit">📝 Customer Debt / Credit</option>
            </select>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-2.5 rounded font-bold text-sm transition ${cart.length > 0 ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 shadow' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            Complete Sale
          </button>
        </div>
      </div>

      {/* Sale Complete Receipt Modal */}
      {completedSale && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold mb-2">✓</div>
              <h3 className="text-lg font-bold text-gray-900">Sale Completed!</h3>
              <p className="text-xs text-gray-500 font-mono">{completedSale.id}</p>
            </div>

            <div className="border-t border-b py-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Payment:</span>
                <span className="font-semibold">{completedSale.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Amount:</span>
                <span className="font-bold text-amber-600 text-sm">UGX {completedSale.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => handlePrint(completedSale)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 rounded text-xs transition flex items-center justify-center space-x-2"
              >
                <span>🖨 Print {receiptFormat === 'thermal' ? '80mm Receipt' : 'A4 Invoice'}</span>
              </button>
              <button 
                onClick={() => setCompletedSale(null)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded text-xs transition"
              >
                Close & Next Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
