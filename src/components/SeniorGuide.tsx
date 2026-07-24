import React from 'react';
import { ShieldCheck, Lock, CreditCard, Truck, AlertOctagon, HelpCircle } from 'lucide-react';

interface SeniorGuideProps {
  fontSize: 'normal' | 'large' | 'xlarge';
  highContrast: boolean;
}

export const SeniorGuide: React.FC<SeniorGuideProps> = ({ fontSize, highContrast }) => {
  const textClasses = {
    normal: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl',
  }[fontSize];

  const rules = [
    {
      icon: <Truck className="w-8 h-8 text-amber-600 shrink-0" />,
      title: '1. Kurýr DPD ani Zásilkovna NEPOSÍLÁ peníze přes odkaz',
      desc: 'Pokud vám kupující tvrdí, že posílá kurýra a vy musíte kliknout na odkaz a zadat údaje z bankovní karty, jde na 100 % o podvod! Kurýrní služby takto nefungují.',
      badge: 'KRITICKÉ RULE #1',
      badgeColor: 'bg-red-100 text-red-800 border-red-300',
    },
    {
      icon: <CreditCard className="w-8 h-8 text-blue-600 shrink-0" />,
      title: '2. Rozdíl mezi číslem účtu a číslem karty',
      desc: 'Pro přijetí peněz kupujícímu stačí pouze číslo vašeho bankovního účtu (např. 12345678/0800). Číslo karty, datum platnosti a kód CVV ze zadní strany karty slouží K PLACENÍ — nikomu je neposílejte!',
      badge: 'DŮLEŽITÉ',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    {
      icon: <Lock className="w-8 h-8 text-emerald-600 shrink-0" />,
      title: '3. Při nákupu z druhé ruky je nejbezpečnější osobní předání',
      desc: 'Nejlepší obranou při nákupu na Bazoši nebo Sbazaru je osobní odběr. Zboží si prohlédnete, vyzkoušíte a zaplatíte až při převzetí z ruky do ruky.',
      badge: 'BEZPEČNÝ NÁKUP',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      icon: <AlertOctagon className="w-8 h-8 text-purple-600 shrink-0" />,
      title: '4. Pozor na pohádkové slevy a garance zisků',
      desc: 'Sleva 90 % na značkové oblečení z reklamy na Facebooku, nebo slib "garantovaného měsíčního příjmu 50 000 Kč z investic" je vždy past na vaše peníze.',
      badge: 'PAST NA NÁVNADU',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    },
    {
      icon: <HelpCircle className="w-8 h-8 text-teal-600 shrink-0" />,
      title: '5. Když máte pochybnosti, raději odkaz zadejte sem',
      desc: 'Není ostuda se ujistit. Pokud si nejste jistí zprávou v telefonu nebo e-shopem, zkopírujte odkaz sem do aplikace, nebo se poraďte s rodinou.',
      badge: 'RADA PRO RODINU',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    },
  ];

  return (
    <div
      className={`rounded-3xl p-6 sm:p-8 shadow-xl border my-8 transition-all ${
        highContrast
          ? 'bg-black border-yellow-400 text-white'
          : 'bg-[#121214] border-[#B8860B]/60 text-slate-100 shadowguard-bronze-border'
      }`}
    >
      <div className="mb-6 pb-4 border-b border-slate-800">
        <span className="text-xs font-black px-3 py-1 bg-[#1C1C1E] text-[#00F5FF] border border-[#00F5FF]/40 rounded-full uppercase tracking-wider">
          Průvodce pro otce
        </span>
        <h2 className="text-2xl sm:text-3xl font-black mt-2 flex items-center gap-2 text-white">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
          5 Zlatých pravidel bezpečnosti na internetu
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Zapamatujte si tyto jednoduché zásady pro klidné a bezpečné nakupování i prodej z domova.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rules.map((rule, idx) => (
          <div
            key={idx}
            className={`p-5 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-start gap-4 ${
              highContrast
                ? 'bg-slate-900 border-yellow-400 text-white'
                : 'bg-[#1C1C1E] border-[#B8860B]/40 hover:border-[#00F5FF]'
            }`}
          >
            <div className="p-3 rounded-2xl bg-[#121214] border border-[#B8860B]/50 shadow-sm shrink-0">
              {rule.icon}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black px-2 py-0.5 rounded border bg-rose-950/80 text-rose-300 border-rose-500/40">
                  {rule.badge}
                </span>
              </div>
              <h3 className="text-lg font-black mb-1 text-white">
                {rule.title}
              </h3>
              <p className={`text-slate-300 leading-relaxed ${textClasses}`}>
                {rule.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
