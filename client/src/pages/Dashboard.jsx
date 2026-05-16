import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Plus, Trash2 } from 'lucide-react';
import api from '../utils/api';

const Dashboard = ({ user }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalBalance: 0, income: 0, expense: 0 });
  const [showModal, setShowModal] = useState(false);
  const [aiTip, setAiTip] = useState("Analyzing your recent spending habits to provide personalized advice...");
  
  const [newTx, setNewTx] = useState({ title: '', amount: '', type: 'expense', category: 'Food' });

  const currencySymbol = user?.currency === 'USD' ? '$' : user?.currency === 'EUR' ? '€' : '₹';

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/transactions');
      const data = res.data.data;
      setTransactions(data);
      
      const cycleStartDay = user?.budgetCycleStartDate || 1;
      const now = new Date();
      let cycleStartDate = new Date(now.getFullYear(), now.getMonth(), cycleStartDay);
      if (now.getDate() < cycleStartDay) {
        cycleStartDate.setMonth(cycleStartDate.getMonth() - 1);
      }

      let income = 0;
      let expense = 0;
      
      data.forEach(t => {
        const tDate = new Date(t.date);
        if (tDate >= cycleStartDate) {
          if (t.type === 'income') income += t.amount;
          else expense += t.amount;
        }
      });
      setStats({ totalBalance: income - expense, income, expense });
      
      if (expense > income * 0.8 && income > 0) {
        setAiTip(`Alert: Your expenses are over 80% of your income for this cycle. Consider reviewing your top spending categories.`);
      } else {
        setAiTip(`Great job! Your spending is well within a healthy range for this cycle.`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transactions', { ...newTx, amount: Number(newTx.amount) });
      setShowModal(false);
      setNewTx({ title: '', amount: '', type: 'expense', category: 'Food' });
      fetchTransactions();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-6 py-1"><div className="h-40 bg-slate-800 rounded-2xl"></div></div></div>;

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">Dashboard</h2>
          <p className="text-slate-400">Welcome back, {user?.name.split(' ')[0]}. Here's your financial overview.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all"
        >
          <Plus size={18} />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Total Balance</p>
              <h3 className="text-3xl font-bold text-white">{currencySymbol}{stats.totalBalance.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Wallet className="text-blue-400" size={24} />
            </div>
          </div>
        </div>
        
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Monthly Income</p>
              <h3 className="text-3xl font-bold text-emerald-400">{currencySymbol}{stats.income.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <ArrowUpRight className="text-emerald-400" size={24} />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-slate-400 mb-1">Monthly Expenses</p>
              <h3 className="text-3xl font-bold text-red-400">{currencySymbol}{stats.expense.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl">
              <ArrowDownRight className="text-red-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* AI Coach Widget */}
      <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden group cursor-pointer hover:border-blue-500/40 transition-all">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-32 -mt-32 transition-transform group-hover:scale-150"></div>
        <div className="relative z-10 flex gap-4 items-start">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <TrendingUp className="text-blue-400" size={24} />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-1">AI Financial Coach</h4>
            <p className="text-slate-300 text-sm leading-relaxed">{aiTip}</p>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <h3 className="text-xl font-bold text-white">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/30 text-slate-400 text-sm">
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {transactions.slice(0, 5).map((t) => (
                <tr key={t._id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-200">{t.title}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-slate-800 rounded-full text-xs font-medium text-slate-300">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {new Date(t.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.type === 'income' ? '+' : '-'}{currencySymbol}{t.amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(t._id)}
                      className="text-slate-400 hover:text-red-400 transition-colors p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    No transactions found. Click "Add Transaction" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl border-slate-600">
            <h3 className="text-xl font-bold text-white mb-6">Add Transaction</h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Type</label>
                <select 
                  value={newTx.type} 
                  onChange={(e) => setNewTx({...newTx, type: e.target.value})}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                <input 
                  type="text" required
                  value={newTx.title} 
                  onChange={(e) => setNewTx({...newTx, title: e.target.value})}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Grocery Shopping"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Amount ({currencySymbol})</label>
                  <input 
                    type="number" required min="0" step="0.01"
                    value={newTx.amount} 
                    onChange={(e) => setNewTx({...newTx, amount: e.target.value})}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
                  <input 
                    type="text" required
                    value={newTx.category} 
                    onChange={(e) => setNewTx({...newTx, category: e.target.value})}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Food"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
