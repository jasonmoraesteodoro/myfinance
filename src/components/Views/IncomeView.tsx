import React, { useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, DollarSign, Calendar, TrendingUp, Edit2, Trash2, Filter } from 'lucide-react';

const IncomeView: React.FC = () => {
  const { categories, transactions, addTransaction, updateTransaction, deleteTransaction } = useFinancial();
  const { user } = useAuth();
  const [view, setView] = useState<'list' | 'add'>('list');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Estados para edição
  const [isEditing, setIsEditing] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);
  
  // Estados para filtros
  const [selectedFilterMonth, setSelectedFilterMonth] = useState('all');
  const [selectedFilterYear, setSelectedFilterYear] = useState('all');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('all');

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const selectedCategory = incomeCategories.find(cat => cat.id === categoryId);

  // Função para formatar valores monetários para BRL.
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Função para gerar dados da tabela de resumo
  const getIncomeSummaryData = () => {
    const summaryData: { [categoryId: string]: { [period: string]: number } } = {};
    const periods = new Set<string>();
    const categoryTotals: { [categoryId: string]: number } = {};
    const periodTotals: { [period: string]: number } = {};
    let grandTotal = 0;

    // Processar todas as transações de receita
    incomeTransactions.forEach(transaction => {
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
    incomeTransactions.forEach(t => {
      years.add(new Date(t.date).getFullYear().toString());
    });
    return Array.from(years).sort();
  };

  const getUniqueMonths = () => {
    const months = new Set<string>();
    incomeTransactions.forEach(t => {
      months.add(String(new Date(t.date).getMonth() + 1).padStart(2, '0'));
    });
    return Array.from(months).sort();
  };

  // Filtrar transações baseado nos filtros selecionados
  const getFilteredTransactions = () => {
    return incomeTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const transactionMonth = String(transactionDate.getMonth() + 1).padStart(2, '0');
      const transactionYear = transactionDate.getFullYear().toString();
      
      const monthMatch = selectedFilterMonth === 'all' || transactionMonth === selectedFilterMonth;
      const yearMatch = selectedFilterYear === 'all' || transactionYear === selectedFilterYear;
      const categoryMatch = selectedFilterCategory === 'all' || transaction.categoryId === selectedFilterCategory;
      
      return monthMatch && yearMatch && categoryMatch;
    });
  };

  // Agrupa receitas filtradas por ano/mês
  const groupedIncomes = getFilteredTransactions().reduce((acc, transaction) => {
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

  const sortedPeriods = Object.values(groupedIncomes).sort((a, b) => b.period.localeCompare(a.period));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !user) return;
    
    // Se a categoria tem subcategorias, uma deve ser selecionada
    if (selectedCategory && selectedCategory.subcategories.length > 0 && !subcategoryId) {
      return;
    }

    // Criar descrição automaticamente baseada na categoria e subcategoria
    const category = incomeCategories.find(cat => cat.id === categoryId);
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
      });
      setIsEditing(false);
      setCurrentTransaction(null);
    } else {
      // Adicionar nova transação
      addTransaction({
        type: 'income',
        amount: parseFloat(amount),
        description: autoDescription,
        categoryId,
        subcategoryId: subcategoryId || '',
        date,
        userId: user.id,
      });
    }

    // Limpa o formulário e volta para a lista
    setAmount('');
    setCategoryId('');
    setSubcategoryId('');
    setDate(new Date().toISOString().split('T')[0]);
    setView('list');
  };

  const handleEdit = (transaction: any) => {
    setCurrentTransaction(transaction);
    setAmount(transaction.amount.toString());
    setCategoryId(transaction.categoryId);
    setSubcategoryId(transaction.subcategoryId);
    setDate(transaction.date);
    setIsEditing(true);
    setView('add');
  };

  const handleDelete = (transactionId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta receita?')) {
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

  const { summaryData, sortedPeriods: summaryPeriods, categoryTotals, periodTotals, grandTotal } = getIncomeSummaryData();

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-green-100 p-2 rounded-full">
            <TrendingUp className="text-green-600" size={20} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            {view === 'list' ? 'Minhas Receitas' : (isEditing ? 'Editar Receita' : 'Adicionar Receita')}
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
        // Visualização da Lista de Receitas
        <div className="space-y-6">
          {/* Botão para adicionar nova receita - movido para a direita */}
          <div className="flex justify-end">
            <button
              onClick={() => setView('add')}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              <span>Nova Receita</span>
            </button>
          </div>

          {/* Resumo Total */}
          {/* KPIs de Receitas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Total Geral */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Geral</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(incomeTransactions.reduce((sum, t) => sum + t.amount, 0))}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            {/* KPIs por Categoria */}
            {incomeCategories.map(category => {
              const categoryTransactions = incomeTransactions.filter(t => t.categoryId === category.id);
              const categoryTotal = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
              
              if (categoryTotal === 0) return null;
              
              return (
                <div key={category.id} className="bg-white p-6 rounded-lg border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-600 truncate">{category.name}</p>
                      <p className="text-xl font-bold text-green-700">
                        {formatCurrency(categoryTotal)}
                      </p>
                    </div>
                    <div className="bg-green-50 p-2 rounded-full ml-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Barra de progresso relativa ao total */}
                  <div className="mt-3">
                    <div className="w-full bg-green-100 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${incomeTransactions.reduce((sum, t) => sum + t.amount, 0) > 0 
                            ? (categoryTotal / incomeTransactions.reduce((sum, t) => sum + t.amount, 0)) * 100 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      {incomeTransactions.reduce((sum, t) => sum + t.amount, 0) > 0 
                        ? `${((categoryTotal / incomeTransactions.reduce((sum, t) => sum + t.amount, 0)) * 100).toFixed(1)}%` 
                        : '0%'} do total
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabela de Resumo por Categoria e Mês */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-green-50 px-6 py-3 border-b border-green-200">
              <h3 className="font-semibold text-green-800">Resumo por Categoria e Mês</h3>
            </div>
            
            {summaryPeriods.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <TrendingUp className="mx-auto mb-4 text-gray-400" size={48} />
                <p>Nenhuma receita cadastrada ainda.</p>
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
                    {incomeCategories.filter(category => categoryTotals[category.id]).map(category => (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">
                          {category.name}
                        </td>
                        {summaryPeriods.map(period => (
                          <td key={period} className="px-4 py-3 text-sm text-center text-gray-900 border-r border-gray-200">
                            {summaryData[category.id]?.[period] ? formatCurrency(summaryData[category.id][period]) : '-'}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-sm font-semibold text-center text-green-600">
                          {formatCurrency(categoryTotals[category.id])}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-green-50 font-semibold">
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                        Totais
                      </td>
                      {summaryPeriods.map(period => (
                        <td key={period} className="px-4 py-3 text-sm text-center text-green-700 border-r border-gray-200">
                          {periodTotals[period] ? formatCurrency(periodTotals[period]) : '-'}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-sm font-bold text-center text-green-700">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mês</label>
                <select
                  value={selectedFilterMonth}
                  onChange={(e) => setSelectedFilterMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">Todas as categorias</option>
                  {incomeCategories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tabela de Receitas por Período */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Receitas por Período</h3>
            </div>
            
            {sortedPeriods.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <TrendingUp className="mx-auto mb-4 text-gray-400" size={48} />
                <p>Nenhuma receita encontrada com os filtros aplicados.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {sortedPeriods.map((periodData) => (
                  <div key={periodData.period} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Calendar className="text-green-600" size={20} />
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
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(periodData.total)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Lista de transações do período */}
                    <div className="space-y-2 ml-8">
                      {periodData.transactions.map((transaction) => {
                        const category = categories.find(c => c.id === transaction.categoryId);
                        const subcategory = category?.subcategories.find(s => s.id === transaction.subcategoryId);
                        
                        return (
                          <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{category?.name}</p>
                              <p className="text-sm text-gray-500">
                                {subcategory?.name} • {new Date(transaction.date).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="font-semibold text-green-600">
                                {formatCurrency(transaction.amount)}
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleEdit(transaction)}
                                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                                  title="Editar receita"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(transaction.id)}
                                  className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                                  title="Excluir receita"
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
        // Formulário para Adicionar/Editar Receita
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Selecione uma categoria</option>
                {incomeCategories.map(category => (
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {isEditing ? 'Atualizar Receita' : 'Adicionar Receita'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default IncomeView;