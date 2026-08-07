import { useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Settings, Tag, Bell, Mail, Palette, Shield, AlertCircle } from 'lucide-react';

import AdminCategoriesTab    from '../Admin/tabs/AdminCategoriesTab';
import AdminPrioritiesTab    from '../Admin/tabs/AdminPrioritiesTab';
import AdminNotificationsTab from '../Admin/tabs/AdminNotificationsTab';
import AdminGeneralTab       from '../Admin/tabs/AdminGeneralTab';
import AdminSecuriteTab      from '../Admin/tabs/AdminSecuriteTab';
import AdminEmailTab         from '../Admin/tabs/AdminEmailTab';

const RED = '#E31E24';

const menuItems = [
  { key: 'general',       label: 'Général',      icon: Settings    },
  { key: 'categories',    label: 'Catégories',   icon: Tag         },
  { key: 'priorities',    label: 'Priorités',    icon: AlertCircle },
  { key: 'notifications', label: 'Notifications',icon: Bell        },
  { key: 'email',         label: 'Email',         icon: Mail        },
  { key: 'securite',      label: 'Sécurité',     icon: Shield      },
];

export default function AdminParametres() {
  const [activeTab, setActiveTab] = useState('categories');

  const renderTab = () => {
    switch (activeTab) {
      case 'categories':    return <AdminCategoriesTab />;
      case 'priorities':    return <AdminPrioritiesTab />;
      case 'notifications': return <AdminNotificationsTab />;
      case 'general':       return <AdminGeneralTab />;
      case 'securite':      return <AdminSecuriteTab />;
      case 'email':         return <AdminEmailTab />;
      default: return (
        <div className="text-center py-20 text-gray-400">Section en construction</div>
      );
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres système</h1>
        <p className="text-sm text-gray-500 mt-1">Configuration et personnalisation du Help Desk</p>
      </div>

      <div className="flex gap-6">

        {/* Menu gauche */}
        <div className="w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 space-y-1">
            {menuItems.map(({ key, label, icon: Icon }) => (
              <button key={key}
                onClick={() => setActiveTab(key)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left"
                style={{
                  backgroundColor: activeTab === key ? '#fff1f1' : 'transparent',
                  color:           activeTab === key ? RED       : '#6b7280',
                }}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          {renderTab()}
        </div>

      </div>
    </AdminLayout>
  );
}
