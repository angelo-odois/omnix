import { useState } from 'react';
import { api } from '../../lib/api';

export default function InstanceTest() {
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Testing API...');
      const response = await api.get('/whatsapp/instances');
      console.log('API Response:', response.data);
      
      setInstances(response.data.data || []);
    } catch (err: any) {
      console.error('API Error:', err);
      setError(err.message || 'Erro na API');
    } finally {
      setLoading(false);
    }
  };

  const deleteInstance = async (id: string) => {
    try {
      console.log('Deleting instance:', id);
      const response = await api.delete(`/whatsapp/instances/${id}`);
      console.log('Delete response:', response.data);
      
      if (response.data.success) {
        alert('Instância removida com sucesso!');
        testAPI(); // Reload
      } else {
        alert('Erro ao remover: ' + response.data.message);
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      alert('Erro: ' + err.message);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-bold mb-4">🧪 Teste de API - Instâncias</h3>
      
      <button
        onClick={testAPI}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Carregando...' : 'Testar API'}
      </button>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          Erro: {error}
        </div>
      )}
      
      <div className="space-y-2">
        <p className="font-medium">Instâncias encontradas: {instances.length}</p>
        
        {instances.map((instance) => (
          <div key={instance.id} className="p-3 bg-gray-50 rounded flex justify-between items-center">
            <div>
              <strong>{instance.name}</strong> 
              <span className="text-sm text-gray-600 ml-2">
                ({instance.status}) {instance.tenantName && `- ${instance.tenantName}`}
              </span>
            </div>
            <button
              onClick={() => deleteInstance(instance.id)}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              🗑️ Apagar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}