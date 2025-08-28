import { useState } from 'react';
import { X, Phone, MapPin, CreditCard, Check, ArrowRight } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { instanceService } from '../../services/instanceService';
import { stripeService } from '../../services/stripeService';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface PurchaseNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'config' | 'payment' | 'processing' | 'complete';

// Lista de DDDs disponíveis
const availableDDDs = [
  { code: '11', city: 'São Paulo', state: 'SP' },
  { code: '21', city: 'Rio de Janeiro', state: 'RJ' },
  { code: '31', city: 'Belo Horizonte', state: 'MG' },
  { code: '41', city: 'Curitiba', state: 'PR' },
  { code: '47', city: 'Joinville', state: 'SC' },
  { code: '48', city: 'Florianópolis', state: 'SC' },
  { code: '51', city: 'Porto Alegre', state: 'RS' },
  { code: '61', city: 'Brasília', state: 'DF' },
  { code: '62', city: 'Goiânia', state: 'GO' },
  { code: '71', city: 'Salvador', state: 'BA' },
  { code: '81', city: 'Recife', state: 'PE' },
  { code: '85', city: 'Fortaleza', state: 'CE' },
];

export default function PurchaseNumberModal({
  isOpen,
  onClose,
  onSuccess,
}: PurchaseNumberModalProps) {
  const [step, setStep] = useState<Step>('config');
  const [formData, setFormData] = useState({
    areaCode: '',
    redirectNumber: '',
    managerName: '',
    paymentMethod: 'credit_card' as 'credit_card' | 'pix',
  });
  const [createdNumber, setCreatedNumber] = useState<string>('');

  // Mutation para criar sessão de checkout no Stripe
  const createCheckoutMutation = useMutation({
    mutationFn: async () => {
      // Criar sessão de checkout no Stripe
      const response = await stripeService.createCheckoutSession({
        areaCode: formData.areaCode,
        redirectNumber: formData.redirectNumber,
        displayName: formData.managerName,
        mode: 'payment' // Pagamento único por enquanto
      });
      
      return response;
    },
    onSuccess: (data) => {
      if (!data.success) {
        alert(data.message || 'Erro ao criar sessão de pagamento');
        setStep('payment');
      }
      // O usuário será redirecionado para o Stripe Checkout
    },
    onError: (error) => {
      console.error('Error creating checkout session:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
      setStep('payment');
    },
  });

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.areaCode || !formData.redirectNumber || !formData.managerName) {
      alert('Por favor, preencha todos os campos');
      return;
    }
    
    setStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    
    // Redirecionar para o Stripe Checkout
    createCheckoutMutation.mutate();
  };

  const handleComplete = () => {
    onSuccess();
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
                Adquirir Novo Número Virtual
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {step === 'config' && 'Configure seu novo número'}
                {step === 'payment' && 'Confirme o pagamento'}
                {step === 'processing' && 'Processando...'}
                {step === 'complete' && 'Número criado com sucesso!'}
              </p>
            </div>
            {step !== 'processing' && (
              <button
                onClick={onClose}
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
              {/* Seleção de DDD */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4" />
                  DDD Desejado
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.areaCode}
                  onChange={(e) => setFormData({ ...formData, areaCode: e.target.value })}
                  required
                >
                  <option value="">Selecione o DDD</option>
                  {availableDDDs.map((ddd) => (
                    <option key={ddd.code} value={ddd.code}>
                      ({ddd.code}) {ddd.city} - {ddd.state}
                    </option>
                  ))}
                </select>
              </div>

              {/* Número de Redirecionamento */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4" />
                  Número para Redirecionamento de Chamadas
                </label>
                <input
                  type="tel"
                  placeholder="+55 11 98765-4321"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.redirectNumber}
                  onChange={(e) => setFormData({ ...formData, redirectNumber: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ligações recebidas serão redirecionadas para este número
                </p>
              </div>

              {/* Nome do Gerente */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  👤 Nome do Gerente/Identificador
                </label>
                <input
                  type="text"
                  placeholder="Ex: João Silva - Vendas"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.managerName}
                  onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este nome será usado como identificador do número
                </p>
              </div>
            </div>

            {/* Informações de Preço */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                Investimento
              </h3>
              <div className="space-y-1 text-sm text-blue-700">
                <div className="flex justify-between">
                  <span>Mensalidade:</span>
                  <span className="font-semibold">R$ 29,90/mês</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de ativação:</span>
                  <span className="font-semibold">Grátis</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                Continuar para Pagamento
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Pagamento */}
        {step === 'payment' && (
          <form onSubmit={handlePaymentSubmit} className="p-6">
            <div className="space-y-4">
              {/* Resumo do Pedido */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Resumo do Pedido
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">DDD:</span>
                    <span className="font-medium">({formData.areaCode})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Redirecionamento:</span>
                    <span className="font-medium">{formData.redirectNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Identificador:</span>
                    <span className="font-medium">{formData.managerName}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Total (mensal):</span>
                    <span className="text-green-600">R$ 29,90</span>
                  </div>
                </div>
              </div>

              {/* Informação de Pagamento Seguro */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-blue-900">
                    Pagamento Seguro com Stripe
                  </h3>
                </div>
                <p className="text-sm text-blue-700 mb-2">
                  Você será redirecionado para o checkout seguro do Stripe.
                </p>
                <div className="space-y-1 text-xs text-blue-600">
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3" />
                    <span>Cartão de crédito ou débito</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3" />
                    <span>Pagamento processado com segurança</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3" />
                    <span>Número criado automaticamente após confirmação</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-3 mt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep('config')}
              >
                Voltar
              </Button>
              <Button type="submit">
                Confirmar Pagamento
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Processando */}
        {step === 'processing' && (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Processando pagamento...</p>
            <p className="text-sm text-gray-500 mt-2">
              Aguarde enquanto criamos seu número virtual
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
                Número Virtual Criado!
              </h3>
              <p className="text-sm text-gray-600">
                Seu novo número WhatsApp está pronto para uso
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-600 mb-2">Seu novo número:</p>
              <p className="text-2xl font-bold text-gray-900">{createdNumber}</p>
              <p className="text-sm text-gray-500 mt-2">
                Identificador: {formData.managerName}
              </p>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                Próximos passos:
              </h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. O número já está ativo e pronto para uso</li>
                <li>2. Configure uma instância WAHA para conectar o WhatsApp</li>
                <li>3. Escaneie o QR Code para vincular ao WhatsApp</li>
              </ol>
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