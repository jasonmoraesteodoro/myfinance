import React, { useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, DollarSign, Calendar, TrendingDown, Edit2, Trash2, Filter, CheckCircle, Clock } from 'lucide-react';

const ExpenseView: React.FC = () => {
  const { categories, transactions, addTransaction, updateTransaction, deleteTransaction } = useFinancial();
  const { user } = useAuth();
  const [view, setView] = useState<'list' | 'add'>('list');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'paid' | 'pending'>('paid');
  
  // Estados para edição
  const [isEditing, setIsEditing] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);
  
  // Estados para filtros
  const [selectedFilterMonth, setSelectedFilterMonth] = useState('all');
  const [selectedFilterYear, setSelectedFilterYear] = useState('all');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('all');
  const [selectedFilterStatus, setSelectedFilterStatus] = useState('all');

  const expenseCategories = categories.filter(cat => cat.type === 'expense');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const selectedCategory = expenseCategories.find(cat => cat.id === categoryId);

  // Função para formatar valores monetários para BRL.
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Função para gerar dados da tabela de resumo
  const getExpenseSummaryData = () => {
    const summaryData: { [categoryId: string]: { [period: string]: number } } = {};
    const periods = new Set<string>();
    const categoryTotals: { [categoryId: string]: number } = {};
    const periodTotals: { [period: string]: number } = {};
    let grandTotal = 0;

    // Processar todas as transações de despesa
    expenseTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const period = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
      
      periods.add(period);
      
      if (!summaryData[transaction.categoryId]) {
        summaryData[transaction.categoryId] = {};
      }
      
      if (!summaryData[transaction.categoryId][period]) {
        summaryData[transaction.categoryId][period] = 0;
      }
      
      summaryData[transaction.categoryId][period] += transaction.amount;
      
      // Calcular totais
      categoryTotals[transaction.categoryId] = (categoryTotals[transaction.categoryId] || 0) + transaction.amount;
      periodTotals[period] = (periodTotals[period] || 0) + transaction.amount;
      grandTotal += transaction.amount;
    });

    const sortedPeriods = Array.from(periods).sort((a, b) => {
      const [monthA, yearA] = a.split('/');
      const [monthB, yearB] = b.split('/');
      return yearA.localeCompare(yearB) || monthA.localeCompare(monthB);
    });

    return {
      summaryData,
      sortedPeriods,
      categoryTotals,
      periodTotals,
      grandTotal
    };
  };

  // Obter anos e meses únicos para os filtros
  const getUniqueYears = () => {
    const years = new Set<string>();
    expenseTransactions.forEach(t => {
      years.add(new Date(t.date).getFullYear().toString());
    });
    return Array.from(years).sort();
  };

  const getUniqueMonths = () => {
    const months = new Set<string>();
    expenseTransactions.forEach(t => {
      months.add(String(new Date(t.date).getMonth() + 1).padStart(2, '0'));
    });
    return Array.from(months).sort();
  };

  // Filtrar transações baseado nos filtros selecionados
  const getFilteredTransactions = () => {
    return expenseTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const transactionMonth = String(transactionDate.getMonth() + 1).padStart(2, '0');
      const transactionYear = transactionDate.getFullYear().toString();
      
      const monthMatch = selectedFilterMonth === 'all' || transactionMonth === selectedFilterMonth;
      const yearMatch = selectedFilterYear === 'all' || transactionYear === selectedFilterYear;
      const categoryMatch = selectedFilterCategory === 'all' || transaction.categoryId === selectedFilterCategory;
      const statusMatch = selectedFilterStatus === 'all' || (transaction.status || 'paid') === selectedFilterStatus;
      
      return monthMatch && yearMatch && categoryMatch && statusMatch;
    });
  };

  // Agrupa despesas filtradas por ano/mês
  const groupedExpenses = getFilteredTransactions().reduce((acc, transaction) => {
    const date = new Date(transaction.date);
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[yearMonth]) {
      acc[yearMonth] = {
        period: yearMonth,
        total: 0,
        count: 0,
        transactions: []
      };
    }
    
    acc[yearMonth].total += transaction.amount;
    acc[yearMonth].count += 1;
    acc[yearMonth].transactions.push(transaction);
    
    return acc;
  }, {} as Record<string, { period: string; total: number; count: number; transactions: any[] }>);

  const sortedPeriods = Object.values(groupedExpenses).sort((a, b) => b.period.localeCompare(a.period));

  // Calcular KPIs
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const paidExpenses = expenseTransactions.filter(t => (t.status || 'paid') === 'paid').reduce((sum, t) => sum + t.amount, 0);
  const pendingExpenses = expenseTransactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !user) return;
    
    // Se a categoria tem subcategorias, uma deve ser selecionada
    if (selectedCategory && selectedCategory.subcategories.length > 0 && !subcategoryId) {
      return;
    }

    // Criar descrição automaticamente baseada na categoria e subcategoria
    const category = expenseCategories.find(cat => cat.id === categoryId);
    const subcategory = category?.subcategories.find(sub => sub.id === subcategoryId);
    const autoDescription = subcategory ? `${category?.name} - ${subcategory.name}` : category?.name || '';

    if (isEditing && currentTransaction) {
      // Atualizar transação existente
      updateTransaction(currentTransaction.id, {
        amount: parseFloat(amount),
        description: autoDescription,
        categoryId,
        subcategoryId: subcategoryId || '',
        date,
        status,
      });
      setIsEditing(false);
      setCurrentTransaction(null);
    } else {
      // Adicionar nova transação
      addTransaction({
        type: 'expense',
        amount: parseFloat(amount),
        description: autoDescription,
        categoryId,
        subcategoryId: subcategoryId || '',
        date,
        userId: user.id,
        status,
      });
    }

    // Limpa o formulário e volta para a lista
    setAmount('');
    setCategoryId('');
    setSubcategoryId('');
    setDate(new Date().toISOString().split('T')[0]);
    setStatus('paid');
    setView('list');
  };

  const handleEdit = (transaction: any) => {
    setCurrentTransaction(transaction);
    setAmount(transaction.amount.toString());
    setCategoryId(transaction.categoryId);
    setSubcategoryId(transaction.subcategoryId);
    setDate(transaction.date);
    setStatus(transaction.status || 'paid');
    setIsEditing(true);
    setView('add');
  };

  const handleDelete = (transactionId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta despesa?')) {
      deleteTransaction(transactionId);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setCurrentTransaction(null);
    setAmount('');
    setCategoryId('');
    setSubcategoryId('');
    setDate(new Date().toISOString().split('T')[0]);
    setStatus('paid');
    setView('list');
  };

  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const { summaryData, sortedPeriods: summaryPeriods, categoryTotals, periodTotals, grandTotal } = getExpenseSummaryData();

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-red-100 p-2 rounded-full">
            <TrendingDown className="text-red-600" size={20} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            {view === 'list' ? 'Minhas Despesas' : (isEditing ? 'Editar Despesa' : 'Adicionar Despesa')}
          </h2>
        </div>
        {view === 'add' && (
          <button
            onClick={handleCancelEdit}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
          >
            Voltar
          </button>
        )}
      </div>

      {view === 'list' ? (
        // Visualização da Lista de Despesas
        <div className="space-y-6">
          {/* Botão para adicionar nova despesa - movido para a direita */}
          <div className="flex justify-end">
            <button
              onClick={() => setView('add')}
              className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              <span>Nova Despesa</span>
            </button>
          </div>

          {/* KPIs de Despesas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total de Despesas */}
            <div className="bg-gradient-to-br from-red-50 to-rose-50 p-6 rounded-lg border border-red-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Total de Despesas</p>
                  <p className="text-2xl font-bold text-red-700">
                    {formatCurrency(totalExpenses)}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <TrendingDown className="text-red-600" size={24} />
                </div>
              </div>
            </div>

            {/* Despesas Pagas */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-lg border border-orange-300 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Despesas Pagas</p>
                  <p className="text-2xl font-bold text-orange-800">
                    {formatCurrency(paidExpenses)}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <CheckCircle className="text-orange-700" size={24} />
                </div>
              </div>
            </div>

            {/* Despesas a Pagar */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-lg border border-orange-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Despesas a Pagar</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {formatCurrency(pendingExpenses)}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <Clock className="text-orange-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Resumo por Categoria e Mês */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-red-50 px-6 py-3 border-b border-red-200">
              <h3 className="font-semibold text-red-800">Resumo por Categoria e Mês</h3>
            </div>
            
            {summaryPeriods.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <TrendingDown className="mx-auto mb-4 text-gray-400" size={48} />
                <p>Nenhuma despesa cadastrada ainda.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        Categorias
                      </th>
                      {summaryPeriods.map(period => (
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
                    {expenseCategories.filter(category => categoryTotals[category.id]).map(category => (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">
                          {category.name}
                        </td>
                        {summaryPeriods.map(period => (
                          <td key={period} className="px-4 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                            {summaryData[category.id]?.[period] ? formatCurrency(summaryData[category.id][period]) : '-'}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-sm font-semibold text-center text-red-600">
                          {formatCurrency(categoryTotals[category.id])}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-red-50 font-semibold">
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                        Totais
                      </td>
                      {summaryPeriods.map(period => (
                        <td key={period} className="px-4 py-3 text-sm text-center text-red-700 border-r border-gray-200">
                          {periodTotals[period] ? formatCurrency(periodTotals[period]) : '-'}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-sm font-bold text-center text-red-700">
                        {formatCurrency(grandTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Filtros */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="text-gray-600" size={20} />
              <h3 className="font-semibold text-gray-800">Filtros</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mês</label>
                <select
                  value={selectedFilterMonth}
                  onChange={(e) => setSelectedFilterMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                  value={selectedFilterYear}
                  onChange={(e) => setSelectedFilterYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">Todos os anos</option>
                  {getUniqueYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <select
                  value={selectedFilterCategory}
                  onChange={(e) => setSelectedFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">Todas as categorias</option>
                  {expenseCategories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={selectedFilterStatus}
                  onChange={(e) => setSelectedFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">Todos os status</option>
                  <option value="paid">Pagas</option>
                  <option value="pending">A Pagar</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabela de Despesas por Período */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Despesas por Período</h3>
            </div>
            
            {sortedPeriods.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <TrendingDown className="mx-auto mb-4 text-gray-400" size={48} />
                <p>Nenhuma despesa encontrada com os filtros aplicados.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {sortedPeriods.map((periodData) => (
                  <div key={periodData.period} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Calendar className="text-red-600" size={20} />
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {formatPeriod(periodData.period)}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {periodData.count} transação{periodData.count !== 1 ? 'ões' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">
                          {formatCurrency(periodData.total)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Lista de transações do período */}
                    <div className="space-y-2 ml-8">
                      {periodData.transactions.map((transaction) => {
                        const category = categories.find(c => c.id === transaction.categoryId);
                        const subcategory = category?.subcategories.find(s => s.id === transaction.subcategoryId);
                        const transactionStatus = transaction.status || 'paid';
                        
                        return (
                          <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-gray-800">{transaction.description}</p>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  transactionStatus === 'paid' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {transactionStatus === 'paid' ? (
                                    <>
                                      <CheckCircle size={12} className="mr-1" />
                                      Paga
                                    </>
                                  ) : (
                                    <>
                                      <Clock size={12} className="mr-1" />
                                      A Pagar
                                    </>
                                  )}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">
                                {category?.name} • {subcategory?.name} • {new Date(transaction.date).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="font-semibold text-red-600">
                                {formatCurrency(transaction.amount)}
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => {
                                    const newStatus = (transaction.status || 'paid') === 'paid' ? 'pending' : 'paid';
                                    updateTransaction(transaction.id, { status: newStatus });
                                  }}
                                  className={`p-2 rounded-lg transition-colors ${
                                    (transaction.status || 'paid') === 'paid'
                                      ? 'text-green-600 hover:bg-green-50 hover:text-green-700'
                                      : 'text-orange-600 hover:bg-orange-50 hover:text-orange-700'
                                  }`}
                                  title={`Marcar como ${(transaction.status || 'paid') === 'paid' ? 'pendente' : 'paga'}`}
                                >
                                  {(transaction.status || 'paid') === 'paid' ? (
                                    <CheckCircle size={16} />
                                  ) : (
                                    <Clock size={16} />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleEdit(transaction)}
                                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                                  title="Editar despesa"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(transaction.id)}
                                  className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                                  title="Excluir despesa"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Formulário para Adicionar/Editar Despesa
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="0,00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategoryId('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              >
                <option value="">Selecione uma categoria</option>
                {expenseCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCategory && selectedCategory.subcategories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategoria
                </label>
                <select
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required={selectedCategory && selectedCategory.subcategories.length > 0}
                >
                  <option value="">Selecione uma subcategoria</option>
                  {selectedCategory.subcategories.map(subcategory => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <span className={`text-sm font-medium ${status === 'pending' ? 'text-orange-600' : 'text-gray-500'}`}>
                    A Pagar
                  </span>
                  <button
                    type="button"
                    onClick={() => setStatus(status === 'paid' ? 'pending' : 'paid')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                      status === 'paid' ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        status === 'paid' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-sm font-medium ${status === 'paid' ? 'text-green-600' : 'text-gray-500'}`}>
                    Paga
                  </span>
                </div>
                <div className="flex items-center space-x-2 ml-auto">
                  {status === 'paid' ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <Clock className="text-orange-600" size={20} />
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                {isEditing ? 'Atualizar Despesa' : 'Adicionar Despesa'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ExpenseView;