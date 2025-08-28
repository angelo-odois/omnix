import { 
  MessageSquare, 
  Users, 
  Phone, 
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface StatCard {
  label: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  color: string;
}

const stats: StatCard[] = [
  {
    label: 'Conversas Ativas',
    value: 42,
    change: '+12%',
    icon: MessageSquare,
    color: 'bg-blue-500',
  },
  {
    label: 'Contatos',
    value: '1.2k',
    change: '+5%',
    icon: Users,
    color: 'bg-green-500',
  },
  {
    label: 'Números Ativos',
    value: 3,
    icon: Phone,
    color: 'bg-purple-500',
  },
  {
    label: 'Tempo Médio',
    value: '4:23',
    change: '-15%',
    icon: Clock,
    color: 'bg-orange-500',
  },
];

interface Instance {
  id: string;
  name: string;
  number: string;
  status: 'connected' | 'disconnected' | 'error';
  messages: number;
}

const instances: Instance[] = [
  {
    id: '1',
    name: 'Comercial',
    number: '+55 11 98765-4321',
    status: 'connected',
    messages: 156,
  },
  {
    id: '2',
    name: 'Suporte',
    number: '+55 61 91234-5678',
    status: 'connected',
    messages: 89,
  },
  {
    id: '3',
    name: 'Financeiro',
    number: '+55 21 99876-5432',
    status: 'disconnected',
    messages: 0,
  },
];

export default function Dashboard() {
  const getStatusIcon = (status: Instance['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'disconnected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: Instance['status']) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'disconnected':
        return 'Desconectado';
      case 'error':
        return 'Erro';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              {stat.change && (
                <span className={`text-sm font-medium ${
                  stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Status das Instâncias</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {instances.map((instance) => (
                <div key={instance.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(instance.status)}
                      <span className="text-sm text-gray-600">
                        {getStatusText(instance.status)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{instance.name}</p>
                      <p className="text-sm text-gray-600">{instance.number}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{instance.messages}</p>
                    <p className="text-sm text-gray-600">mensagens hoje</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Atividade Recente</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      Nova conversa iniciada com <span className="font-medium">João Silva</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Há 5 minutos</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Performance da Equipe</h2>
            <select className="text-sm border border-gray-300 rounded-lg px-3 py-1">
              <option>Hoje</option>
              <option>Esta semana</option>
              <option>Este mês</option>
            </select>
          </div>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="pb-3 text-sm font-medium text-gray-600">Operador</th>
                  <th className="pb-3 text-sm font-medium text-gray-600">Atendimentos</th>
                  <th className="pb-3 text-sm font-medium text-gray-600">Tempo Médio</th>
                  <th className="pb-3 text-sm font-medium text-gray-600">Satisfação</th>
                  <th className="pb-3 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Maria Santos</p>
                          <p className="text-xs text-gray-500">Operador</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-gray-900">24</td>
                    <td className="py-4 text-sm text-gray-900">3:45</td>
                    <td className="py-4">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-900">95%</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Online
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}