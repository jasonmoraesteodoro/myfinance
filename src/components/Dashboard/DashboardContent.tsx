import React, { useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';
import { TrendingUp, TrendingDown, DollarSign, Filter } from 'lucide-react';
import { Transaction } from '../../types';

interface DashboardContentProps {
  transactions: Transaction[];
}

const DashboardContent: React.FC<DashboardContentProps> = ({ transactions }) => {
  const { categories } = useFinancial();
  
  // Estados para filtros - inicializar com mês e ano atuais
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(currentDate.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

  // Função para formatar valores monetários para BRL
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Obter anos únicos das transações
  const getUniqueYears = () => {
    const years = new Set<string>();
    transactions.forEach(t => {
      years.add(new Date(t.date).getFullYear().toString());
    });
    return Array.from(years).sort();
  };

  // Obter meses únicos das transações
  const getUniqueMonths = () => {
    const months = new Set<string>();
    transactions.forEach(t => {
      months.add(String(new Date(t.date).getMonth() + 1).padStart(2, '0'));
    });
    return Array.from(months).sort();
  };

  // Filtrar transações baseado nos filtros selecionados
  const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const transactionMonth = String(transactionDate.getMonth() + 1).padStart(2, '0');
      const transactionYear = transactionDate.getFullYear().toString();
      
      const monthMatch = selectedMonth === 'all' || transactionMonth === selectedMonth;
      const yearMatch = selectedYear === 'all' || transactionYear === selectedYear;
      
      return monthMatch && yearMatch;
    });
  };

  const filteredTransactions = getFilteredTransactions();

  // Calcular totais baseados nas transações filtradas
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Obtém as 5 transações mais recentes das transações filtradas
  const recentTransactions = filteredTransactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Gerar título dinâmico baseado nos filtros
  const getDashboardTitle = () => {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    if (selectedMonth === 'all' && selectedYear === 'all') {
      return 'Dashboard - Resumo Geral';
    } else if (selectedMonth === 'all') {
      return `Dashboard - Resumo de ${selectedYear}`;
    } else if (selectedYear === 'all') {
      const monthName = monthNames[parseInt(selectedMonth) - 1];
      return `Dashboard - Resumo de ${monthName}`;
    } else {
      const monthName = monthNames[parseInt(selectedMonth) - 1];
      return `Dashboard - Resumo de ${monthName} de ${selectedYear}`;
    }
  };

  return (
    <div className="space-y-8">
      {/* Título do Dashboard */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{getDashboardTitle()}</h2>
        <p className="text-gray-600">Resumo financeiro do período selecionado</p>
      </div>

      {/* Filtros de Período */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="text-gray-600" size={20} />
          <h3 className="font-semibold text-gray-800">Filtros de Período</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mês</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os meses</option>
              {getUniqueMonths().map(month => (
                <option key={month} value={month}>
                  {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][parseInt(month) - 1]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ano</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os anos</option>
              {getUniqueYears().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cards de Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Receitas</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Despesas</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(totalExpense)}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <TrendingDown className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg border ${balance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>Saldo</p>
              <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                {formatCurrency(balance)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${balance >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
              <DollarSign className={balance >= 0 ? 'text-blue-600' : 'text-red-600'} size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Atividade Recente */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="font-bold text-gray-800 mb-4">Atividade Recente do Período</h3>
        {recentTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhuma transação encontrada para o período selecionado.</p>
        ) : (
          <div className="space-y-4">
            {recentTransactions.map((transaction) => {
              const category = categories.find(c => c.id === transaction.categoryId);
              const subcategory = category?.subcategories.find(s => s.id === transaction.subcategoryId);
              
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-800">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {category?.name} {subcategory ? `• ${subcategory.name}` : ''} • {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className={`font-bold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardContent;