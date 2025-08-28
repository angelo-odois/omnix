import { useState, useEffect } from 'react';
import { X, Copy, Check, AlertCircle, Info, QrCode } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import Button from '../ui/Button';

interface InstanceSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceName?: string;
  sessionData?: {
    sessionName: string;
    webhookUrl: string;
  };
}

export default function InstanceSetupModal({
  isOpen,
  onClose,
  instanceName,
  sessionData
}: InstanceSetupModalProps) {
  const [displayName, setDisplayName] = useState(instanceName || '');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<'config' | 'setup'>('config');

  // Gerar webhook quando o modal abrir
  const generateWebhookMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await api.post('/waha/sessions/generate-webhook', {
        displayName: name
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setWebhookUrl(data.webhookUrl);
        setSessionName(data.sessionName);
        setStep('setup');
      }
    }
  });

  useEffect(() => {
    if (sessionData) {
      setSessionName(sessionData.sessionName);
      setWebhookUrl(sessionData.webhookUrl);
      setStep('setup');
    }
  }, [sessionData]);

  const handleGenerateWebhook = () => {
    if (displayName.trim()) {
      generateWebhookMutation.mutate(displayName);
    }
  };

  const handleCopyWebhook = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopySessionName = () => {
    if (sessionName) {
      navigator.clipboard.writeText(sessionName);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Configurar Nova Instância WhatsApp
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Configure o webhook para receber mensagens do WAHA
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {step === 'config' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Instância
                </label>
                <input
                  type="text"
                  placeholder="Ex: Atendimento Principal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este nome será usado para identificar a instância
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handleGenerateWebhook}
                disabled={!displayName.trim() || generateWebhookMutation.isPending}
              >
                {generateWebhookMutation.isPending ? 'Gerando...' : 'Gerar Webhook'}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Informações do Webhook */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">
                      Webhook Gerado com Sucesso!
                    </h3>
                    <p className="text-sm text-blue-700">
                      Use as informações abaixo para configurar sua instância no WAHA:
                    </p>
                  </div>
                </div>
              </div>

              {/* Nome da Sessão */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  Nome da Sessão (Session Name)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                    value={sessionName}
                    readOnly
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleCopySessionName}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use este nome ao criar a sessão no WAHA
                </p>
              </div>

              {/* URL do Webhook */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  URL do Webhook
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                    value={webhookUrl}
                    readOnly
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleCopyWebhook}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Configure esta URL no webhook do WAHA
                </p>
              </div>

              {/* Instruções */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Como configurar no WAHA:
                </h3>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex gap-2">
                    <span className="font-medium">1.</span>
                    <span>Acesse o painel do WAHA</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium">2.</span>
                    <span>Crie uma nova sessão com o nome fornecido acima</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium">3.</span>
                    <span>Configure o webhook com a URL fornecida</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium">4.</span>
                    <span>Adicione os eventos: message, message.any, session.status</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium">5.</span>
                    <span>Inicie a sessão e escaneie o QR Code</span>
                  </li>
                </ol>
              </div>

              {/* Aviso */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                      Importante
                    </h3>
                    <p className="text-sm text-yellow-700">
                      Guarde estas informações! O nome da sessão e a URL do webhook são únicos 
                      e necessários para configurar corretamente a integração.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="ghost" onClick={onClose}>
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    // Aqui poderia verificar se a sessão foi criada no WAHA
                    onClose();
                  }}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Concluir Configuração
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}