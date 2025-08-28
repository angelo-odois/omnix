import { useState } from 'react';
import { X, ArrowRightLeft, Phone, Building2, FileText } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { instanceService } from '../../services/instanceService';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface PortabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PortabilityModal({ isOpen, onClose }: PortabilityModalProps) {
  const [formData, setFormData] = useState({
    currentNumber: '',
    currentCarrier: '',
    ownerDocument: '',
  });

  const portabilityMutation = useMutation({
    mutationFn: instanceService.requestPortability,
    onSuccess: () => {
      alert('Solicitação de portabilidade enviada com sucesso! Você receberá atualizações por email.');
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    portabilityMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <ArrowRightLeft className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Portabilidade de Número
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Traga seu número atual para o OmniX
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Phone className="w-4 h-4" />
                Número a ser portado
              </label>
              <input
                type="tel"
                placeholder="+55 11 98765-4321"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.currentNumber}
                onChange={(e) =>
                  setFormData({ ...formData, currentNumber: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Building2 className="w-4 h-4" />
                Operadora atual
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.currentCarrier}
                onChange={(e) =>
                  setFormData({ ...formData, currentCarrier: e.target.value })
                }
                required
              >
                <option value="">Selecione a operadora</option>
                <option value="vivo">Vivo</option>
                <option value="tim">TIM</option>
                <option value="claro">Claro</option>
                <option value="oi">Oi</option>
                <option value="nextel">Nextel</option>
                <option value="other">Outra</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <FileText className="w-4 h-4" />
                CPF/CNPJ do titular
              </label>
              <input
                type="text"
                placeholder="000.000.000-00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.ownerDocument}
                onChange={(e) =>
                  setFormData({ ...formData, ownerDocument: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="text-sm font-semibold text-amber-900 mb-2">
              Importante:
            </h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• O processo de portabilidade pode levar até 3 dias úteis</li>
              <li>• O número deve estar ativo e sem pendências</li>
              <li>• Você precisa ser o titular da linha</li>
              <li>• Mantenha seu chip atual até a conclusão do processo</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={portabilityMutation.isPending}
            >
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Solicitar Portabilidade
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}