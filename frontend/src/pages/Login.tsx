import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, MessageSquare } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [error, setError] = useState('');

  const requestMagicLinkMutation = useMutation({
    mutationFn: authService.requestMagicLink,
    onSuccess: () => {
      setStep('otp');
      setError('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erro ao enviar email');
    },
  });

  const verifyOTPMutation = useMutation({
    mutationFn: authService.verifyOTP,
    onSuccess: (data) => {
      setAuth(data.token, data.user, data.tenant);
      navigate('/dashboard');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Código inválido');
    },
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Digite seu email');
      return;
    }
    requestMagicLinkMutation.mutate({ email });
  };

  const handleOTPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError('Digite o código recebido');
      return;
    }
    verifyOTPMutation.mutate({ email, otp });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 rounded-full p-4">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            OmniX WhatsApp
          </h2>
          <p className="mt-2 text-gray-600">
            Plataforma de atendimento multicanal
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <Mail className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  Acesse sua conta
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Enviaremos um código para seu email
                </p>
              </div>

              <Input
                type="email"
                label="Email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error}
                required
                autoFocus
              />

              <Button
                type="submit"
                className="w-full"
                loading={requestMagicLinkMutation.isPending}
              >
                Enviar código de acesso
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOTPSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <Lock className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  Digite o código
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Enviamos um código para {email}
                </p>
              </div>

              <Input
                type="text"
                label="Código de verificação"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                error={error}
                required
                autoFocus
                maxLength={6}
              />

              <Button
                type="submit"
                className="w-full"
                loading={verifyOTPMutation.isPending}
              >
                Verificar e entrar
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setOtp('');
                  setError('');
                }}
                className="w-full text-center text-sm text-gray-600 hover:text-gray-900"
              >
                Voltar
              </button>
            </form>
          )}
        </div>

        <div className="text-center text-sm text-gray-600">
          <p>
            Ao continuar, você concorda com nossos{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Termos de Uso
            </a>{' '}
            e{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Política de Privacidade
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}