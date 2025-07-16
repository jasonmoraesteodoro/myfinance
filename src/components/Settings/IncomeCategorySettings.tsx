import React, { useState } from 'react';
import { useFinancial } from '../../context/FinancialContext';
import { Plus, Edit2, Trash2, TrendingUp, Check } from 'lucide-react';

const IncomeCategorySettings: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory, addSubcategory, updateSubcategory, deleteSubcategory } = useFinancial();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editSubcategoryName, setEditSubcategoryName] = useState('');
  const [addingSubcategoryTo, setAddingSubcategoryTo] = useState<string | null>(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');

  const incomeCategories = categories.filter(cat => cat.type === 'income');

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCategory({
        name: newCategoryName,
        type: 'income',
        subcategories: [],
      });
      setNewCategoryName('');
    }
  };

  const handleEditCategory = (categoryId: string, name: string) => {
    setEditingCategory(categoryId);
    setEditCategoryName(name);
  };

  const handleSaveCategory = (categoryId: string) => {
    if (editCategoryName.trim()) {
      updateCategory(categoryId, { name: editCategoryName });
      setEditingCategory(null);
      setEditCategoryName('');
    }
  };

  const handleEditSubcategory = (subcategoryId: string, name: string) => {
    setEditingSubcategory(subcategoryId);
    setEditSubcategoryName(name);
  };

  const handleSaveSubcategory = (subcategoryId: string) => {
    if (editSubcategoryName.trim()) {
      updateSubcategory(subcategoryId, { name: editSubcategoryName });
      setEditingSubcategory(null);
      setEditSubcategoryName('');
    }
  };

  const handleAddSubcategory = (categoryId: string) => {
    if (newSubcategoryName.trim()) {
      addSubcategory(categoryId, {
        name: newSubcategoryName,
      });
      setNewSubcategoryName('');
      setAddingSubcategoryTo(null);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      const error = await deleteCategory(categoryId);
      if (error) {
        setDeleteErrorMessage(error);
        setTimeout(() => setDeleteErrorMessage(''), 5000);
      }
    }
  };

  const handleDeleteSubcategory = async (subcategoryId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta subcategoria?')) {
      const error = await deleteSubcategory(subcategoryId);
      if (error) {
        setDeleteErrorMessage(error);
        setTimeout(() => setDeleteErrorMessage(''), 5000);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Mensagem de Erro de Exclusão */}
      {deleteErrorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
            <span>{deleteErrorMessage}</span>
          </div>
        </div>
      )}

      {/* Add Category */}
      <div className="bg-green-50 p-6 rounded-lg border border-green-200">
        <h3 className="flex items-center space-x-2 font-bold text-green-800 mb-4">
          <TrendingUp size={18} />
          <span>Nova Categoria de Receita</span>
        </h3>
        <div className="flex space-x-3">
          <div className="flex-1">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Ex: Salário, Freelance, Investimentos..."
              className="w-full px-4 py-3 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            />
          </div>
          <button
            onClick={handleAddCategory}
            disabled={!newCategoryName.trim()}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            <span>Adicionar</span>
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="bg-green-50 px-6 py-4 border-b border-green-200">
          <h3 className="flex items-center space-x-2 font-bold text-green-800">
            <TrendingUp size={18} />
            <span>Categorias de Receita ({incomeCategories.length})</span>
          </h3>
        </div>
        
        {incomeCategories.length === 0 ? (
          <div className="p-8 text-center">
            <TrendingUp size={48} className="mx-auto text-green-300 mb-4" />
            <p className="text-gray-500 mb-2">Nenhuma categoria de receita encontrada</p>
            <p className="text-sm text-gray-400">Adicione sua primeira categoria usando o formulário acima</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {incomeCategories.map((category) => (
              <div key={category.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-green-500" />
                    {editingCategory === category.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSaveCategory(category.id)}
                          className="text-lg font-semibold text-gray-800 bg-transparent border-b-2 border-green-500 focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveCategory(category.id)}
                          className="p-1 text-green-600 hover:text-green-700 transition-colors"
                          title="Confirmar edição"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-lg font-semibold text-gray-800">{category.name}</span>
                    )}
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      {category.subcategories?.length || 0} subcategorias
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditCategory(category.id, category.name)}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50"
                      title="Editar categoria"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                      title="Excluir categoria"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {/* Subcategories */}
                <div className="ml-7 space-y-3">
                  {category.subcategories && category.subcategories.length > 0 && (
                    <div className="space-y-2">
                      {category.subcategories.map((subcategory) => (
                        <div key={subcategory.id} className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg border-l-4 border-green-300">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full" />
                            {editingSubcategory === subcategory.id ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={editSubcategoryName}
                                  onChange={(e) => setEditSubcategoryName(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && handleSaveSubcategory(subcategory.id)}
                                  className="text-gray-700 bg-transparent border-b border-green-500 focus:outline-none"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSaveSubcategory(subcategory.id)}
                                  className="p-1 text-green-600 hover:text-green-700 transition-colors"
                                  title="Confirmar edição"
                                >
                                  <Check size={14} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-700">{subcategory.name}</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleEditSubcategory(subcategory.id, subcategory.name)}
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                              title="Editar subcategoria"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteSubcategory(subcategory.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Excluir subcategoria"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add Subcategory */}
                  {addingSubcategoryTo === category.id ? (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newSubcategoryName}
                        onChange={(e) => setNewSubcategoryName(e.target.value)}
                        placeholder="Nome da subcategoria..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSubcategory(category.id)}
                        autoFocus
                      />
                      <button
                        onClick={() => handleAddSubcategory(category.id)}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => {
                          setAddingSubcategoryTo(null);
                          setNewSubcategoryName('');
                        }}
                        className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingSubcategoryTo(category.id)}
                      className="flex items-center space-x-2 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm"
                    >
                      <Plus size={14} />
                      <span>Adicionar subcategoria</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomeCategorySettings;