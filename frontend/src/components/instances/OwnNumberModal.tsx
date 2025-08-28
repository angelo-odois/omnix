import { useState } from 'react';
import { X, Phone, QrCode, Check, AlertCircle } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { api } from '../../lib/api';

interface OwnNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'config' | 'qrcode' | 'connecting' | 'complete';

export default function OwnNumberModal({
  isOpen,
  onClose,
  onSuccess,
}: OwnNumberModalProps) {
  const [step, setStep] = useState<Step>('config');
  const [displayName, setDisplayName] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [error, setError] = useState('');
  const [connectedNumber, setConnectedNumber] = useState<string | null>(null);
  const [connectedDisplayName, setConnectedDisplayName] = useState<string | null>(null);

  // Criar sessão para número próprio
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/waha/sessions/own-number', {
        displayName: displayName || 'Meu WhatsApp'
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.sessionName) {
        setSessionName(data.sessionName);
        setStep('qrcode');
      } else {
        setError(data.message || 'Erro ao criar sessão');
      }
    },
    onError: (error: any) => {
      console.error('Error creating session:', error);
      setError(error.response?.data?.message || 'Erro ao criar sessão');
    },
  });

  // Buscar QR Code
  const { data: qrCodeData, refetch: refetchQR } = useQuery({
    queryKey: ['qr-code', sessionName],
    queryFn: async () => {
      if (!sessionName) return null;
      const response = await api.get(`/waha/sessions/${sessionName}/qr`);
      return response.data;
    },
    enabled: !!sessionName && step === 'qrcode',
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });

  // Verificar status da sessão
  const { data: sessionStatus } = useQuery({
    queryKey: ['session-status', sessionName],
    queryFn: async () => {
      if (!sessionName) return null;
      const response = await api.get(`/waha/sessions/${sessionName}`);
      return response.data;
    },
    enabled: !!sessionName,
    refetchInterval: 3000, // Verificar a cada 3 segundos
  });

  // Verificar número conectado quando status muda para WORKING
  useQuery({
    queryKey: ['connected-number', sessionName],
    queryFn: async () => {
      const response = await api.get(`/waha/sessions/${sessionName}/connected-number`);
      return response.data;
    },
    enabled: sessionStatus?.session?.status === 'WORKING' && !!sessionName,
    onSuccess: (data) => {
      if (data.success && data.phoneNumber) {
        setConnectedNumber(data.phoneNumber);
        setConnectedDisplayName(data.displayName || displayName);
        setStep('complete');
      }
    },
  });

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!displayName.trim()) {
      setError('Por favor, insira um nome para identificação');
      return;
    }
    
    createSessionMutation.mutate();
  };

  const handleComplete = () => {
    onSuccess();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Usar Número Próprio
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {step === 'config' && 'Configure seu WhatsApp pessoal'}
                {step === 'qrcode' && 'Escaneie o QR Code com seu WhatsApp'}
                {step === 'connecting' && 'Conectando...'}
                {step === 'complete' && 'WhatsApp conectado com sucesso!'}
              </p>
            </div>
            {step !== 'connecting' && (
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Step 1: Configuração */}
        {step === 'config' && (
          <form onSubmit={handleConfigSubmit} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4" />
                  Nome de Identificação
                </label>
                <input
                  type="text"
                  placeholder="Ex: WhatsApp Vendas"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este nome será usado para identificar esta conexão
                </p>
              </div>

              {/* Informações */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Como funciona?
                </h3>
                <ul className="space-y-1 text-xs text-blue-700">
                  <li>• Use seu próprio número WhatsApp</li>
                  <li>• Sem custos adicionais de número virtual</li>
                  <li>• Conexão direta com seu WhatsApp pessoal ou empresarial</li>
                  <li>• Escaneie o QR Code para conectar</li>
                </ul>
              </div>

              {/* Aviso */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="text-xs text-yellow-800">
                    <p className="font-semibold mb-1">Importante:</p>
                    <p>O WhatsApp será desconectado de outros dispositivos (exceto o telefone principal).</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createSessionMutation.isPending}
              >
                {createSessionMutation.isPending ? 'Criando...' : 'Continuar'}
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: QR Code */}
        {step === 'qrcode' && (
          <div className="p-6">
            <div className="space-y-4">
              {qrCodeData?.success && qrCodeData.image ? (
                <>
                  <div className="flex justify-center">
                    <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                      <img 
                        src={qrCodeData.image} 
                        alt="QR Code" 
                        className="w-64 h-64"
                      />
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Escaneie o QR Code com seu WhatsApp
                    </p>
                    <ol className="text-xs text-gray-600 space-y-1">
                      <li>1. Abra o WhatsApp no seu telefone</li>
                      <li>2. Vá em Configurações → Dispositivos conectados</li>
                      <li>3. Toque em "Conectar dispositivo"</li>
                      <li>4. Escaneie este QR Code</li>
                    </ol>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    {sessionStatus?.session?.status === 'WORKING' 
                      ? 'WhatsApp já conectado!' 
                      : 'Gerando QR Code...'}
                  </p>
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Conectando */}
        {step === 'connecting' && (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Conectando ao WhatsApp...</p>
            <p className="text-sm text-gray-500 mt-2">
              Aguarde enquanto estabelecemos a conexão
            </p>
          </div>
        )}

        {/* Step 4: Concluído */}
        {step === 'complete' && (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                WhatsApp Conectado!
              </h3>
              <p className="text-sm text-gray-600">
                Seu número foi conectado com sucesso
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Identificação: {connectedDisplayName || displayName}
              </p>
              {connectedNumber && (
                <p className="text-lg font-semibold text-gray-900">
                  +{connectedNumber}
                </p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700 font-medium">
                📱 Número Próprio - Sem custos adicionais
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Este é o seu número pessoal do WhatsApp
              </p>
            </div>

            <Button
              className="w-full mt-6"
              onClick={handleComplete}
            >
              Concluir
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}