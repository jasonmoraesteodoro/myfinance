import React, { useState } from 'react';
import { Settings, User, TrendingUp, TrendingDown } from 'lucide-react';
import UserSettings from '../Settings/UserSettings';
import IncomeCategorySettings from '../Settings/IncomeCategorySettings';
import ExpenseCategorySettings from '../Settings/ExpenseCategorySettings';

const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('user');

  const tabs = [
    { id: 'user', label: 'Usuário', icon: User },
    { id: 'income-categories', label: 'Categorias de Receita', icon: TrendingUp },
    { id: 'expense-categories', label: 'Categorias de Despesas', icon: TrendingDown },
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center space-x-2">
        <div className="bg-blue-100 p-2 rounded-full">
          <Settings className="text-blue-600" size={20} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Configurações</h2>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex space-x-1 p-1 bg-gray-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6 min-h-[400px]">
          {activeTab === 'user' && <UserSettings />}
          {activeTab === 'income-categories' && <IncomeCategorySettings />}
          {activeTab === 'expense-categories' && <ExpenseCategorySettings />}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;