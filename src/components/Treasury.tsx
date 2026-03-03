import { ArrowLeft, Star, Heart, Award, Sparkles, Gift, LockKeyholeOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { useWebHaptics } from 'web-haptics/react';

interface TreasuryProps {
  playerName: string;
  unlockedWorlds: string[];
  onBack: () => void;
  onReset: () => void;
}

export const Treasury: React.FC<TreasuryProps> = ({ playerName, unlockedWorlds, onBack, onReset }) => {
  const { trigger } = useWebHaptics();

  const stickers = [
    { title: "Verkenner", icon: <Star size={40} className="text-yellow-500 fill-current" />, req: 'world-1' },
    { title: "Rekenwonder", icon: <Award size={40} className="text-purple-500 fill-current" />, req: 'world-2' },
    { title: "Tafel Topper", icon: <Heart size={40} className="text-red-500 fill-current" />, req: 'world-3' },
    { title: "Meester", icon: <Sparkles size={40} className="text-blue-500 fill-current" />, req: 'world-4' }
  ];

  const earned = stickers.filter(s => unlockedWorlds.includes(s.req));

  return (
    <div className="w-full h-full flex flex-col p-8 bg-amber-100 overflow-y-auto">
      <div className="flex items-center mb-8 gap-4">
        <button
          onClick={() => {
            trigger('nudge');
            onBack();
          }}
          className="p-3 bg-white rounded-full shadow-md text-amber-600 hover:bg-amber-50"
        >
          <ArrowLeft size={32} />
        </button>
        <h1 className="text-4xl font-bold text-amber-900 flex items-center gap-3">
          <Gift size={40} /> Mijn Schatkist
        </h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stickers.map((s, i) => {
          const isUnlocked = unlockedWorlds.includes(s.req);
          return (
            <motion.div
              key={i}
              whileHover={{ scale: isUnlocked ? 1.05 : 1 }}
              className={`p-6 rounded-[2rem] shadow-xl border-4 flex flex-col items-center gap-4 text-center ${
                isUnlocked ? 'bg-white border-yellow-400' : 'bg-gray-200 border-gray-300 opacity-60'
              }`}
            >
              <div className="bg-amber-100 p-6 rounded-full shadow-inner">
                {isUnlocked ? s.icon : <Star size={40} className="text-gray-400" />}
              </div>
              <h3 className={`text-xl font-bold ${isUnlocked ? 'text-amber-800' : 'text-gray-500'}`}>
                {isUnlocked ? s.title : 'Verborgen'}
              </h3>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-lg border-4 border-amber-300 max-w-2xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
            <LockKeyholeOpen /> Speciale Ouders Sectie
          </h2>
          <button
            onClick={() => {
              const pwd = window.prompt(`Voer het ouder wachtwoord in om de voortgang van ${playerName} te resetten:`);
              if (pwd === 'panda') {
                onReset();
              } else if (pwd !== null) {
                alert('Verkeerd wachtwoord!');
              }
            }}
            className="text-sm bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors"
          >
            Reset Voortgang
          </button>
        </div>
        <p className="text-lg text-amber-800 mb-4">
          Heeft de Panda weer een nieuwe wereld behaald? Dan mag daar natuurlijk een *echte* beloning tegenover staan!
        </p>
        <ul className="list-disc pl-6 space-y-2 text-amber-900 text-lg font-medium">
          <li>1 wereld uitgespeeld = 15 minuten extra digitale speeltijd</li>
          <li>2 werelden uitgespeeld = Samen een spelletje kiezen</li>
          <li>3 werelden uitgespeeld = Pannenkoeken eten!</li>
          <li>4 werelden uitgespeeld = Een extra verhaaltje voor het slapengaan</li>
        </ul>
      </div>
    </div>
  );
};
