import { useState, useEffect } from 'react';
import { Download, Upload, Search, Filter, Trash2, Loader2 } from 'lucide-react';
import api from '../utils/api';

const Transactions = ({ user }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  
  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹';

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
    } catch (error) {
      console.error(error);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/sheets/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transactions.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed', error);
    }
  };

  const handleDownloadSample = () => {
    const csvContent = "date,amount,type,category,title\n2023-10-01,1500,income,Salary,October Salary\n2023-10-02,45.50,expense,Food,Grocery Store\n2023-10-05,120,expense,Utilities,Electric Bill\n2023-10-10,500,income,Freelance,Web Design Project";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_transactions.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);

    try {
      await api.post('/sheets/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchTransactions();
      setFile(null);
    } catch (error) {
      console.error('Import failed', error);
    } finally {
      setUploading(false);
    }
  };

  const filteredData = transactions.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">Ledger</h2>
          <p className="text-slate-400">Manage and view all your financial records.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors border border-slate-700"
          >
            <Download size={18} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between border border-dashed border-slate-600 bg-slate-800/20">
        <div>
          <h4 className="text-white font-medium mb-1">Bulk Import</h4>
          <p className="text-sm text-slate-400 mb-2">Upload a CSV bank statement to automatically log entries.</p>
          <button onClick={handleDownloadSample} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
            <Download size={14} /> Download Sample CSV Template
          </button>
        </div>
        <form onSubmit={handleImport} className="flex gap-3 w-full md:w-auto">
          <input 
            type="file" 
            accept=".csv" 
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full text-sm text-slate-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-xl file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-500/10 file:text-blue-400
              hover:file:bg-blue-500/20 cursor-pointer"
          />
          <button 
            type="submit"
            disabled={!file || uploading}
            className="px-4 py-2 bg-blue-600 disabled:opacity-50 text-white rounded-xl flex items-center gap-2 transition-colors shrink-0"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            <span>Import</span>
          </button>
        </form>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search transactions..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/30 text-slate-400 text-sm">
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8"><Loader2 className="animate-spin mx-auto text-blue-500" /></td></tr>
              ) : filteredData.map((t) => (
                <tr key={t._id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-200">{t.title}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-slate-800 rounded-full text-xs font-medium text-slate-300">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {new Date(t.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-200">
                    {currencySymbol}{t.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(t._id)}
                      className="text-slate-400 hover:text-red-400 p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
