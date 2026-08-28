import { PredefinedScenario } from '../types';

export const SAMPLE_SCENARIOS: PredefinedScenario[] = [
  {
    id: 'bazos-kuryr-podvod',
    title: 'Falešný kurýr DPD na Bazoši',
    subtitle: 'Kupující chce poslat kurýra a vyžaduje zadání karty',
    url: 'https://bazos-platba-doprava-cz.online/doprava/order-8912',
    textSnippet: 'Dobrý den, mám zájem o vaše zboží. Pošlu k vám kurýra DPD, ten vám předá peníze. Stačí potvrdit přjetí platby a zadat údaje z Vaší bankovní karty na odkazu výše.',
    badge: 'PODVOD',
    category: 'Inzertní portály (Bazoš/Sbazar)',
  },
  {
    id: 'legit-bazos-stul',
    title: 'Poctivý inzerát - Dřevěný stůl (Bazoš.cz)',
    subtitle: 'Běžný inzerát s osobním předáním v Písku',
    url: 'https://www.bazos.cz/inzerat/1892831/masivni-jidelni-stul.php',
    textSnippet: 'Prodám použitý masivní jídelní stůl z dubu. Rozměry 160x90 cm. Zachovalý stav. Cena 2 500 Kč. Pouze osobní odběr v Písku s možností prohlídky.',
    badge: 'DUVERYHODNE',
    category: 'Důvěryhodné inzeráty',
  },
  {
    id: 'iphone-pod-cenou',
    title: 'Nové auto/mobil za pětinu tržní ceny',
    subtitle: 'Prodejce požaduje zálohu předem na anonymní účet',
    url: 'https://www.sbazar.cz/inzerat/882103-iphone-15-pro-novy-nerozbaleny',
    textSnippet: 'Prodám nový nerozbalený iPhone 15 Pro 256GB. Nevhodný dar. Cena 3 900 Kč. Mám hodně zájemců, rezervuji pouze tomu, kdo pošle zálohu 1 000 Kč předem na účet.',
    badge: 'OPATRNOSTI',
    category: 'Rizikové nabídky pod cenou',
  },
];
