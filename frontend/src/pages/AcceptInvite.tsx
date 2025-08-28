import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowRight, User, Building, Loader2, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';

export default function AcceptInvite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authStore = useAuthStore();
  
  const [step, setStep] = useState<'verify' | 'setup' | 'complete'>('verify');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteData, setInviteData] = useState<any>(null);

  useEffect(() => {
    // Pegar email do query param se vier de um link de convite
    const inviteEmail = searchParams.get('email');
    const token = searchParams.get('token');
    
    if (inviteEmail) {
      setEmail(inviteEmail);
    }
    
    if (token) {
      // Se tem token no URL, é um convite direto
      verifyInviteToken(token);
    }
  }, [searchParams]);

  const verifyInviteToken = async (token: string) => {
    try {
      const response = await api.get(`/v2/auth/verify-invite/${token}`);
      if (response.data.success) {
        setInviteData(response.data.invite);
        setEmail(response.data.invite.email);
        setStep('setup');
      }
    } catch (err: any) {
      setError('Link de convite inválido ou expirado');
    }
  };

  // Solicitar código OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/v2/auth/magic-link', { email });
      
      if (response.data.success) {
        setStep('verify');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao enviar código');
    } finally {
      setLoading(false);
    }
  };

  // Verificar OTP e configurar conta
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!otp || otp.length !== 6) {
      setError('Digite o código de 6 dígitos');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/v2/auth/verify-otp', { email, otp });
      
      if (response.data.success) {
        setInviteData(response.data);
        setStep('setup');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  // Configurar conta (nome e senha)
  const handleSetupAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/v2/auth/setup-account', {
        email,
        name,
        password,
        otp
      });
      
      if (response.data.success) {
        // Salvar token e dados do usuário
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        
        authStore.setAuth(
          response.data.token,
          response.data.user,
          response.data.tenant
        );
        
        setStep('complete');
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao configurar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Building className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">OmniX</h1>
          {step === 'verify' && (
            <>
              <p className="text-gray-600 mt-2">Verificar Convite</p>
              <p className="text-sm text-gray-500 mt-1">Digite o código enviado para seu email</p>
            </>
          )}
          {step === 'setup' && (
            <>
              <p className="text-gray-600 mt-2">Configurar Conta</p>
              <p className="text-sm text-gray-500 mt-1">Complete seu cadastro para acessar o sistema</p>
            </>
          )}
          {step === 'complete' && (
            <>
              <p className="text-gray-600 mt-2">Conta Criada!</p>
              <p className="text-sm text-gray-500 mt-1">Redirecionando para o sistema...</p>
            </>
          )}
        </div>

        {/* Step: Verify OTP */}
        {step === 'verify' && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            {!searchParams.get('token') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="seu@email.com"
                    required
                    disabled={!!searchParams.get('email')}
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código de Verificação
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono"
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                Digite o código de 6 dígitos enviado para {email || 'seu email'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Verificar Código
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {!otp && (
              <button
                type="button"
                onClick={handleRequestOTP}
                className="w-full text-gray-600 hover:text-gray-900 text-sm"
              >
                Não recebeu o código? Clique aqui para reenviar
              </button>
            )}
          </form>
        )}

        {/* Step: Setup Account */}
        {step === 'setup' && (
          <form onSubmit={handleSetupAccount} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Seu nome"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite a senha novamente"
                  required
                />
              </div>
            </div>

            {inviteData && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                <p className="font-medium">Você foi convidado para:</p>
                <p>{inviteData.tenantName}</p>
                <p className="text-xs mt-1">Como: {inviteData.role}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !name || !password || !confirmPassword}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Criar Conta
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">Conta criada com sucesso!</p>
              <p className="text-sm text-gray-600 mt-2">Você será redirecionado em instantes...</p>
            </div>
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
          </div>
        )}
      </div>
    </div>
  );
}