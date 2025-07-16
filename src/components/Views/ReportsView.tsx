import React, { useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';
import { BarChart3, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const ReportsView: React.FC = () => {
  const { transactions, categories } = useFinancial();
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Obter anos e meses únicos para os filtros
  const getUniqueYears = () => {
    const years = new Set<string>();
    transactions.forEach(t => {
      years.add(new Date(t.date).getFullYear().toString());
    });
    return Array.from(years).sort();
  };

  const getUniqueMonths = () => {
    const months = new Set<string>();
    transactions.forEach(t => {
      months.add(String(new Date(t.date).getMonth() + 1).padStart(2, '0'));
    });
    return Array.from(months).sort();
  };

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
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const getCategoryData = (type: 'income' | 'expense') => {
    const categoryTotals = new Map<string, number>();
    
    filteredTransactions
      .filter(t => t.type === type)
      .forEach(transaction => {
        const category = categories.find(c => c.id === transaction.categoryId);
        if (category) {
          const current = categoryTotals.get(category.name) || 0;
          categoryTotals.set(category.name, current + transaction.amount);
        }
      });

    return Array.from(categoryTotals.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  const incomeByCategory = getCategoryData('income');
  const expenseByCategory = getCategoryData('expense');

  // Função para gerar dados da tabela consolidada
  const getConsolidatedData = () => {
    const consolidatedData: { [period: string]: { income: number; expense: number; balance: number } } = {};
    const periods = new Set<string>();

    // Processar todas as transações filtradas
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const period = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
      
      periods.add(period);
      
      if (!consolidatedData[period]) {
        consolidatedData[period] = { income: 0, expense: 0, balance: 0 };
      }
      
      if (transaction.type === 'income') {
        consolidatedData[period].income += transaction.amount;
      } else {
        consolidatedData[period].expense += transaction.amount;
      }
      
      consolidatedData[period].balance = consolidatedData[period].income - consolidatedData[period].expense;
    });

    const sortedPeriods = Array.from(periods).sort((a, b) => {
      const [monthA, yearA] = a.split('/');
      const [monthB, yearB] = b.split('/');
      return yearA.localeCompare(yearB) || monthA.localeCompare(monthB);
    });

    // Calcular totais por categoria
    const incomeByCategory: { [categoryId: string]: { [period: string]: number } } = {};
    const expenseByCategory: { [categoryId: string]: { [period: string]: number } } = {};
    const incomeCategoryTotals: { [categoryId: string]: number } = {};
    const expenseCategoryTotals: { [categoryId: string]: number } = {};

    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const period = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
      
      if (transaction.type === 'income') {
        if (!incomeByCategory[transaction.categoryId]) {
          incomeByCategory[transaction.categoryId] = {};
        }
        incomeByCategory[transaction.categoryId][period] = (incomeByCategory[transaction.categoryId][period] || 0) + transaction.amount;
        incomeCategoryTotals[transaction.categoryId] = (incomeCategoryTotals[transaction.categoryId] || 0) + transaction.amount;
      } else {
        if (!expenseByCategory[transaction.categoryId]) {
          expenseByCategory[transaction.categoryId] = {};
        }
        expenseByCategory[transaction.categoryId][period] = (expenseByCategory[transaction.categoryId][period] || 0) + transaction.amount;
        expenseCategoryTotals[transaction.categoryId] = (expenseCategoryTotals[transaction.categoryId] || 0) + transaction.amount;
      }
    });

    return {
      consolidatedData,
      sortedPeriods,
      incomeByCategory,
      expenseByCategory,
      incomeCategoryTotals,
      expenseCategoryTotals
    };
  };

  const { consolidatedData, sortedPeriods, incomeByCategory: incomeData, expenseByCategory: expenseData, incomeCategoryTotals, expenseCategoryTotals } = getConsolidatedData();

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center space-x-2">
        <div className="bg-blue-100 p-2 rounded-full">
          <BarChart3 className="text-blue-600" size={20} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Relatórios Financeiros</h2>
      </div>

      {/* Seletor de Período */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-4">Filtros de Período</h3>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2">
            <TrendingUp className="text-green-600" size={20} />
            <div>
              <p className="text-sm text-green-600">Receitas</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center space-x-2">
            <TrendingDown className="text-red-600" size={20} />
            <div>
              <p className="text-sm text-red-600">Despesas</p>
              <p className="text-xl font-bold text-red-700">{formatCurrency(totalExpense)}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-100 p-3 rounded-full">
              <DollarSign className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600">Saldo</p>
              <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela Consolidada */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-blue-50 px-6 py-3 border-b border-blue-200">
          <h3 className="font-semibold text-blue-800">Resumo Consolidado por Período</h3>
        </div>
        
        {sortedPeriods.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <BarChart3 className="mx-auto mb-4 text-gray-400" size={48} />
            <p>Nenhuma transação encontrada com os filtros aplicados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Categorias
                  </th>
                  {sortedPeriods.map(period => (
                    <th key={period} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      {period}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Seção de Receitas */}
                <tr className="bg-green-50">
                  <td colSpan={sortedPeriods.length + 2} className="px-4 py-2 text-sm font-semibold text-green-800">
                    RECEITAS
                  </td>
                </tr>
                {categories.filter(cat => cat.type === 'income' && incomeCategoryTotals[cat.id]).map(category => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200 pl-8">
                      {category.name}
                    </td>
                    {sortedPeriods.map(period => (
                      <td key={period} className="px-4 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                        {incomeData[category.id]?.[period] ? formatCurrency(incomeData[category.id][period]) : '-'}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-sm font-semibold text-center text-green-600">
                      {formatCurrency(incomeCategoryTotals[category.id])}
                    </td>
                  </tr>
                ))}
                <tr className="bg-green-100 font-semibold">
                  <td className="px-4 py-3 text-sm text-green-800 border-r border-gray-200">
                    Total Receitas
                  </td>
                  {sortedPeriods.map(period => (
                    <td key={period} className="px-4 py-3 text-sm text-center text-green-700 border-r border-gray-200">
                      {consolidatedData[period]?.income ? formatCurrency(consolidatedData[period].income) : '-'}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-sm font-bold text-center text-green-700">
                    {formatCurrency(totalIncome)}
                  </td>
                </tr>

                {/* Seção de Despesas */}
                <tr className="bg-red-50">
                  <td colSpan={sortedPeriods.length + 2} className="px-4 py-2 text-sm font-semibold text-red-800">
                    DESPESAS
                  </td>
                </tr>
                {categories.filter(cat => cat.type === 'expense' && expenseCategoryTotals[cat.id]).map(category => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200 pl-8">
                      {category.name}
                    </td>
                    {sortedPeriods.map(period => (
                      <td key={period} className="px-4 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                        {expenseData[category.id]?.[period] ? formatCurrency(expenseData[category.id][period]) : '-'}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-sm font-semibold text-center text-red-600">
                      {formatCurrency(expenseCategoryTotals[category.id])}
                    </td>
                  </tr>
                ))}
                <tr className="bg-red-100 font-semibold">
                  <td className="px-4 py-3 text-sm text-red-800 border-r border-gray-200">
                    Total Despesas
                  </td>
                  {sortedPeriods.map(period => (
                    <td key={period} className="px-4 py-3 text-sm text-center text-red-700 border-r border-gray-200">
                      {consolidatedData[period]?.expense ? formatCurrency(consolidatedData[period].expense) : '-'}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-sm font-bold text-center text-red-700">
                    {formatCurrency(totalExpense)}
                  </td>
                </tr>

                {/* Seção de Saldo */}
                <tr className="bg-blue-100 font-bold">
                  <td className="px-4 py-3 text-sm text-blue-800 border-r border-gray-200">
                    SALDO
                  </td>
                  {sortedPeriods.map(period => (
                    <td key={period} className={`px-4 py-3 text-sm text-center border-r border-gray-200 ${
                      consolidatedData[period]?.balance >= 0 ? 'text-blue-700' : 'text-red-700'
                    }`}>
                      {consolidatedData[period] ? formatCurrency(consolidatedData[period].balance) : '-'}
                    </td>
                  ))}
                  <td className={`px-4 py-3 text-sm font-bold text-center ${
                    balance >= 0 ? 'text-blue-700' : 'text-red-700'
                  }`}>
                    {formatCurrency(balance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-4">Receitas por Categoria</h3>
          {incomeByCategory.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhuma receita no período</p>
          ) : (
            <div className="space-y-3">
              {incomeByCategory.map(({ name, amount }) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{name}</span>
                  <span className="font-medium text-green-600">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-4">Despesas por Categoria</h3>
          {expenseByCategory.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhuma despesa no período</p>
          ) : (
            <div className="space-y-3">
              {expenseByCategory.map(({ name, amount }) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{name}</span>
                  <span className="font-medium text-red-600">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="font-bold text-gray-800 mb-4">Transações do Período</h3>
        <div className="max-h-60 overflow-y-auto">
          {filteredTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhuma transação no período</p>
          ) : (
            <div className="space-y-2">
              {filteredTransactions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-800">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className={`font-medium ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsView;