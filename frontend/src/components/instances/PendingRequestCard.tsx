import { Clock, CreditCard, X, ArrowRight } from 'lucide-react';
import { stripeService, type PendingRequest } from '../../services/stripeService';
import Button from '../ui/Button';

interface PendingRequestCardProps {
  request: PendingRequest;
  onResume: (request: PendingRequest) => void;
  onCancel: (requestId: string) => void;
}

export default function PendingRequestCard({ 
  request, 
  onResume, 
  onCancel 
}: PendingRequestCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}min restantes`;
    }
    return `${minutes} minutos restantes`;
  };

  const handleResume = () => {
    if (request.stripeSessionUrl && request.status === 'processing') {
      // Se já tem URL do Stripe, redirecionar diretamente
      window.location.href = request.stripeSessionUrl;
    } else {
      // Caso contrário, criar nova sessão
      onResume(request);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <h3 className="text-sm font-semibold text-yellow-900">
              Pagamento Pendente
            </h3>
            <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
              {request.status === 'processing' ? 'Em processamento' : 'Aguardando pagamento'}
            </span>
          </div>
          
          <div className="space-y-1 text-sm text-yellow-800">
            <p>
              <span className="font-medium">DDD:</span> {request.areaCode}
            </p>
            <p>
              <span className="font-medium">Redirecionamento:</span> {request.redirectNumber}
            </p>
            <p>
              <span className="font-medium">Identificador:</span> {request.displayName}
            </p>
            <p className="text-xs text-yellow-600 mt-2">
              Criado em: {formatDate(request.createdAt)} • {getTimeRemaining(request.expiresAt)}
            </p>
          </div>
          
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleResume}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {request.status === 'processing' ? 'Continuar Pagamento' : 'Retomar Pagamento'}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCancel(request.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}