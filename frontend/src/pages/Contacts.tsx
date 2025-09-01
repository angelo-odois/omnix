import { useState, useEffect } from 'react';
import { 
  Plus, 
  User, 
  Phone, 
  Mail, 
  Tag, 
  Search, 
  Edit3, 
  MessageSquare,
  Users,
  Filter,
  Download,
  X,
  UserPlus,
  Trash2
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tags: string[];
  customFields: Record<string, any>;
  groups: string[];
  isBlocked: boolean;
  lastContact?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Contacts() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [error, setError] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Contact | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    tags: [] as string[],
    groups: [] as string[],
    customFields: {} as Record<string, any>
  });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/contacts', {
        params: { search: searchTerm }
      });
      setContacts(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar contatos');
    } finally {
      setLoading(false);
    }
  };

  const createContact = async () => {
    try {
      setError('');
      const response = await api.post('/contacts', formData);
      setContacts(prev => [...prev, response.data.data]);
      setShowCreateModal(false);
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar contato');
    }
  };

  const updateContact = async () => {
    if (!editingContact) return;
    
    try {
      setError('');
      const response = await api.put(`/contacts/${editingContact.id}`, formData);
      setContacts(prev => prev.map(c => c.id === editingContact.id ? response.data.data : c));
      setEditingContact(null);
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar contato');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      tags: [],
      groups: [],
      customFields: {}
    });
    setTagInput('');
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const startConversation = async (contact: Contact) => {
    try {
      // Navigate to chat and open conversation with this contact
      navigate(`/chat?phone=${contact.phone}&name=${encodeURIComponent(contact.name)}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const deleteContact = async (contact: Contact) => {
    try {
      await api.delete(`/contacts/${contact.id}`);
      setContacts(prev => prev.filter(c => c.id !== contact.id));
      setDeleteConfirm(null);
      console.log('✅ Contact deleted successfully:', contact.name);
    } catch (error: any) {
      console.error('❌ Error deleting contact:', error);
      setError(error.response?.data?.message || 'Erro ao excluir contato');
    }
  };

  const isAdmin = user?.role && ['super_admin', 'tenant_admin', 'tenant_manager'].includes(user.role);

  const exportContacts = async () => {
    try {
      const response = await api.get('/contacts', {
        params: { format: 'csv' }
      });
      // Download CSV file
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contatos.csv';
      a.click();
    } catch (error) {
      console.error('Error exporting contacts:', error);
    }
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || '',
      tags: contact.tags,
      customFields: contact.customFields
    });
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      return cleaned.replace(/^55(\d{2})(\d{5})(\d{4})$/, '+55 ($1) $2-$3');
    }
    return phone;
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Carregando contatos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 flex items-center">
            <Users className="w-6 h-6 mr-2 text-primary-600" />
            Contatos
          </h1>
          <p className="text-gray-500 mt-1">Gerencie sua lista de contatos e relacionamentos</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={exportContacts}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-gradient text-white rounded-lg hover:shadow-primary-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Contato</span>
          </button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Search */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value === '') loadContacts();
              }}
              onKeyPress={(e) => e.key === 'Enter' && loadContacts()}
              placeholder="Buscar contatos por nome, telefone ou email..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{contacts.length}</div>
            <div className="text-sm text-gray-500">Total de Contatos</div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Contacts List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'Nenhum contato encontrado' : 'Nenhum contato cadastrado'}
            </h2>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Tente buscar com outros termos'
                : 'Crie seu primeiro contato ou eles serão criados automaticamente ao receber mensagens'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeiro Contato
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredContacts.map(contact => (
              <div key={contact.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="w-12 h-12 bg-primary-gradient rounded-full flex items-center justify-center text-white font-bold mr-4 shadow-lg">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {contact.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 space-x-4">
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          {formatPhoneNumber(contact.phone)}
                        </div>
                        {contact.email && (
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {contact.email}
                          </div>
                        )}
                      </div>
                      {contact.tags.length > 0 && (
                        <div className="flex items-center mt-2 space-x-1">
                          <Tag className="w-4 h-4 text-gray-400" />
                          {contact.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                              {tag}
                            </span>
                          ))}
                          {contact.tags.length > 3 && (
                            <span className="text-xs text-gray-500">+{contact.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startConversation(contact)}
                      className="p-2 bg-primary-100 hover:bg-primary-200 rounded-lg text-primary-600 transition-colors"
                      title="Iniciar conversa no WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => openEditModal(contact)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                      title="Editar contato"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => setDeleteConfirm(contact)}
                        className="p-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-600 transition-colors"
                        title="Excluir contato"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Contact Modal */}
      {(showCreateModal || editingContact) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingContact ? 'Editar Contato' : 'Novo Contato'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingContact(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome completo"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(61) 99999-9999"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (opcional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (opcional)
                </label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        placeholder="Adicionar tag"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                      disabled={!tagInput.trim()}
                    >
                      +
                    </button>
                  </div>
                  
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-primary-600 hover:text-primary-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingContact(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={editingContact ? updateContact : createContact}
                  disabled={!formData.name.trim() || !formData.phone.trim()}
                  className="flex-1 px-4 py-2 bg-primary-gradient text-white rounded-lg hover:shadow-primary-lg transition-all disabled:opacity-50"
                >
                  {editingContact ? 'Atualizar' : 'Criar Contato'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Excluir Contato
              </h3>
              
              <p className="text-gray-600 text-center mb-6">
                Tem certeza que deseja excluir <strong>{deleteConfirm.name}</strong>?
                <br />
                <span className="text-sm text-gray-500">Esta ação não pode ser desfeita.</span>
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteContact(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}