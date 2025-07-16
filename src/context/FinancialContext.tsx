import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Category, Transaction, Subcategory, FinancialContextType } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
  deleteSubcategory: (id: string) => Promise<string | null>;
}

interface FinancialProviderProps {
  children: ReactNode;
  deleteCategory: (id: string) => Promise<string | null>;
}

export const FinancialProvider: React.FC<FinancialProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCategories();
      loadTransactions();
    } else {
      // Clear data when user logs out
      setCategories([]);
      setTransactions([]);
    }
  }, [isAuthenticated, user]);

  const loadCategories = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (categoriesError) {
        console.error('Error loading categories:', categoriesError);
        return;
      }

      // Load subcategories
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('subcategories')
        .select('*')
        .in('category_id', categoriesData?.map(c => c.id) || [])
        .order('created_at', { ascending: true });

      if (subcategoriesError) {
        console.error('Error loading subcategories:', subcategoriesError);
        return;
      }

      // Combine categories with their subcategories
      const categoriesWithSubcategories: Category[] = (categoriesData || []).map(category => ({
        id: category.id,
        name: category.name,
        type: category.type,
        subcategories: (subcategoriesData || [])
          .filter(sub => sub.category_id === category.id)
          .map(sub => ({
            id: sub.id,
            name: sub.name,
            categoryId: sub.category_id,
          })),
      }));

      setCategories(categoriesWithSubcategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading transactions:', error);
        return;
      }

      const formattedTransactions: Transaction[] = (data || []).map(transaction => ({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description || '',
        categoryId: transaction.category_id || '',
        subcategoryId: transaction.subcategory_id || '',
        date: transaction.date,
        userId: transaction.user_id,
        status: transaction.status,
      }));

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const addCategory = async (category: Omit<Category, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: category.name,
          type: category.type,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding category:', error);
        return;
      }

      const newCategory: Category = {
        id: data.id,
        name: data.name,
        type: data.type,
        subcategories: [],
      };

      setCategories(prev => [...prev, newCategory]);
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const updateCategory = async (id: string, categoryUpdate: Partial<Category>) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: categoryUpdate.name,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating category:', error);
        return;
      }

      setCategories(prev =>
        prev.map(cat => (cat.id === id ? { ...cat, ...categoryUpdate } : cat))
      );
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const deleteCategory = async (id: string): Promise<string | null> => {
    try {
      // Verificar se existem transações vinculadas a esta categoria
      const { data: transactions, error: transactionError } = await supabase
        .from('transactions')
        .select('id')
        .eq('category_id', id)
        .limit(1);

      if (transactionError) {
        console.error('Error checking transactions:', transactionError);
        return 'Erro ao verificar transações vinculadas.';
      }

      if (transactions && transactions.length > 0) {
        // Determinar se é categoria de receita ou despesa para a mensagem
        const category = categories.find(cat => cat.id === id);
        const categoryType = category?.type === 'income' ? 'receitas' : 'despesas';
        return `Não é possível excluir esta categoria pois existem ${categoryType} cadastradas para ela.`;
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting category:', error);
        return 'Erro ao excluir categoria.';
      }

      setCategories(prev => prev.filter(cat => cat.id !== id));
      setTransactions(prev => prev.filter(trans => trans.categoryId !== id));
      return null;
    } catch (error) {
      console.error('Error deleting category:', error);
      return 'Erro interno ao excluir categoria.';
    }
  };

  const addSubcategory = async (categoryId: string, subcategory: Omit<Subcategory, 'id' | 'categoryId'>) => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .insert({
          category_id: categoryId,
          name: subcategory.name,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding subcategory:', error);
        return;
      }

      const newSubcategory: Subcategory = {
        id: data.id,
        name: data.name,
        categoryId: data.category_id,
      };

      setCategories(prev =>
        prev.map(cat =>
          cat.id === categoryId
            ? { ...cat, subcategories: [...cat.subcategories, newSubcategory] }
            : cat
        )
      );
    } catch (error) {
      console.error('Error adding subcategory:', error);
    }
  };

  const updateSubcategory = async (id: string, subcategoryUpdate: Partial<Subcategory>) => {
    try {
      const { error } = await supabase
        .from('subcategories')
        .update({
          name: subcategoryUpdate.name,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating subcategory:', error);
        return;
      }

      setCategories(prev =>
        prev.map(cat => ({
          ...cat,
          subcategories: cat.subcategories.map(sub =>
            sub.id === id ? { ...sub, ...subcategoryUpdate } : sub
          ),
        }))
      );
    } catch (error) {
      console.error('Error updating subcategory:', error);
    }
  };

  const deleteSubcategory = async (id: string): Promise<string | null> => {
    try {
      // Verificar se existem transações vinculadas a esta subcategoria
      const { data: transactions, error: transactionError } = await supabase
        .from('transactions')
        .select('id, category_id')
        .eq('subcategory_id', id)
        .limit(1);

      if (transactionError) {
        console.error('Error checking transactions:', transactionError);
        return 'Erro ao verificar transações vinculadas.';
      }

      if (transactions && transactions.length > 0) {
        // Determinar se é subcategoria de receita ou despesa para a mensagem
        const categoryId = transactions[0].category_id;
        const category = categories.find(cat => cat.id === categoryId);
        const categoryType = category?.type === 'income' ? 'receitas' : 'despesas';
        return `Não é possível excluir esta subcategoria pois existem ${categoryType} cadastradas para ela.`;
      }

      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting subcategory:', error);
        return 'Erro ao excluir subcategoria.';
      }

      setCategories(prev =>
        prev.map(cat => ({
          ...cat,
          subcategories: cat.subcategories.filter(sub => sub.id !== id),
        }))
      );
      setTransactions(prev => prev.filter(trans => trans.subcategoryId !== id));
      return null;
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      return 'Erro interno ao excluir subcategoria.';
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          category_id: transaction.categoryId || null,
          subcategory_id: transaction.subcategoryId || null,
          date: transaction.date,
          status: transaction.status || 'paid',
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding transaction:', error);
        return;
      }

      const newTransaction: Transaction = {
        id: data.id,
        type: data.type,
        amount: data.amount,
        description: data.description || '',
        categoryId: data.category_id || '',
        subcategoryId: data.subcategory_id || '',
        date: data.date,
        userId: data.user_id,
        status: data.status,
      };

      setTransactions(prev => [newTransaction, ...prev]);
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const updateTransaction = async (id: string, transactionUpdate: Partial<Transaction>) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          type: transactionUpdate.type,
          amount: transactionUpdate.amount,
          description: transactionUpdate.description,
          category_id: transactionUpdate.categoryId || null,
          subcategory_id: transactionUpdate.subcategoryId || null,
          date: transactionUpdate.date,
          status: transactionUpdate.status,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating transaction:', error);
        return;
      }

      setTransactions(prev =>
        prev.map(trans => (trans.id === id ? { ...trans, ...transactionUpdate } : trans))
      );
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting transaction:', error);
        return;
      }

      setTransactions(prev => prev.filter(trans => trans.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const value: FinancialContextType = {
    categories,
    transactions,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };

  return <FinancialContext.Provider value={value}>{children}</FinancialContext.Provider>;
};