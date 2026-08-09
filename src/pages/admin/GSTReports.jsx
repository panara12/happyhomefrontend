import { useState } from 'react';
import { FileText, Download, Calendar, TrendingUp, TrendingDown } from 'lucide-react';

export default function GSTReports() {
  const [selectedMonth, setSelectedMonth] = useState('2026-04');
  const [activeReport, setActiveReport] = useState('gstr1');

  // Mock GST Data
  const gstr1Data = {
    outwardSupplies: {
      b2b: { invoices: 45, taxableValue: 1250000, cgst: 112500, sgst: 112500, igst: 0 },
      b2c: { invoices: 156, taxableValue: 450000, cgst: 40500, sgst: 40500, igst: 0 },
      exports: { invoices: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0 }
    },
    totalTaxLiability: 306000
  };

  const gstr2Data = {
    inwardSupplies: {
      b2b: { invoices: 12, taxableValue: 850000, cgst: 76500, sgst: 76500, igst: 0 },
      importOfGoods: { invoices: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0 },
      rcm: { invoices: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0 }
    },
    totalInputCredit: 153000
  };

  const gstr3bData = {
    outwardSupplies: {
      taxableValue: 1700000,
      integratedTax: 0,
      centralTax: 153000,
      stateUTTax: 153000,
      cess: 0
    },
    inwardSupplies: {
      taxableValue: 850000,
      integratedTax: 0,
      centralTax: 76500,
      stateUTTax: 76500,
      cess: 0
    },
    netTaxLiability: {
      centralTax: 76500,
      stateUTTax: 76500,
      integratedTax: 0,
      cess: 0
    },
    interestPenalty: {
      interest: 0,
      lateFee: 0,
      penalty: 0,
      others: 0
    }
  };

  const renderGSTR1 = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6">
        <h3 className="text-2xl font-bold mb-2">GSTR-1 - Outward Supplies</h3>
        <p className="text-blue-100">Details of outward supplies of goods and/or services</p>
        <p className="text-sm mt-2">Period: {new Date(selectedMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-800">B2B Invoices</h4>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800 mb-2">{gstr1Data.outwardSupplies.b2b.invoices}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Taxable Value:</span>
              <span className="font-medium">₹{gstr1Data.outwardSupplies.b2b.taxableValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">CGST:</span>
              <span className="font-medium">₹{gstr1Data.outwardSupplies.b2b.cgst.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">SGST:</span>
              <span className="font-medium">₹{gstr1Data.outwardSupplies.b2b.sgst.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-800">B2C Invoices</h4>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800 mb-2">{gstr1Data.outwardSupplies.b2c.invoices}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Taxable Value:</span>
              <span className="font-medium">₹{gstr1Data.outwardSupplies.b2c.taxableValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">CGST:</span>
              <span className="font-medium">₹{gstr1Data.outwardSupplies.b2c.cgst.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">SGST:</span>
              <span className="font-medium">₹{gstr1Data.outwardSupplies.b2c.sgst.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-800">Exports</h4>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-purple-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800 mb-2">{gstr1Data.outwardSupplies.exports.invoices}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Taxable Value:</span>
              <span className="font-medium">₹{gstr1Data.outwardSupplies.exports.taxableValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">IGST:</span>
              <span className="font-medium">₹{gstr1Data.outwardSupplies.exports.igst.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xl font-bold text-gray-800">Total Tax Liability (Outward)</h4>
            <p className="text-sm text-gray-600 mt-1">Total GST collected on sales</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-amber-600">₹{gstr1Data.totalTaxLiability.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGSTR2 = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6">
        <h3 className="text-2xl font-bold mb-2">GSTR-2 - Inward Supplies</h3>
        <p className="text-green-100">Details of inward supplies of goods and/or services</p>
        <p className="text-sm mt-2">Period: {new Date(selectedMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-800">B2B Purchases</h4>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="text-green-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800 mb-2">{gstr2Data.inwardSupplies.b2b.invoices}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Taxable Value:</span>
              <span className="font-medium">₹{gstr2Data.inwardSupplies.b2b.taxableValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">CGST:</span>
              <span className="font-medium">₹{gstr2Data.inwardSupplies.b2b.cgst.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">SGST:</span>
              <span className="font-medium">₹{gstr2Data.inwardSupplies.b2b.sgst.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-800">Import of Goods</h4>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800 mb-2">{gstr2Data.inwardSupplies.importOfGoods.invoices}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Taxable Value:</span>
              <span className="font-medium">₹{gstr2Data.inwardSupplies.importOfGoods.taxableValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">IGST:</span>
              <span className="font-medium">₹{gstr2Data.inwardSupplies.importOfGoods.igst.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-800">RCM Purchases</h4>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="text-purple-600" size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-800 mb-2">{gstr2Data.inwardSupplies.rcm.invoices}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Taxable Value:</span>
              <span className="font-medium">₹{gstr2Data.inwardSupplies.rcm.taxableValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">CGST:</span>
              <span className="font-medium">₹{gstr2Data.inwardSupplies.rcm.cgst.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">SGST:</span>
              <span className="font-medium">₹{gstr2Data.inwardSupplies.rcm.sgst.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xl font-bold text-gray-800">Total Input Tax Credit (ITC)</h4>
            <p className="text-sm text-gray-600 mt-1">Total GST paid on purchases (can be claimed)</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-green-600">₹{gstr2Data.totalInputCredit.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGSTR3B = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6">
        <h3 className="text-2xl font-bold mb-2">GSTR-3B - Monthly Return</h3>
        <p className="text-purple-100">Summary of outward and inward supplies along with tax payment</p>
        <p className="text-sm mt-2">Period: {new Date(selectedMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h4 className="text-lg font-bold text-gray-800 mb-4">Outward Supplies (Tax Liability)</h4>
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-gray-700">Taxable Value:</span>
              <span className="font-bold text-gray-800">₹{gstr3bData.outwardSupplies.taxableValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Integrated Tax:</span>
              <span className="font-medium text-gray-800">₹{gstr3bData.outwardSupplies.integratedTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Central Tax:</span>
              <span className="font-medium text-gray-800">₹{gstr3bData.outwardSupplies.centralTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">State/UT Tax:</span>
              <span className="font-medium text-gray-800">₹{gstr3bData.outwardSupplies.stateUTTax.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h4 className="text-lg font-bold text-gray-800 mb-4">Inward Supplies (ITC Available)</h4>
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-gray-700">Taxable Value:</span>
              <span className="font-bold text-gray-800">₹{gstr3bData.inwardSupplies.taxableValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Integrated Tax:</span>
              <span className="font-medium text-gray-800">₹{gstr3bData.inwardSupplies.integratedTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Central Tax:</span>
              <span className="font-medium text-gray-800">₹{gstr3bData.inwardSupplies.centralTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">State/UT Tax:</span>
              <span className="font-medium text-gray-800">₹{gstr3bData.inwardSupplies.stateUTTax.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 rounded-xl p-6">
        <h4 className="text-xl font-bold text-gray-800 mb-4">Net Tax Liability (Payable)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Central Tax Payable</p>
            <p className="text-2xl font-bold text-orange-600">₹{gstr3bData.netTaxLiability.centralTax.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">State/UT Tax Payable</p>
            <p className="text-2xl font-bold text-orange-600">₹{gstr3bData.netTaxLiability.stateUTTax.toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-orange-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-800">Total Tax Payable:</span>
            <span className="text-3xl font-bold text-orange-600">
              ₹{(gstr3bData.netTaxLiability.centralTax + gstr3bData.netTaxLiability.stateUTTax).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">GST Reports</h2>
          <p className="text-gray-600 mt-1">View and download GST returns</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-300">
            <Calendar size={20} className="text-gray-500" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="outline-none"
            />
          </div>
          <button className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg">
            <Download size={20} />
            Export
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="bg-white rounded-xl shadow-md p-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveReport('gstr1')}
            className={`flex-1 min-w-fit px-6 py-3 rounded-lg font-medium transition-all ${
              activeReport === 'gstr1'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            GSTR-1
          </button>
          <button
            onClick={() => setActiveReport('gstr2')}
            className={`flex-1 min-w-fit px-6 py-3 rounded-lg font-medium transition-all ${
              activeReport === 'gstr2'
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            GSTR-2
          </button>
          <button
            onClick={() => setActiveReport('gstr3b')}
            className={`flex-1 min-w-fit px-6 py-3 rounded-lg font-medium transition-all ${
              activeReport === 'gstr3b'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            GSTR-3B
          </button>
        </div>
      </div>

      {/* Report Content */}
      {activeReport === 'gstr1' && renderGSTR1()}
      {activeReport === 'gstr2' && renderGSTR2()}
      {activeReport === 'gstr3b' && renderGSTR3B()}
    </div>
  );
}