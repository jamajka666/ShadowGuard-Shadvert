import React, { useState } from 'react';
import { HelpCircle, CheckCircle, XCircle, RefreshCw, Award, ArrowRight } from 'lucide-react';

interface Question {
  id: number;
  title: string;
  scenario: string;
  isScam: boolean;
  explanation: string;
  redFlags: string[];
}

const QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    title: 'Zpráva na WhatsAppu ohledně prodeje kočárku',
    scenario:
      'Prodáváte na Bazoši starý kočárek za 1 500 Kč. Na WhatsApp napíše zájemce: "Dobrý den, mám zájem. Pošlu k vám DPD kurýra, ten vám přiveze hotovost. DPD vás pošle na odkaz d-p-d-kurier-platba.cz/order, kde zadáte číslo vaší karty pro připsání peněz."',
    isScam: true,
    explanation:
      'JDE O PODVOD! DPD ani Zásilkovna nikdy neposílá odkazy pro vyplnění údajů z platební karty prodávajícího. Číslo karty slouží jen k placení, ne k přijímání peněz!',
    redFlags: [
      'Vyžaduje vyplnění karty pro připsání peněz',
      'Falešná doména (d-p-d-kurier-platba.cz místo dpd.cz)',
      'Komunikace z neznámého čísla přes WhatsApp',
    ],
  },
  {
    id: 2,
    title: 'SMS od "České pošty" o doplatku 28 Kč',
    scenario:
      'Přijde vám SMS: "Ceská posta: Vase zasilka nebyla doručena kvuli malému doplatku 28 KC. Zaplatte do 24 hodin zde: cposta-doplatek-cesko.com/pay."',
    isScam: true,
    explanation:
      'JDE O PODVOD! Česká pošta neposílá SMS s odkazy na neznámé zahraniční domény (.com/pay) a nevyžaduje okamžitou platbu kartou přes SMS link.',
    redFlags: [
      'Podezřelý odkaz mimo oficiální ceskaposta.cz',
      'Časový tlak (zaplaťte do 24 hodin)',
      'Často chybí háčky a čárky',
    ],
  },
  {
    id: 3,
    title: 'Inzerát na nábytek s osobním převzetím v Olomouci',
    scenario:
      'Prodávající nabízí zachovalou šatní skříň na Bazoš.cz za 2 000 Kč. V inzerátu uvádí telefonní číslo, popis stavu a nabízí možnost přijít si skříň prohlédnout a zaplatit v hotovosti při osobním odběru.',
    isScam: false,
    explanation:
      'TENTO INZERÁT JE BEZPEČNÝ! Oficiální doména Bazoš.cz, možnost osobního prohlédnutí zboží a platby v hotovosti z ruky do ruky je nejbezpečnější způsob nákupu.',
    redFlags: [],
  },
  {
    id: 4,
    title: 'Reklama na Facebooku na sadu nářadí Makita za 499 Kč',
    scenario:
      'V reklama na Facebooku vidíte profi sadu nářadí Makita (běžně v obchodu za 8 000 Kč) v akci za 499 Kč z důvodu "likvidace skladu". Na e-shopu chybí kontaktní telefon, IČO i obchodní podmínky.',
    isScam: true,
    explanation:
      'JDE O PODVOD! Nereálně nízká cena (sleva 95 %) slouží jako návnada na chamtivost. E-shop bez IČO a kontaktů z vás vytáhne platbu kartou a zboží nikdy nedorazí.',
    redFlags: [
      'Nereálně nízká cena (návnada)',
      'E-shop nemá IČO, provozovatele ani český kontakt',
      'Jediná možná platba je kartou vopřed',
    ],
  },
];

interface ScamQuizProps {
  fontSize: 'normal' | 'large' | 'xlarge';
  highContrast: boolean;
}

