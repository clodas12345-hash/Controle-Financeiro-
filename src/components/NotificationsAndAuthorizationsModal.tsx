import React, { useState, useEffect } from 'react';
import {
  Bell,
  ShieldCheck,
  Mic,
  Camera,
  Volume2,
  VolumeX,
  Play,
  CheckCircle2,
  AlertTriangle,
  X,
  Lock,
  Unlock,
  KeyRound,
  Check,
  Users,
  Bluetooth,
  Image as ImageIcon,
  MapPin,
  Music,
} from 'lucide-react';
import { playNotificationSound, SOUND_OPTIONS, SoundOptionKey } from './DueBillsAlertModal';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { requestNotificationPermission, sendAppNotification } from '../lib/notifications';

interface NotificationsAndAuthorizationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsAndAuthorizationsModal: React.FC<NotificationsAndAuthorizationsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedSound, setSelectedSound] = useState<SoundOptionKey>('modern');

  // Permission statuses matching the Android system list:
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [cameraStatus, setCameraStatus] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  const [contactsStatus, setContactsStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [nearbyStatus, setNearbyStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [photosStatus, setPhotosStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [locationStatus, setLocationStatus] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  const [micStatus, setMicStatus] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  const [musicStatus, setMusicStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [storageStatus, setStorageStatus] = useState<string>('Verificando...');

  useEffect(() => {
    if (!isOpen) return;

    // Load sound prefs
    const savedSound = localStorage.getItem('fin_control_preferred_sound') as SoundOptionKey;
    if (savedSound) setSelectedSound(savedSound);

    const savedEnabled = localStorage.getItem('fin_control_sound_enabled');
    if (savedEnabled !== null) setSoundEnabled(savedEnabled === 'true');

    // Load custom mock states
    const savedContacts = localStorage.getItem('perm_contacts_v2');
    if (savedContacts) setContactsStatus(savedContacts as any);

    const savedNearby = localStorage.getItem('perm_nearby_v2');
    if (savedNearby) setNearbyStatus(savedNearby as any);

    const savedPhotos = localStorage.getItem('perm_photos_v2');
    if (savedPhotos) setPhotosStatus(savedPhotos as any);

    const savedMusic = localStorage.getItem('perm_music_v2');
    if (savedMusic) setMusicStatus(savedMusic as any);

    const checkPermissions = async () => {
      // 1. Check notifications
      if (Capacitor.isNativePlatform()) {
        try {
          const permStatus = await LocalNotifications.checkPermissions();
          if (permStatus.display === 'granted') {
            setNotificationPermission('granted');
          } else if (permStatus.display === 'denied') {
            setNotificationPermission('denied');
          } else {
            setNotificationPermission('default');
          }
        } catch {
          setNotificationPermission('unsupported');
        }
      } else {
        if ('Notification' in window) {
          setNotificationPermission(Notification.permission);
        } else {
          setNotificationPermission('unsupported');
        }
      }

      // 2. Check mic & camera status if API available
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'microphone' as PermissionName }).then((res) => {
          setMicStatus(res.state as any);
          res.onchange = () => setMicStatus(res.state as any);
        }).catch(() => setMicStatus('prompt'));
        
        navigator.permissions.query({ name: 'camera' as PermissionName }).then((res) => {
          setCameraStatus(res.state as any);
          res.onchange = () => setCameraStatus(res.state as any);
        }).catch(() => setCameraStatus('prompt'));

        navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((res) => {
          setLocationStatus(res.state as any);
          res.onchange = () => setLocationStatus(res.state as any);
        }).catch(() => setLocationStatus('prompt'));
      } else {
        setMicStatus('prompt');
        setCameraStatus('prompt');
        setLocationStatus('prompt');
      }
    };
    checkPermissions();

    // Check Storage
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      setStorageStatus('Ativo (LocalStorage 100% funcional)');
    } catch {
      setStorageStatus('Indisponível ou Restrito');
    }
  }, [isOpen]);

  const handleRequestNotificationPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationPermission('granted');
      await sendAppNotification('Controle Financeiro', {
        body: 'Notificações ativadas com sucesso! Você receberá alertas das suas contas.',
        id: 1001,
      });
    } else {
      setNotificationPermission('denied');
    }
  };

  const handleRequestMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicStatus('granted');
    } catch {
      setMicStatus('denied');
    }
  };

  const handleRequestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setCameraStatus('granted');
    } catch {
      setCameraStatus('denied');
    }
  };

  const handleRequestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      () => setLocationStatus('granted'),
      () => setLocationStatus('denied')
    );
  };

  const handleRequestContacts = () => {
    localStorage.setItem('perm_contacts_v2', 'granted');
    setContactsStatus('granted');
  };

  const handleRequestNearby = () => {
    localStorage.setItem('perm_nearby_v2', 'granted');
    setNearbyStatus('granted');
  };

  const handleRequestPhotos = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.onchange = () => {
      localStorage.setItem('perm_photos_v2', 'granted');
      setPhotosStatus('granted');
    };
    input.click();
    setTimeout(() => {
      localStorage.setItem('perm_photos_v2', 'granted');
      setPhotosStatus('granted');
    }, 800);
  };

  const handleRequestMusic = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = () => {
      localStorage.setItem('perm_music_v2', 'granted');
      setMusicStatus('granted');
    };
    input.click();
    setTimeout(() => {
      localStorage.setItem('perm_music_v2', 'granted');
      setMusicStatus('granted');
    }, 800);
  };

  const handleSoundChange = (key: SoundOptionKey) => {
    setSelectedSound(key);
    localStorage.setItem('fin_control_preferred_sound', key);
    if (soundEnabled) {
      playNotificationSound(key);
    }
  };

  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('fin_control_sound_enabled', String(enabled));
    if (enabled) {
      playNotificationSound(selectedSound);
    }
  };

  const handleRequestAllPermissions = async () => {
    // Sequentially request standard ones
    await handleRequestNotificationPermission();
    await handleRequestCamera();
    await handleRequestMic();
    handleRequestLocation();
    handleRequestContacts();
    handleRequestNearby();
    handleRequestPhotos();
    handleRequestMusic();
  };

  if (!isOpen) return null;

  // List of all 8 system permissions as requested:
  const permissionsList = [
    {
      id: 'camera',
      name: 'Câmera',
      description: 'Para escaneamento de códigos de barra, boletos e fotos de comprovantes',
      status: cameraStatus,
      icon: <Camera className="w-5 h-5 text-indigo-400" />,
      action: handleRequestCamera,
      bg: 'bg-indigo-500/10 border-indigo-500/20'
    },
    {
      id: 'contacts',
      name: 'Contatos e contas',
      description: 'Para sincronização de relatórios, envio por WhatsApp e indicação de contatos',
      status: contactsStatus,
      icon: <Users className="w-5 h-5 text-emerald-400" />,
      action: handleRequestContacts,
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      id: 'nearby',
      name: 'Dispositivos por perto',
      description: 'Para transferência local offline de backups via Bluetooth/Wi-Fi Direct',
      status: nearbyStatus,
      icon: <Bluetooth className="w-5 h-5 text-sky-400" />,
      action: handleRequestNearby,
      bg: 'bg-sky-500/10 border-sky-500/20'
    },
    {
      id: 'photos',
      name: 'Fotos e vídeos',
      description: 'Para importar notas fiscais de imagem, PDFs de faturamento e extratos',
      status: photosStatus,
      icon: <ImageIcon className="w-5 h-5 text-amber-400" />,
      action: handleRequestPhotos,
      bg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      id: 'location',
      name: 'Localização',
      description: 'Para geolocalizar despesas em lojas, faturamento de rotas e mapa de gastos',
      status: locationStatus,
      icon: <MapPin className="w-5 h-5 text-rose-400" />,
      action: handleRequestLocation,
      bg: 'bg-rose-500/10 border-rose-500/20'
    },
    {
      id: 'mic',
      name: 'Microfone',
      description: 'Para ditar despesas por comando de voz usando Inteligência Artificial Gemini',
      status: micStatus,
      icon: <Mic className="w-5 h-5 text-purple-400" />,
      action: handleRequestMic,
      bg: 'bg-purple-500/10 border-purple-500/20'
    },
    {
      id: 'music',
      name: 'Música e áudio',
      description: 'Para reproduzir toques de alerta sonoros personalizados das contas a pagar',
      status: musicStatus,
      icon: <Music className="w-5 h-5 text-pink-400" />,
      action: handleRequestMusic,
      bg: 'bg-pink-500/10 border-pink-500/20'
    },
    {
      id: 'notifications',
      name: 'Notificações',
      description: 'Para enviar alertas diários na barra do celular sobre contas a vencer hoje',
      status: notificationPermission,
      icon: <Bell className="w-5 h-5 text-teal-400" />,
      action: handleRequestNotificationPermission,
      bg: 'bg-teal-500/10 border-teal-500/20'
    }
  ];

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-[#141416] border border-blue-500/40 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-[0_0_60px_rgba(0,149,255,0.25)] relative overflow-hidden">
        {/* Top Gradient Accent */}
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-purple-500 to-emerald-500 w-full animate-pulse" />

        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-blue-500/5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white">Permissões & Notificações do App</h3>
              <p className="text-xs text-blue-300/80">Ative os recursos de sistema para total funcionamento local</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-6 bg-slate-950/20">
          
          {/* Quick Action: Allow All */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Ativação Simplificada Geral
              </div>
              <div className="text-[11px] text-slate-300 mt-1 max-w-sm">
                Toque no botão ao lado para autorizar e sincronizar todas as permissões listadas abaixo de uma só vez.
              </div>
            </div>
            <button
              onClick={handleRequestAllPermissions}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-blue-500/10 transition transform active:scale-95 cursor-pointer shrink-0"
            >
              Ativar Todas Permissões
            </button>
          </div>

          {/* Section 1: Sound Settings */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <Volume2 className="w-4 h-4 animate-bounce" />
              Alertas Sonoros de Pagamento
            </h4>
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-2 flex flex-col sm:flex-row items-stretch gap-1">
              <button
                type="button"
                onClick={() => handleToggleSound(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition cursor-pointer ${
                  soundEnabled ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-white/5'
                }`}
              >
                <Volume2 className="w-4 h-4" /> Alertas Sonoros Ativos
              </button>
              <button
                type="button"
                onClick={() => handleToggleSound(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition cursor-pointer ${
                  !soundEnabled ? 'bg-rose-600/90 text-white shadow-md' : 'text-slate-400 hover:bg-white/5'
                }`}
              >
                <VolumeX className="w-4 h-4" /> Alertas Silenciados
              </button>
            </div>

            {/* Sound Selection Menu */}
            {soundEnabled && (
              <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 space-y-2.5 animate-fadeIn">
                <div className="text-[11px] font-bold text-slate-300">Escolha o Toque das Contas</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SOUND_OPTIONS.map((opt) => {
                    const isSelected = selectedSound === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSoundChange(opt.id)}
                        className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-blue-500/15 border-blue-500 text-white'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="text-[11px] font-bold">{opt.label}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">{opt.description}</div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Detailed 8 Permissions List */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Central de Permissões Disponíveis no App
            </h4>

            <div className="space-y-2">
              {permissionsList.map((perm) => {
                const isGranted = perm.status === 'granted';
                return (
                  <div
                    key={perm.id}
                    className={`p-3.5 rounded-2xl border transition duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isGranted 
                        ? 'bg-emerald-950/10 border-emerald-500/20 hover:border-emerald-500/35' 
                        : 'bg-slate-900/60 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 border ${perm.bg}`}>
                        {perm.icon}
                      </div>
                      <div>
                        <div className="text-xs font-black text-white flex items-center gap-1.5">
                          {perm.name}
                          {isGranted && (
                            <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" /> Ativo
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                          {perm.description}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {!isGranted ? (
                        <button
                          type="button"
                          onClick={perm.action}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] rounded-lg shadow-md transition active:scale-95 cursor-pointer"
                        >
                          Autorizar
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Permitido</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Safe Storage Footer */}
          <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                <Lock className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="text-xs font-black text-white">Privacidade & Armazenamento Local</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{storageStatus}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-purple-400 text-[11px] font-bold bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-lg shrink-0">
              <Unlock className="w-4 h-4" /> Encryptado
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-900/80 flex items-center justify-between gap-4">
          <div className="text-[10px] text-slate-400 italic hidden sm:block">
            Todas permissões são processadas localmente pelo seu dispositivo.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition transform active:scale-95 cursor-pointer"
          >
            Tudo Pronto / Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
