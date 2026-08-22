import React, { useState, useEffect } from 'react';
import { fetchDebtorsApi, fetchCreditorsApi, addLedgerEntryApi, recordLedgerPaymentApi } from './api';

export default function DebtorsCreditorsLedgerView({ onAddReceipt }) {
  const [activeTab, setActiveTab] = useState('DEBTORS');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Form state for adding new customer/supplier entries
  const [newEntry, setNewEntry] = useState({
    name: '',
    phone: '',
    type: 'DEBTOR',
    amount: ''
  });

  const [debtors, setDebtors] = useState([
    { id: 'c-1', name: 'John Doe Builders', phone: '+256772123456', total_credit: 1250000, amount_paid: 800000, balance_due: 450000, store_credit: 0, status: 'OVERDUE' },
    { id: 'c-2', name: 'Apex Construction Ltd', phone: '+256701987654', total_credit: 3200000, amount_paid: 2000000, balance_due: 1200000, store_credit: 0, status: 'PENDING' },
    { id: 'c-3', name: 'Samuel Miller (Mukono)', phone: '+256782554433', total_credit: 0, amount_paid: 600000, balance_due: 0, store_credit: 600000, status: 'STORE CREDIT' }
  ]);

  const [creditors, setCreditors] = useState([
    { id: 's-1', name: 'Plumbing World Uganda', phone: '+256414123456', total_purchased: 4500000, amount_paid: 3000000, balance_due: 1500000, status: 'PENDING' },
    { id: 's-2', name: 'Roofings Ltd Supplies', phone: '+256414654321', total_purchased: 12000000, amount_paid: 12000000, balance_due: 0, status: 'CLEARED' }
  ]);

  useEffect(() => {
    fetchDebtorsApi().then(d => { if (d && d.length > 0) setDebtors(d); });
    fetchCreditorsApi().then(c => { if (c && c.length > 0) setCreditors(c); });
  }, []);

  // Transaction audit drawer
  const [auditDrawer, setAuditDrawer] = useState(null);
  const openAuditDrawer = async (item) => {
    let txns = [];
    try {
      const res = await fetch(`http://127.0.0.1:8000/ledger/transactions/${item.id}`);
      if (res.ok) txns = await res.json();
    } catch (_) {}
    if (!txns.length) {
      txns = [
        { type: activeTab === 'DEBTORS' ? 'CREDIT_EXTENDED' : 'PURCHASE_ON_CREDIT', amount: (item.total_credit || item.total_purchased || 0), timestamp: new Date(Date.now() - 86400000 * 7).toISOString(), note: 'Account opened' },
        ...(item.amount_paid > 0 ? [{ type: 'PAYMENT_RECEIVED', amount: item.amount_paid, payment_method: 'MTN Mobile Money', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), note: 'Payment received via MTN MoMo' }] : [])
      ];
    }
    setAuditDrawer({ entity: item, transactions: txns });
  };

  const currentList = activeTab === 'DEBTORS' ? debtors : creditors;

  const filteredList = currentList.filter(item => 
    (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (item.phone && item.phone.includes(searchTerm))
  );

  const totalDebtorsBalance = debtors.reduce((sum, d) => sum + (d.balance_due || 0), 0);
  const totalStoreCredits = debtors.reduce((sum, d) => sum + (d.store_credit || 0), 0);
  const totalCreditorsBalance = creditors.reduce((sum, c) => sum + (c.balance_due || 0), 0);

  const handlePrintReceipt = (receipt) => {
    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <html>
        <head>
          <title>Receipt ${receipt.id}</title>
          <style>
            body { font-family: monospace; padding: 20px; width: 300px; }
            h2 { text-align: center; margin-bottom: 5px; }
            .center { text-align: center; }
            .border { border-top: 1px dashed #000; margin: 10px 0; }
            .item { display: flex; justify-content: space-between; font-size: 12px; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>HardwareDesk Uganda</h2>
          <div class="center" style="font-size:11px;">Official Ledger Receipt (UGX)</div>
          <div class="border"></div>
          <div><strong>Receipt #:</strong> ${receipt.id}</div>
          <div><strong>Type:</strong> ${receipt.type_label}</div>
          <div><strong>Party:</strong> ${receipt.customer_name}</div>
          <div><strong>Date:</strong> ${new Date(receipt.timestamp).toLocaleString()}</div>
          <div><strong>Payment Method:</strong> ${receipt.payment_method}</div>
          <div class="border"></div>
          <div class="item bold font-size:14px;">
            <span>AMOUNT:</span>
            <span>UGX ${(receipt.total || 0).toLocaleString()}</span>
          </div>
          <div class="border"></div>
          <div class="center" style="font-size:10px; margin-top:15px;">Webale Nnyo / Thank you for your business!</div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    const val = parseFloat(newEntry.amount) || 0;

    if (newEntry.type === 'DEBTOR') {
      const entry = {
        id: `c-${Date.now()}`,
        name: newEntry.name,
        phone: newEntry.phone,
        total_credit: val,
        amount_paid: 0,
        balance_due: val,
        store_credit: 0,
        status: 'PENDING'
      };
      setDebtors([...debtors, entry]);
    } else if (newEntry.type === 'PREPAYMENT') {
      const entry = {
        id: `c-${Date.now()}`,
        name: newEntry.name,
        phone: newEntry.phone,
        total_credit: 0,
        amount_paid: val,
        balance_due: 0,
        store_credit: val,
        status: 'STORE CREDIT'
      };
      setDebtors([...debtors, entry]);

      const receipt = {
        id: `REC-PREPAY-${Math.floor(100000 + Math.random() * 900000)}`,
        type_label: 'Customer Prepayment / Store Credit',
        customer_name: newEntry.name,
        timestamp: new Date().toISOString(),
        payment_method: 'Cash',
        total: val,
        items: [{ name: 'Store Credit / Prepayment Deposit', quantity: 1, selling_price: val }]
      };
      if (onAddReceipt) onAddReceipt(receipt);
      handlePrintReceipt(receipt);
    } else if (newEntry.type === 'CREDITOR') {
      const entry = {
        id: `s-${Date.now()}`,
        name: newEntry.name,
        phone: newEntry.phone,
        total_purchased: val,
        amount_paid: 0,
        balance_due: val,
        status: 'PENDING'
      };
      setCreditors([...creditors, entry]);
    }

    // Backend sync
    await addLedgerEntryApi({
      name: newEntry.name,
      phone: newEntry.phone,
      type: newEntry.type,
      amount: val
    });

    setShowAddEntryModal(false);
    setNewEntry({ name: '', phone: '', type: 'DEBTOR', amount: '' });
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const pay = parseFloat(paymentAmount) || 0;
    let receiptPrefix = 'REC-DEBT-PAY-';
    let typeLabel = 'Debtor Balance Payment';

    if (activeTab === 'DEBTORS') {
      setDebtors(debtors.map(d => {
        if (d.id === showPaymentModal.id) {
          const newBal = Math.max(0, d.balance_due - pay);
          return { ...d, amount_paid: d.amount_paid + pay, balance_due: newBal, status: newBal === 0 ? 'CLEARED' : d.status };
        }
        return d;
      }));
    } else {
      receiptPrefix = 'REC-SUP-PAY-';
      typeLabel = 'Supplier Creditor Payment';
      setCreditors(creditors.map(c => {
        if (c.id === showPaymentModal.id) {
          const newBal = Math.max(0, c.balance_due - pay);
          return { ...c, amount_paid: c.amount_paid + pay, balance_due: newBal, status: newBal === 0 ? 'CLEARED' : c.status };
        }
        return c;
      }));
    }

    // Backend API sync
    await recordLedgerPaymentApi({
      entity_type: activeTab === 'DEBTORS' ? 'DEBTOR' : 'CREDITOR',
      entity_id: showPaymentModal.id,
      amount: pay,
      payment_method: paymentMethod
    });

    const receipt = {
      id: `${receiptPrefix}${Math.floor(100000 + Math.random() * 900000)}`,
      type_label: typeLabel,
      customer_name: showPaymentModal.name,
      timestamp: new Date().toISOString(),
      payment_method: paymentMethod,
      total: pay,
      items: [{ name: `${typeLabel} for ${showPaymentModal.name}`, quantity: 1, selling_price: pay }]
    };

    if (onAddReceipt) onAddReceipt(receipt);
    handlePrintReceipt(receipt);

    setShowPaymentModal(null);
    setPaymentAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => setActiveTab('DEBTORS')}
          className={`p-4 rounded-lg shadow-sm border cursor-pointer transition ${activeTab === 'DEBTORS' ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400' : 'bg-white border-gray-200'}`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-amber-900 uppercase">Customers Owe Us (Debtors)</span>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2">UGX {totalDebtorsBalance.toLocaleString()}</p>
          <span className="text-xs text-gray-500">Uncollected customer credit sales</span>
        </div>

        <div 
          onClick={() => setActiveTab('DEBTORS')}
          className="p-4 rounded-lg shadow-sm border bg-green-50 border-green-200 cursor-pointer"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-green-900 uppercase">Customer Store Credits / Prepayments</span>
          </div>
          <p className="text-2xl font-bold text-green-700 mt-2">UGX {totalStoreCredits.toLocaleString()}</p>
          <span className="text-xs text-green-800">Prepaid orders / Balance kept for future sales</span>
        </div>

        <div 
          onClick={() => setActiveTab('CREDITORS')}
          className={`p-4 rounded-lg shadow-sm border cursor-pointer transition ${activeTab === 'CREDITORS' ? 'bg-slate-100 border-slate-700 ring-1 ring-slate-700' : 'bg-white border-gray-200'}`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-800 uppercase">We Owe Suppliers (Creditors)</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">UGX {totalCreditorsBalance.toLocaleString()}</p>
          <span className="text-xs text-gray-500">Unpaid supplier stock purchases</span>
        </div>
      </div>

      {/* Main Ledger Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Controls & Search */}
        <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setActiveTab('DEBTORS')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition ${activeTab === 'DEBTORS' ? 'bg-amber-500 text-slate-900 shadow' : 'bg-white border text-gray-700'}`}
            >
              Debtors & Store Credits (Customers)
            </button>
            <button 
              onClick={() => setActiveTab('CREDITORS')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition ${activeTab === 'CREDITORS' ? 'bg-slate-900 text-white shadow' : 'bg-white border text-gray-700'}`}
            >
              Creditors Ledger (Suppliers)
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowAddEntryModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-3 py-1.5 rounded text-xs transition shadow-sm"
            >
              + Add New Entry
            </button>
            <input 
              type="text" 
              placeholder={`Search ${activeTab === 'DEBTORS' ? 'Customer' : 'Supplier'} Name or Phone...`} 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-xs w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
            />
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-gray-700 text-xs uppercase border-b">
              <tr>
                <th className="py-3 px-4">{activeTab === 'DEBTORS' ? 'Customer Name' : 'Supplier Name'}</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">{activeTab === 'DEBTORS' ? 'Total Credit (UGX)' : 'Total Invoiced (UGX)'}</th>
                <th className="py-3 px-4">Amount Paid (UGX)</th>
                <th className="py-3 px-4">Balance Due (UGX)</th>
                {activeTab === 'DEBTORS' && <th className="py-3 px-4">Store Credit (UGX)</th>}
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredList.map(item => {
                const totalAmount = item.total_credit !== undefined ? item.total_credit : (item.total_purchased || 0);
                const isPrepaid = item.store_credit && item.store_credit > 0;
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold text-gray-900">{item.name}</td>
                    <td className="py-3 px-4 text-xs text-gray-600 font-mono">{item.phone}</td>
                    <td className="py-3 px-4 text-gray-700">UGX {totalAmount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-green-600 font-medium">UGX {(item.amount_paid || 0).toLocaleString()}</td>
                    <td className={`py-3 px-4 font-bold ${item.balance_due > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      UGX {(item.balance_due || 0).toLocaleString()}
                    </td>
                    {activeTab === 'DEBTORS' && (
                      <td className="py-3 px-4 font-bold text-green-700">
                        {isPrepaid ? `UGX ${item.store_credit.toLocaleString()}` : 'UGX 0'}
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                        isPrepaid ? 'bg-blue-100 text-blue-800' :
                        item.status === 'CLEARED' ? 'bg-green-100 text-green-800' :
                        item.status === 'OVERDUE' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isPrepaid ? 'PREPAID CREDIT' : item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {item.balance_due > 0 && (
                        <button 
                          onClick={() => setShowPaymentModal(item)}
                          className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-2.5 py-1 rounded transition shadow-sm"
                        >
                          Record Payment
                        </button>
                      )}
                      {isPrepaid && (
                        <span className="text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-1 rounded border border-blue-200">
                          Available for Sale
                        </span>
                      )}
                      <button
                        onClick={() => openAuditDrawer(item)}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded transition"
                        title="View transaction history"
                      >
                        📋 History
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2">
              Record Payment: {showPaymentModal.name}
            </h3>
            <form onSubmit={handleRecordPayment} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Balance Due</label>
                <div className="font-bold text-red-600 text-lg">UGX {(showPaymentModal.balance_due || 0).toLocaleString()}</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Amount (UGX)</label>
                <input 
                  required 
                  type="number" 
                  placeholder="e.g. 200000" 
                  className="w-full border rounded px-3 py-1.5 font-bold" 
                  value={paymentAmount} 
                  onChange={e => setPaymentAmount(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Method & Network</label>
                <select 
                  className="w-full border rounded px-3 py-1.5 font-semibold text-xs" 
                  value={paymentMethod} 
                  onChange={e => setPaymentMethod(e.target.value)}
                >
                  <option value="Cash">💵 Cash</option>
                  <option value="MTN Mobile Money">🟡 MTN Mobile Money (MoMo)</option>
                  <option value="Airtel Money">🔴 Airtel Money</option>
                  <option value="Bank Transfer">🏦 Bank Transfer</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button 
                  type="button" 
                  onClick={() => setShowPaymentModal(null)} 
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-900 rounded"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Entry Modal */}
      {showAddEntryModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2">
              Add New Account / Entry (UGX)
            </h3>
            <form onSubmit={handleAddEntry} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Entry Type</label>
                <select 
                  className="w-full border rounded px-3 py-1.5"
                  value={newEntry.type}
                  onChange={e => setNewEntry({ ...newEntry, type: e.target.value })}
                >
                  <option value="DEBTOR">Customer Credit Sale (Debtor)</option>
                  <option value="PREPAYMENT">Customer Prepayment / Store Credit</option>
                  <option value="CREDITOR">Supplier Purchase (Creditor)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name (Customer or Supplier)</label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. Samuel Mukasa" 
                  className="w-full border rounded px-3 py-1.5" 
                  value={newEntry.name} 
                  onChange={e => setNewEntry({ ...newEntry, name: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                <input 
                  type="text" 
                  placeholder="+256772000000" 
                  className="w-full border rounded px-3 py-1.5" 
                  value={newEntry.phone} 
                  onChange={e => setNewEntry({ ...newEntry, phone: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  {newEntry.type === 'PREPAYMENT' ? 'Prepayment Deposit (UGX)' : 'Initial Balance Amount (UGX)'}
                </label>
                <input 
                  required 
                  type="number" 
                  placeholder="e.g. 500000" 
                  className="w-full border rounded px-3 py-1.5" 
                  value={newEntry.amount} 
                  onChange={e => setNewEntry({ ...newEntry, amount: e.target.value })} 
                />
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button 
                  type="button" 
                  onClick={() => setShowAddEntryModal(false)} 
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-900 rounded"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Audit Drawer */}
      {auditDrawer && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Transaction History</h3>
                <p className="text-xs text-gray-500 mt-0.5">{auditDrawer.entity.name} · {auditDrawer.entity.phone}</p>
              </div>
              <button onClick={() => setAuditDrawer(null)} className="text-gray-400 hover:text-gray-700 text-lg font-bold leading-none">✕</button>
            </div>

            {/* Summary strip */}
            <div className="grid grid-cols-3 gap-px bg-gray-100 border-b text-center text-xs">
              <div className="bg-white p-3">
                <div className="text-gray-500 font-semibold uppercase">Total Credit</div>
                <div className="font-bold text-gray-900 mt-0.5">UGX {(auditDrawer.entity.total_credit || auditDrawer.entity.total_purchased || 0).toLocaleString()}</div>
              </div>
              <div className="bg-white p-3">
                <div className="text-green-600 font-semibold uppercase">Amount Paid</div>
                <div className="font-bold text-green-700 mt-0.5">UGX {(auditDrawer.entity.amount_paid || 0).toLocaleString()}</div>
              </div>
              <div className="bg-white p-3">
                <div className="text-red-600 font-semibold uppercase">Balance Due</div>
                <div className="font-bold text-red-700 mt-0.5">UGX {(auditDrawer.entity.balance_due || 0).toLocaleString()}</div>
              </div>
            </div>

            {/* Transactions list */}
            <div className="overflow-y-auto flex-1 divide-y divide-gray-100">
              {auditDrawer.transactions.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs">No transaction history found.</div>
              ) : auditDrawer.transactions.map((tx, i) => {
                const typeColors = {
                  CREDIT_EXTENDED: 'bg-red-100 text-red-800',
                  PURCHASE_ON_CREDIT: 'bg-red-100 text-red-800',
                  PAYMENT_RECEIVED: 'bg-green-100 text-green-800',
                  PAYMENT_MADE: 'bg-green-100 text-green-800',
                  PREPAYMENT: 'bg-blue-100 text-blue-800'
                };
                const typeLabel = {
                  CREDIT_EXTENDED: 'Credit Extended',
                  PURCHASE_ON_CREDIT: 'Purchase on Credit',
                  PAYMENT_RECEIVED: 'Payment Received',
                  PAYMENT_MADE: 'Payment Made',
                  PREPAYMENT: 'Store Credit Deposit'
                };
                return (
                  <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${typeColors[tx.type] || 'bg-gray-100 text-gray-800'}`}>
                        {typeLabel[tx.type] || tx.type}
                      </span>
                      <div>
                        <div className="text-xs text-gray-500">{new Date(tx.timestamp).toLocaleString()}</div>
                        {tx.note && <div className="text-xs text-gray-400">{tx.note}</div>}
                        {tx.payment_method && <div className="text-xs text-gray-400">via {tx.payment_method}</div>}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-gray-900">UGX {(tx.amount || 0).toLocaleString()}</div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t bg-gray-50">
              <button
                onClick={() => setAuditDrawer(null)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
