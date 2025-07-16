import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinancial } from '../../context/FinancialContext';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Settings, 
  LogOut, 
  DollarSign,
  Plus
} from 'lucide-react';
import DashboardContent from './DashboardContent';
import IncomeView from '../Views/IncomeView';
import ExpenseView from '../Views/ExpenseView';
import ReportsView from '../Views/ReportsView';
import SettingsView from '../Views/SettingsView';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { transactions } = useFinancial();
  const [activeView, setActiveView] = useState<string>('dashboard');

  // Obter mês e ano atuais
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Filtrar transações do mês atual
  const currentMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear;
  });

  // Filtrar transações do ano atual
  const currentYearTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getFullYear() === currentYear;
  });

  // Cálculos para o mês atual (Resumo Rápido)
  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpense = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyBalance = monthlyIncome - monthlyExpense;

  // Cálculos para o ano atual (Cards principais)
  const yearlyIncome = currentYearTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const yearlyExpense = currentYearTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const yearlyBalance = yearlyIncome - yearlyExpense;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardContent 
            transactions={transactions}
          />
        );
      case 'income':
        return <IncomeView />;
      case 'expense':
        return <ExpenseView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <div className="flex items-center mr-8">
              <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                <DollarSign className="text-white" size={20} />
              </div>
              <h1 className="text-xl font-bold text-gray-800">MyFinance</h1>
            </div>
            
            <div className="flex items-center space-x-4 ml-auto">
              <div className="text-sm text-gray-600">
                Olá, <span className="font-medium">{user?.name}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut size={20} />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Menu</h2>
            <div className="space-y-2">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors group ${
                  activeView === 'dashboard'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <BarChart3 size={20} className={`${
                  activeView === 'dashboard' ? 'text-blue-700' : 'text-blue-600 group-hover:text-blue-700'
                }`} />
                <span className="font-medium">Dashboard</span>
              </button>
              
              <button
                onClick={() => setActiveView('income')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors group ${
                  activeView === 'income'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                }`}
              >
                <TrendingUp size={20} className={`${
                  activeView === 'income' ? 'text-green-700' : 'text-green-600 group-hover:text-green-700'
                }`} />
                <span className="font-medium">Receitas</span>
              </button>
              
              <button
                onClick={() => setActiveView('expense')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors group ${
                  activeView === 'expense'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'text-gray-700 hover:bg-red-50 hover:text-red-700'
                }`}
              >
                <TrendingDown size={20} className={`${
                  activeView === 'expense' ? 'text-red-700' : 'text-red-600 group-hover:text-red-700'
                }`} />
                <span className="font-medium">Despesas</span>
              </button>
              
              <button
                onClick={() => setActiveView('reports')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors group ${
                  activeView === 'reports'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <BarChart3 size={20} className={`${
                  activeView === 'reports' ? 'text-blue-700' : 'text-blue-600 group-hover:text-blue-700'
                }`} />
                <span className="font-medium">Relatórios</span>
              </button>
              
              <button
                onClick={() => setActiveView('settings')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors group ${
                  activeView === 'settings'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <Settings size={20} className={`${
                  activeView === 'settings' ? 'text-blue-700' : 'text-blue-600 group-hover:text-blue-700'
                }`} />
                <span className="font-medium">Configurações</span>
              </button>
            </div>
          </div>

          {/* Quick Stats in Sidebar */}
          <div className="px-6 pb-6">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Resumo Mês
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Receitas:</span>
                  <span className="font-medium text-green-600">{formatCurrency(monthlyIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Despesas:</span>
                  <span className="font-medium text-red-600">{formatCurrency(monthlyExpense)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Saldo:</span>
                  <span className={`font-medium ${monthlyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(monthlyBalance)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Quick Action Buttons - Only show on dashboard */}
      {activeView === 'dashboard' && (
        <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
          <button
            onClick={() => setActiveView('income')}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-full hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg"
            title="Nova Receita"
          >
            <Plus size={24} />
          </button>

          <button
            onClick={() => setActiveView('expense')}
            className="bg-gradient-to-r from-red-500 to-rose-600 text-white p-4 rounded-full hover:from-red-600 hover:to-rose-700 transition-all transform hover:scale-105 shadow-lg"
            title="Nova Despesa"
          >
            <Plus size={24} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;