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
} from 'lucide-react';
import { playNotificationSound, SOUND_OPTIONS, SoundOptionKey } from './DueBillsAlertModal';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

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

  // Permission statuses
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [micStatus, setMicStatus] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  const [cameraStatus, setCameraStatus] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  const [storageStatus, setStorageStatus] = useState<string>('Verificando...');

  useEffect(() => {
    if (!isOpen) return;

    // Load sound prefs
    const savedSound = localStorage.getItem('fin_control_preferred_sound') as SoundOptionKey;
    if (savedSound) setSelectedSound(savedSound);

    const savedEnabled = localStorage.getItem('fin_control_sound_enabled');
    if (savedEnabled !== null) setSoundEnabled(savedEnabled === 'true');

    const checkPermissions = async () => {
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
        } catch (e) {
          setNotificationPermission('unsupported');
        }
      } else {
        if ('Notification' in window) {
          setNotificationPermission(Notification.permission);
        } else {
          setNotificationPermission('unsupported');
        }
      }
    };
    checkPermissions();

    // Check Storage
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      setStorageStatus('Ativo (LocalStorage 100% funcional)');
    } catch (e) {
      setStorageStatus('Indisponível ou Restrito');
    }

    // Check Media Permissions if permissions API is available
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then((res) => {
        setMicStatus(res.state as any);
        res.onchange = () => setMicStatus(res.state as any);
      }).catch(() => setMicStatus('prompt'));
      
      navigator.permissions.query({ name: 'camera' as PermissionName }).then((res) => {
        setCameraStatus(res.state as any);
        res.onchange = () => setCameraStatus(res.state as any);
      }).catch(() => setCameraStatus('prompt'));
    } else {
      setMicStatus('prompt');
      setCameraStatus('prompt');
    }
  }, [isOpen]);

  const handleRequestNotificationPermission = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const permStatus = await LocalNotifications.requestPermissions();
        if (permStatus.display === 'granted') {
          setNotificationPermission('granted');
          await LocalNotifications.schedule({
            notifications: [
              {
                title: 'GKD Mobility',
                body: 'Notificações ativadas com sucesso! Você será avisado de suas contas.',
                id: 1,
                schedule: { at: new Date(Date.now() + 1000) },
              }
            ]
          });
        } else {
          setNotificationPermission('denied');
        }
      } catch (e) {
        console.error('Failed to request notification permission', e);
      }
    } else {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === 'granted') {
          new Notification('GKD Mobility', {
            body: 'Notificações ativadas com sucesso! Você será avisado de suas contas.',
          });
        }
      }
    }
  };

  const handleRequestMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicStatus('granted');
    } catch (err) {
      setMicStatus('denied');
    }
  };

  const handleRequestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setCameraStatus('granted');
    } catch (err) {
      setCameraStatus('denied');
    }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-[#161618] border border-blue-500/40 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,150,255,0.2)] relative overflow-hidden">
        {/* Top Gradient Bar */}
        <div className="h-2 bg-gradient-to-r from-blue-600 via-emerald-500 to-amber-500 w-full" />

        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-blue-500/5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">Central de Notificações & Autorizações</h3>
              <p className="text-xs text-blue-300/80">Gerencie sons, permissões do navegador e acessos do sistema</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          
          {/* Section 1: Sound & Audio */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Sons de Alerta e Notificações
            </h4>
            <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-1.5 flex flex-col sm:flex-row items-stretch sm:items-start gap-1">
              <button
                type="button"
                onClick={() => handleToggleSound(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition ${
                  soundEnabled ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'
                }`}
              >
                <Volume2 className="w-4 h-4" /> Som Ativado
              </button>
              <button
                type="button"
                onClick={() => handleToggleSound(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition ${
                  !soundEnabled ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'
                }`}
              >
                <VolumeX className="w-4 h-4" /> Silencioso
              </button>
            </div>

            {/* Sound Selector (only show if enabled) */}
            <div className={`transition-all duration-300 overflow-hidden ${soundEnabled ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
              {soundEnabled && (
                <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4">
                  <div className="text-xs font-bold text-white mb-3">Escolha o Toque de Alerta</div>
                  <div className="space-y-2">
                    {SOUND_OPTIONS.map((opt) => {
                      const isSelected = selectedSound === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSoundChange(opt.id)}
                          className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-blue-500/20 border-blue-500 text-white'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold">{opt.label}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{opt.description}</div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Browser Push Notifications */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Notificações Push do Aplicativo
            </h4>
            <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-white">Status da API de Notificações</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {notificationPermission === 'granted' && 'Permissão concedida com sucesso!'}
                  {notificationPermission === 'denied' && 'Permissão negada. Altere nas configurações do celular.'}
                  {notificationPermission === 'default' && 'Clique ao lado para autorizar avisos do sistema.'}
                  {notificationPermission === 'unsupported' && 'Não suportado neste ambiente.'}
                </div>
              </div>
              {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
                <button
                  type="button"
                  onClick={handleRequestNotificationPermission}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-lg shrink-0 cursor-pointer"
                >
                  Autorizar Push
                </button>
              )}
              {notificationPermission === 'granted' && (
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-xl shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Autorizado</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Hardware & Device Permissions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Autorizações de Hardware & Mídia
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Microphone */}
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Microfone (IA / Voz)</div>
                      <div className="text-[10px] text-slate-400">Para ditado e comandos de voz</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-[11px] font-medium text-slate-300">
                    {micStatus === 'granted' && 'Concedido'}
                    {micStatus === 'denied' && 'Negado'}
                    {micStatus === 'prompt' && 'Pendente'}
                    {micStatus === 'checking' && 'Verificando...'}
                  </span>
                  {micStatus !== 'granted' ? (
                    <button
                      type="button"
                      onClick={handleRequestMic}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold rounded-lg transition cursor-pointer"
                    >
                      Permitir
                    </button>
                  ) : (
                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> OK
                    </span>
                  )}
                </div>
              </div>

              {/* Camera */}
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Câmera (Boletos / Fotos)</div>
                      <div className="text-[10px] text-slate-400">Para escaneamento de códigos</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-[11px] font-medium text-slate-300">
                    {cameraStatus === 'granted' && 'Concedido'}
                    {cameraStatus === 'denied' && 'Negado'}
                    {cameraStatus === 'prompt' && 'Pendente'}
                    {cameraStatus === 'checking' && 'Verificando...'}
                  </span>
                  {cameraStatus !== 'granted' ? (
                    <button
                      type="button"
                      onClick={handleRequestCamera}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg transition cursor-pointer"
                    >
                      Permitir
                    </button>
                  ) : (
                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> OK
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Storage & Data */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Persistência & Segurança de Dados
            </h4>
            <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Armazenamento Local Seguro</div>
                <div className="text-[11px] text-slate-400">{storageStatus}</div>
              </div>
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                <Unlock className="w-4 h-4" />
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-900/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition shadow-lg cursor-pointer"
          >
            Tudo Pronto / Concluído
          </button>
        </div>
      </div>
    </div>
  );
};