export const ScamQuiz: React.FC<ScamQuizProps> = ({ fontSize, highContrast }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const currentQ = QUIZ_QUESTIONS[currentIdx];

  const handleAnswer = (userThinksScam: boolean) => {
    setSelectedAnswer(userThinksScam);
    if (userThinksScam === currentQ.isScam) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    if (currentIdx < QUIZ_QUESTIONS.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizFinished(false);
  };

  const textClasses = {
    normal: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl',
  }[fontSize];

  return (
    <div
      className={`rounded-3xl p-6 sm:p-8 shadow-xl border my-8 transition-all ${
        highContrast
          ? 'bg-black border-yellow-400 text-white'
          : 'bg-[#121214] border-[#B8860B]/60 text-slate-100 shadowguard-bronze-border'
      }`}
    >
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b">
        <div>
          <span className="text-xs font-black px-3 py-1 bg-purple-100 text-purple-800 rounded-full uppercase tracking-wider">
            Zábavný trénink
          </span>
          <h2 className="text-2xl sm:text-3xl font-black mt-1 flex items-center gap-2">
            <HelpCircle className="w-8 h-8 text-purple-600" />
            Poznáte podvodný inzerát? Test pro otce
          </h2>
        </div>

        {!quizFinished && (
          <span className="font-mono font-bold text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border">
            Otázka {currentIdx + 1} / {QUIZ_QUESTIONS.length}
          </span>
        )}
      </div>

      {!quizFinished ? (
        <div>
          {/* Question Card */}
          <div className="p-6 rounded-2xl bg-[#1C1C1E] border border-[#B8860B]/40 mb-6">
            <h3 className="text-xl font-black mb-3 text-white">
              {currentQ.title}
            </h3>
            <p className={`text-slate-200 leading-relaxed font-medium ${textClasses}`}>
              "{currentQ.scenario}"
            </p>
          </div>

          {/* User Choice Buttons */}
          {selectedAnswer === null ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleAnswer(true)}
                className="py-4 px-6 rounded-2xl font-black text-lg sm:text-xl bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <XCircle className="w-7 h-7" />
                <span>TOHLE JE PODVOD!</span>
              </button>

              <button
                type="button"
                onClick={() => handleAnswer(false)}
                className="py-4 px-6 rounded-2xl font-black text-lg sm:text-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-7 h-7" />
                <span>TOHLE JE BEZPEČNÉ</span>
              </button>
            </div>
          ) : (
            /* Answer Feedback Box */
            <div
              className={`p-6 rounded-2xl border-2 transition-all ${
                selectedAnswer === currentQ.isScam
                  ? 'bg-emerald-950/80 border-emerald-400 text-emerald-100'
                  : 'bg-rose-950/80 border-rose-400 text-rose-100'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {selectedAnswer === currentQ.isScam ? (
                  <CheckCircle className="w-8 h-8 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600 shrink-0" />
                )}
                <h4 className="text-xl font-black">
                  {selectedAnswer === currentQ.isScam ? 'Správně! Přesný odhad.' : 'Chyba! Pozor na to.'}
                </h4>
              </div>

              <p className={`font-bold mb-3 ${textClasses}`}>{currentQ.explanation}</p>

              {currentQ.redFlags.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-300/60 text-sm">
                  <span className="font-bold block mb-1">Varovné znaky u tohoto případu:</span>
                  <ul className="list-disc list-inside space-y-1">
                    {currentQ.redFlags.map((rf, i) => (
                      <li key={i}>{rf}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 text-right">
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 rounded-xl font-black bg-slate-900 text-white hover:bg-slate-800 transition-all inline-flex items-center gap-2"
                >
                  <span>
                    {currentIdx < QUIZ_QUESTIONS.length - 1 ? 'Další otázka' : 'Zobrazit mé výsledky'}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Quiz Summary Screen */
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-12 h-12" />
          </div>

          <h3 className="text-3xl font-black mb-2">Test dokončen!</h3>
          <p className="text-xl font-bold mb-6">
            Získal jste <span className="text-purple-600 font-black">{score}</span> z{' '}
            {QUIZ_QUESTIONS.length} bodů.
          </p>

          <p className="max-w-md mx-auto text-slate-600 dark:text-slate-300 mb-8 font-medium">
            {score === QUIZ_QUESTIONS.length
              ? 'Skvělá práce! Máte perfektní odhad a podvodníci u vás nemají šanci.'
              : 'Dobrý pokus! Projděte si 5 Zlatých pravidel bezpečnosti pro ještě větší jistotu.'}
          </p>

          <button
            type="button"
            onClick={handleRestart}
            className="px-8 py-3.5 rounded-2xl font-black text-lg bg-purple-600 text-white hover:bg-purple-700 shadow-lg transition-all inline-flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Spustit test znovu</span>
          </button>
        </div>
      )}
    </div>
  );
};
