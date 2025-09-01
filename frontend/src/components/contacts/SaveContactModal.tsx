import React, { useState } from 'react';
import { X, User, Phone, Mail, Tag, Users } from 'lucide-react';

interface SaveContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contactData: ContactFormData) => void;
  phone: string;
  currentName?: string;
}

export interface ContactFormData {
  name: string;
  phone: string;
  email?: string;
  tags?: string[];
  groups?: string[];
  customFields?: Record<string, any>;
}

const SaveContactModal: React.FC<SaveContactModalProps> = ({
  isOpen,
  onClose,
  onSave,
  phone,
  currentName = ''
}) => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: currentName || '',
    phone: phone,
    email: '',
    tags: [],
    groups: []
  });
  
  const [tagInput, setTagInput] = useState('');
  const [groupInput, setGroupInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        tags: [],
        groups: []
      });
      setTagInput('');
      setGroupInput('');
    } catch (error) {
      console.error('Error saving contact:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || []
    }));
  };

  const addGroup = () => {
    if (groupInput.trim() && !formData.groups?.includes(groupInput.trim())) {
      setFormData(prev => ({
        ...prev,
        groups: [...(prev.groups || []), groupInput.trim()]
      }));
      setGroupInput('');
    }
  };

  const removeGroup = (group: string) => {
    setFormData(prev => ({
      ...prev,
      groups: prev.groups?.filter(g => g !== group) || []
    }));
  };

  const formatPhoneDisplay = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      const areaCode = cleaned.substring(2, 4);
      const number = cleaned.substring(4);
      return `+55 (${areaCode}) ${number.substring(0, 5)}-${number.substring(5)}`;
    }
    return phone;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-gray-900">Salvar Contato</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Phone Display */}
          <div className="bg-light-50 p-3 rounded-lg border">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Phone className="w-4 h-4" />
              <span>Número:</span>
              <span className="font-medium text-gray-900">
                {formatPhoneDisplay(phone)}
              </span>
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Digite o nome do contato"
              required
              disabled={isLoading}
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email (opcional)
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="email@exemplo.com"
                disabled={isLoading}
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
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Adicionar tag"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                  disabled={isLoading || !tagInput.trim()}
                >
                  +
                </button>
              </div>
              
              {formData.tags && formData.tags.length > 0 && (
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
                        disabled={isLoading}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Groups */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grupos (opcional)
            </label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Users className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={groupInput}
                    onChange={(e) => setGroupInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGroup())}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Adicionar grupo"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="button"
                  onClick={addGroup}
                  className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                  disabled={isLoading || !groupInput.trim()}
                >
                  +
                </button>
              </div>
              
              {formData.groups && formData.groups.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.groups.map((group, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded-full"
                    >
                      {group}
                      <button
                        type="button"
                        onClick={() => removeGroup(group)}
                        className="ml-1 text-gray-600 hover:text-gray-800"
                        disabled={isLoading}
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
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-gradient text-white rounded-lg hover:shadow-primary-lg transition-all disabled:opacity-50"
              disabled={isLoading || !formData.name.trim()}
            >
              {isLoading ? 'Salvando...' : 'Salvar Contato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaveContactModal;