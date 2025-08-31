import React, { useRef, useState } from 'react';
import { useNotificationStore } from '../../store/notificationStore';
import type { NotificationSound } from '../../store/notificationStore';

const NotificationSoundSettings: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    soundEnabled,
    selectedSound,
    customSoundName,
    isPlayingSound,
    setSoundEnabled,
    setSound,
    playTestSound,
    stopSound,
    uploadCustomSound,
    removeCustomSound
  } = useNotificationStore();

  const soundOptions: { value: NotificationSound; label: string }[] = [
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'default', label: 'Padrão' },
    { value: 'ding', label: 'Ding' },
    { value: 'pop', label: 'Pop' },
    { value: 'chime', label: 'Chime' },
    { value: 'bell', label: 'Sino' },
    { value: 'custom', label: customSoundName ? `Personalizado: ${customSoundName}` : 'Personalizado' }
  ];

  const handleSoundChange = (sound: NotificationSound) => {
    if (sound === 'custom' && !customSoundName) {
      // Open file picker if custom is selected but no custom sound is set
      handleUploadClick();
    } else {
      setSound(sound);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const success = await uploadCustomSound(file);
      if (success) {
        setUploadError(null);
      } else {
        setUploadError('Erro ao carregar áudio. Verifique o formato e tamanho do arquivo.');
      }
    } catch (error) {
      setUploadError('Erro inesperado ao carregar áudio.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveCustomSound = () => {
    removeCustomSound();
    setUploadError(null);
  };

  const handlePlayStop = () => {
    if (isPlayingSound) {
      stopSound();
    } else {
      playTestSound();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Sons de Notificação
        </h3>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(e) => setSoundEnabled(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Ativar sons
          </span>
        </label>
      </div>

      {soundEnabled && (
        <div className="space-y-4">
          {/* Sound Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Escolher Toque
            </label>
            <div className="grid grid-cols-2 gap-2">
              {soundOptions.map((option) => (
                <label
                  key={option.value}
                  className={`
                    flex items-center p-3 border rounded-lg cursor-pointer transition-colors
                    ${selectedSound === option.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="notificationSound"
                    value={option.value}
                    checked={selectedSound === option.value}
                    onChange={() => handleSoundChange(option.value)}
                    className="sr-only"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Sound Upload */}
          {selectedSound === 'custom' && (
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Toque Personalizado
                </h4>
                {customSoundName && (
                  <button
                    onClick={handleRemoveCustomSound}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remover
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleUploadClick}
                  disabled={isUploading}
                  className={`
                    w-full p-3 border-2 border-dashed rounded-lg text-center transition-colors
                    ${isUploading
                      ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                      : 'border-blue-300 text-blue-600 hover:border-blue-400 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:border-blue-500 dark:hover:bg-blue-900/20'
                    }
                  `}
                >
                  {isUploading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Carregando...
                    </span>
                  ) : customSoundName ? (
                    `Alterar arquivo: ${customSoundName}`
                  ) : (
                    '📁 Escolher arquivo de áudio'
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Formatos aceitos: MP3, WAV, OGG, AAC • Tamanho máximo: 5MB
                </p>

                {uploadError && (
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                    <p className="text-sm text-red-700 dark:text-red-400">{uploadError}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Test Sound Button */}
          <div className="flex justify-center">
            <button
              onClick={handlePlayStop}
              disabled={!soundEnabled}
              className={`
                flex items-center px-4 py-2 rounded-lg font-medium transition-colors
                ${isPlayingSound
                  ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40'
                }
                ${!soundEnabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isPlayingSound ? (
                <>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                  Parar Som
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Testar Som
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSoundSettings;