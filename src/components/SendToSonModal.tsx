import React, { useState, useEffect } from 'react';
import { Send, Phone, MessageSquare, Check, Share2, X, Copy, ShieldCheck, Heart, AlertCircle } from 'lucide-react';
import { AdCheckResult, ThemeMode } from '../types';
import { cleanUrlForSharing } from '../utils/urlUtils';
import { isIOS } from '../utils/platform';
import { copyTextToClipboard } from '../utils/shareFile';

interface SendToSonModalProps {
  isOpen: boolean;
  onClose: () => void;
  result?: AdCheckResult | null;
  customText?: string;
  themeMode: ThemeMode;
}

export const SendToSonModal: React.FC<SendToSonModalProps> = ({
  isOpen,
  onClose,
  result,
  customText,
  themeMode,
}) => {
  const [sonPhone, setSonPhone] = useState(() => {
    try {
      return localStorage.getItem('strazce_son_phone') || '';
    } catch {
      return '';
    }
  });

  const [copied, setCopied] = useState(false);
  const [smsNotice, setSmsNotice] = useState('');

  useEffect(() => {
    try {
      if (sonPhone) {
        localStorage.setItem('strazce_son_phone', sonPhone);
      }
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [sonPhone]);

  if (!isOpen) return null;

  // Clean phone number for international format
  const cleanPhone = (num: string) => {
    const raw = num.replace(/\s+/g, '').replace('+', '');
    if (raw.length === 9) return '420' + raw;
    return raw;
  };

  const rawUrl = result?.inputUrl || '';
  const cleanedUrl = rawUrl ? cleanUrlForSharing(rawUrl) : '';

  const adInfo = result
    ? `Inzerát: ${result.headline}\nVýsledek: ${result.safetyLevel} (${result.trustScore}/100)\n${
        cleanedUrl ? `Odkaz: ${cleanedUrl}\n` : ''
      }Rada: ${result.summaryForSenior}`
    : customText || 'Prosím o prověření tohoto inzerátu.';

  const defaultMsg = `Ahoj synu, zkontroluj mi prosím tento inzerát z mého telefonu:\n\n${adInfo}\n\nPosláno přes Strážce Inzerátů.`;

  const formattedPhone = cleanPhone(sonPhone);

  const handleWhatsApp = () => {
    const url = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(defaultMsg)}`
      : `https://wa.me/?text=${encodeURIComponent(defaultMsg)}`;
    window.open(url, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Strážce Inzerátů',
          text: defaultMsg,
        });
        return true;
      } catch (err) {
        // User cancelled or error
        console.warn('Native share cancelled or failed:', err);
      }
    }
    return false;
  };

  const handleSMS = async () => {
    setSmsNotice('');

    // Detect iOS for SMS URL scheme difference
    const delimiter = isIOS() ? '&' : '?';

    const smsUrl = formattedPhone
      ? `sms:+${formattedPhone}${delimiter}body=${encodeURIComponent(defaultMsg)}`
      : `sms:${delimiter}body=${encodeURIComponent(defaultMsg)}`;

    try {
      // Try native share first if available
      const shared = await handleNativeShare();
      if (!shared) {
        window.location.href = smsUrl;
      }
    } catch (e) {
      console.warn('SMS redirect error, falling back to copy:', e);
      // Fallback to clipboard copy
      handleCopy();
      setSmsNotice('Nelze přímo spustit aplikaci SMS. Text byl zkopírován do schránky — můžete ho vložit přímo do SMS zprávy.');
    }
  };

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(defaultMsg);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const isShadowGuard = themeMode === 'shadowguard';
  const isCyber = themeMode === 'cyberpunk';
  const isContrast = themeMode === 'highContrast';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        className={`relative w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all ${
          isShadowGuard
            ? 'bg-[#121214] border-[#CD7F32]/80 text-white shadow-[0_0_40px_rgba(212,160,23,0.3)] shadowguard-bronze-border'
            : isCyber
            ? 'bg-slate-950 border-cyan-500/40 text-slate-100 shadow-[0_0_30px_rgba(6,182,212,0.25)]'
            : isContrast
            ? 'bg-black border-yellow-400 text-white'
            : 'bg-[#121214] border-[#B8860B]/80 text-slate-100 shadowguard-bronze-border'
        }`}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-5 right-5 p-2 rounded-2xl transition-colors ${
            isCyber
              ? 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30'
              : isContrast
              ? 'bg-yellow-400 text-black hover:bg-yellow-300'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`p-3 rounded-2xl ${
              isCyber
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : isContrast
                ? 'bg-yellow-400 text-black'
                : 'bg-emerald-600 text-white'
            }`}
          >
            <Send className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black">
              Odeslat inzerát synovi na telefon
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Rychlé přeposlání na WhatsApp nebo SMS k podrobnější analýze
            </p>
          </div>
        </div>

        {/* Son Phone Number Setting */}
        <div className="mb-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Telefonní číslo syna (pro 1-kliknutí):</span>
            <span className="text-[10px] font-normal text-slate-500">(Uloží se v telefonu)</span>
          </label>
          <div className="relative">
            <Phone className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="tel"
              value={sonPhone}
              onChange={(e) => setSonPhone(e.target.value)}
              placeholder="Např. 777 123 456 nebo +420..."
              className={`w-full pl-11 pr-4 py-3 rounded-2xl border-2 font-mono text-sm transition-all ${
                isCyber
                  ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400'
                  : 'bg-[#1C1C1E] border-[#B8860B]/50 text-white placeholder-slate-500'
              }`}
            />
          </div>
        </div>

        {/* Preview of message */}
        <div className={`p-4 rounded-2xl border mb-4 text-xs sm:text-sm font-sans whitespace-pre-wrap leading-relaxed ${
          isCyber ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-[#1C1C1E] border-[#B8860B]/40 text-slate-200'
        }`}>
          <span className="block font-bold text-slate-400 text-[10px] uppercase mb-1">
            Zkrácený náhled odesílané zprávy:
          </span>
          {defaultMsg}
        </div>

        {/* Notice banner if SMS fails or copied */}
        {smsNotice && (
          <div className="mb-4 p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{smsNotice}</span>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleWhatsApp}
            className="w-full py-3.5 px-5 rounded-2xl font-black text-sm sm:text-base bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all flex items-center justify-center gap-2.5"
          >
            <MessageSquare className="w-5 h-5" />
            <span>ODESLAT PŘES WHATSAPP</span>
          </button>

          <button
            type="button"
            onClick={handleSMS}
            className={`w-full py-3.5 px-5 rounded-2xl font-black text-sm sm:text-base border transition-all flex items-center justify-center gap-2.5 ${
              isCyber
                ? 'bg-slate-900 hover:bg-slate-800 border-cyan-500/40 text-cyan-400'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            <Send className="w-5 h-5" />
            <span>ODESLAT JAKO SMS / SDÍLET</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Zpráva zkopírována do schránky!' : 'Pouze zkopírovat text zprávy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
