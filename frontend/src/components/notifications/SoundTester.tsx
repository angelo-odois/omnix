import { useState, useRef } from 'react';
import { Volume2, VolumeX, Play, Upload, X } from 'lucide-react';
import { useNotificationStore, NotificationSound } from '../../store/notificationStore';

export default function SoundTester() {
  const { soundEnabled, selectedSound, customSoundUrl, setSoundEnabled, setSound, playTestSound } = useNotificationStore();
  const [testing, setTesting] = useState(false);
  const [uploadingCustom, setUploadingCustom] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const soundOptions: { value: NotificationSound; label: string; emoji: string; description: string }[] = [
    { value: 'whatsapp', label: 'WhatsApp', emoji: '📱', description: 'Som familiar do WhatsApp' },
    { value: 'ding', label: 'Ding', emoji: '🔔', description: 'Som clássico de notification' },
    { value: 'chime', label: 'Chime', emoji: '🎵', description: 'Som melodioso e suave' },
    { value: 'bell', label: 'Sino', emoji: '🔔', description: 'Som de sino tradicional' },
    { value: 'pop', label: 'Pop', emoji: '💫', description: 'Som rápido e discreto' },
    { value: 'default', label: 'Sistema', emoji: '🖥️', description: 'Som padrão do sistema' }
  ];

  const handleTestSound = async (sound: NotificationSound) => {
    setTesting(true);
    setSound(sound);
    
    // Wait a moment then play
    setTimeout(() => {
      playTestSound();
      setTesting(false);
    }, 100);
  };

  const handleCustomSoundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('audio/')) {
      alert('Por favor, selecione um arquivo de áudio válido (MP3, WAV, etc.)');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 5MB permitido.');
      return;
    }

    setUploadingCustom(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const audioData = e.target?.result as string;
      setSound('custom', audioData);
      setUploadingCustom(false);
      
      // Test the uploaded sound
      setTimeout(() => {
        playTestSound();
      }, 100);
    };
    
    reader.onerror = () => {
      alert('Erro ao ler o arquivo de áudio');
      setUploadingCustom(false);
    };
    
    reader.readAsDataURL(file);
  };

  const removeCustomSound = () => {
    setSound('whatsapp'); // Reset to default
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">🔔 Sons de Notificação</h3>
          <p className="text-gray-600">Escolha o som que será tocado quando chegar nova mensagem</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              soundEnabled ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-lg ${
                soundEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
          <div className="text-sm">
            {soundEnabled ? (
              <div className="flex items-center text-green-600">
                <Volume2 className="w-4 h-4 mr-1" />
                Ativado
              </div>
            ) : (
              <div className="flex items-center text-gray-500">
                <VolumeX className="w-4 h-4 mr-1" />
                Desativado
              </div>
            )}
          </div>
        </div>
      </div>

      {soundEnabled && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Escolha seu som preferido:</h4>
          
          <div className="grid grid-cols-1 gap-3">
            {soundOptions.map(option => (
              <div 
                key={option.value}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedSound === option.value 
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSound(option.value)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{option.emoji}</span>
                    <div>
                      <h5 className="font-medium text-gray-900">{option.label}</h5>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {selectedSound === option.value && (
                      <span className="text-sm text-blue-600 font-medium">✓ Selecionado</span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestSound(option.value);
                      }}
                      disabled={testing}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                    >
                      {testing ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                      ) : (
                        <Play className="w-3 h-3 mr-1" />
                      )}
                      Testar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Custom Sound Upload */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">🎵 Som Personalizado</h4>
            
            {!customSoundUrl ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleCustomSoundUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingCustom}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center"
                >
                  {uploadingCustom ? (
                    <>
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                      <p className="text-sm text-gray-600">Carregando áudio...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-700">Carregar som personalizado</p>
                      <p className="text-xs text-gray-500 mt-1">MP3, WAV, OGG (máx. 5MB)</p>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">🎵</span>
                    <div>
                      <p className="text-sm font-medium text-green-800">Som personalizado carregado</p>
                      <p className="text-xs text-green-600">Clique em "Testar" para ouvir</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSound('custom');
                        playTestSound();
                      }}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Testar
                    </button>
                    <button
                      onClick={removeCustomSound}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Remover som personalizado"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test Notification Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                // Add a test notification
                useNotificationStore.getState().addNotification({
                  type: 'message',
                  title: 'Teste de Notificação',
                  message: 'Esta é uma notificação de teste com o som selecionado!',
                  priority: 'high'
                });
              }}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Testar Notificação Completa
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Simula uma notificação real com som e toast
            </p>
          </div>
        </div>
      )}
    </div>
  );
}