import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ScanFace,
  X,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  checkBiometricAvailability,
  getBiometricPlatformLabel,
  isMobileDeviceBrowser,
} from '../utils/biometricAuth';

interface BiometricModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BiometricModal: React.FC<BiometricModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    isBiometricEnabledForCurrentUser,
    biometricBindings,
    enableFacialBiometrics,
    disableFacialBiometrics,
    loginWithBiometrics,
  } = useApp();

  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [availability, setAvailability] = useState<{
    supported: boolean;
    platformAvailable: boolean;
    isIframe: boolean;
    reason?: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFeedback(null);
    checkBiometricAvailability().then(setAvailability);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentBinding = biometricBindings.find(b => b.userId === currentUser.id);
  const platformLabel = getBiometricPlatformLabel();
  const isMobile = isMobileDeviceBrowser();

  const handleEnable = async () => {
    setFeedback(null);
    setIsProcessing(true);
    const res = await enableFacialBiometrics();
    setIsProcessing(false);
    setFeedback({ ok: res.success, text: res.message });
  };

  const handleTestBiometric = async () => {
    setFeedback(null);
    setIsProcessing(true);
    const res = await loginWithBiometrics(currentUser.id);
    setIsProcessing(false);
    if (res.success) {
      setFeedback({
        ok: true,
        text: 'Leitura facial validada com sucesso neste aparelho!',
      });
    } else {
      setFeedback({
        ok: false,
        text: res.message || 'Falha ao validar biometria facial.',
      });
    }
  };

  const handleDisable = () => {
    disableFacialBiometrics();
    setFeedback({
      ok: true,
      text: 'Acesso por biometria facial removido deste aparelho.',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#161616] border border-neutral-800 rounded-2xl p-6 text-white shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isBiometricEnabledForCurrentUser
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-200'
              }`}
            >
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Biometria Facial
              </h3>
              <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                <Smartphone className="w-3 h-3 text-neutral-500" />
                <span>{platformLabel}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Account Binding Info */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3.5 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Conta conectada:</span>
            <span className="font-bold text-white">{currentUser.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Login vinculado:</span>
            <span className="font-mono text-neutral-300">@{currentUser.login}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Status neste aparelho:</span>
            {isBiometricEnabledForCurrentUser ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ativa</span>
              </span>
            ) : (
              <span className="text-neutral-400 font-semibold">Não habilitada</span>
            )}
          </div>
        </div>

        {/* Explanation */}
        <p className="text-xs text-neutral-300 leading-relaxed">
          Ao habilitar este recurso no seu celular (<strong>iPhone Face ID</strong> ou{' '}
          <strong>Android Biometria Facial</strong>), você poderá desbloquear seus próximos acessos ao
          aplicativo com reconhecimento facial nativo, sem precisar redigitar login e senha.
        </p>

        {/* Desktop / Iframe Notice when applicable */}
        {availability && !isMobile && !availability.platformAvailable && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Você está acessando em um dispositivo sem sensor biométrico ativo ou em visualização desktop.
              Abra o aplicativo no navegador do seu <strong>iPhone (Safari)</strong> ou{' '}
              <strong>Android (Chrome)</strong> para ativar a leitura facial nativa.
            </span>
          </div>
        )}

        {availability?.isIframe && (
          <div className="p-3 rounded-lg bg-neutral-800/80 border border-neutral-700 text-[11px] text-neutral-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
            <span>
              Se o navegador bloquear o sensor no modo de pré-visualização, abra o link oficial do app diretamente em uma aba do navegador do seu celular.
            </span>
          </div>
        )}

        {/* Action Feedback */}
        {feedback && (
          <div
            className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
              feedback.ok
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/10 border-red-500/40 text-red-300'
            }`}
          >
            {feedback.ok ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {!isBiometricEnabledForCurrentUser ? (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleEnable}
              className="w-full py-3 px-4 rounded-xl bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-60 shadow-lg"
            >
              <ScanFace className="w-4 h-4" />
              <span>
                {isProcessing ? 'Aguardando leitura facial...' : 'Habilitar Biometria Facial'}
              </span>
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleTestBiometric}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                <ScanFace className="w-4 h-4" />
                <span>
                  {isProcessing ? 'Verificando rosto...' : 'Testar Biometria Facial Agora'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleDisable}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-red-400 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Desativar Biometria neste Aparelho</span>
              </button>

              {currentBinding?.enabledAt && (
                <p className="text-[10px] text-center text-neutral-500 pt-1">
                  Habilitada em{' '}
                  {new Date(currentBinding.enabledAt).toLocaleDateString('pt-BR')} (
                  {currentBinding.deviceType})
                </p>
              )}
            </>
          )}
        </div>

        {/* Security Note */}
        <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-center gap-1.5 text-[10px] text-neutral-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Autenticação protegida pelo hardware seguro do dispositivo (WebAuthn)</span>
        </div>
      </div>
    </div>
  );
};
