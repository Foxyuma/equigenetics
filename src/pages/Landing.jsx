import React from 'react';
import { base44 } from '@/api/base44Client';

const features = [
  {
    icon: '🧬',
    title: 'Deep Breeding System',
    desc: 'Carefully select your horses, manage bloodlines, avoid genetic diseases and produce the best generations.',
  },
  {
    icon: '❤️',
    title: 'Genetics & Health',
    desc: 'Realistic genetics, coat colors, hidden genes, hereditary diseases and compatibility management.',
  },
  {
    icon: '🐣',
    title: 'Foals & Development',
    desc: 'Every foal is unique. Stats, temperament, potential — raise them with care and watch them grow.',
  },
  {
    icon: '📈',
    title: 'Training & Progression',
    desc: 'Train your horses, improve their skills and prepare them for competitions.',
  },
  {
    icon: '🏆',
    title: 'Competitions',
    desc: 'Test your horses in many disciplines and events. Prove your breeding program is the best.',
  },
  {
    icon: '🏡',
    title: 'Manage Your Stud Farm',
    desc: 'Build and customize your farm, manage your facilities and create the perfect environment for your horses.',
  },
  {
    icon: '⭐',
    title: 'Reputation System',
    desc: 'Earn reputation by breeding high-quality horses, keeping your farm healthy and competing at the highest level.',
  },
  {
    icon: '🤝',
    title: 'Market & Trading',
    desc: 'Sell, buy and trade horses. Build your reputation and develop your dream stud.',
  },
  {
    icon: '🎨',
    title: 'Realistic & Immersive',
    desc: 'Realistic graphics, attention to detail and an immersive world for true horse lovers.',
  },
  {
    icon: '🔄',
    title: 'Active Development',
    desc: 'Regular updates, new features and a community that helps shape the future of the game.',
  },
];

const patreonPerks = [
  { icon: '🎁', title: 'Exclusive Rewards', desc: 'In-game items, horses & bonuses' },
  { icon: '🚀', title: 'Early Access', desc: 'Be the first to try new features' },
  { icon: '💬', title: 'Your Voice Matters', desc: 'Vote, suggest and shape the game' },
  { icon: '💖', title: 'Support a Passion Project', desc: 'Help create the ultimate horse game' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1008] via-[#2d1f0a] to-[#1a1008] text-white font-sans">
      {/* Hero */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-4 py-28 overflow-hidden"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1600&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-[#1a1008]" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-amber-400 text-sm font-bold uppercase tracking-widest mb-4">
            ✦ Support the Future of Horse Breeding ✦
          </p>
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            <span className="italic text-amber-200">Breed. Raise. Compete.</span><br />
            <span className="text-white">Build Your Legacy.</span>
          </h1>
          <p className="text-stone-300 text-lg md:text-xl mt-4 mb-10 leading-relaxed">
            A realistic horse game focused on <span className="text-amber-400 font-semibold">breeding</span>,{' '}
            <span className="text-amber-400 font-semibold">genetics</span> &amp;{' '}
            <span className="text-amber-400 font-semibold">passion</span>.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => base44.auth.redirectToLogin('/Stable')}
              className="px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold text-lg shadow-2xl shadow-amber-900/40 hover:from-amber-500 hover:to-amber-400 transition-all duration-300 transform hover:scale-105"
            >
              🐴 Jouer Gratuitement
            </button>
            <a
              href="https://www.patreon.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-4 rounded-2xl bg-[#FF424D] text-white font-bold text-lg shadow-2xl shadow-red-900/40 hover:bg-[#e6333e] transition-all duration-300 transform hover:scale-105"
            >
              ❤️ Patreon
            </a>
          </div>
          <p className="text-stone-500 text-xs mt-6 italic">For horse lovers, by horse lovers.</p>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-center text-3xl font-bold text-amber-200 mb-12" style={{ fontFamily: 'Georgia, serif' }}>
          ✦ Ce qui vous attend ✦
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white/5 border border-amber-900/30 rounded-2xl p-5 hover:bg-white/10 hover:border-amber-600/50 transition-all duration-300 group"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-amber-200 font-bold text-sm mb-2 group-hover:text-amber-100 transition-colors">
                {f.title}
              </h3>
              <p className="text-stone-400 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Patreon banner */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div
          className="relative rounded-3xl overflow-hidden border border-amber-700/30 shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #2d1a06 0%, #3d2510 50%, #2d1a06 100%)',
          }}
        >
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1598974357801-cbca100e65d3?w=800&q=60')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="relative z-10 p-8 md:p-12 text-center">
            <div className="inline-block bg-[#FF424D] text-white font-black text-2xl px-8 py-3 rounded-xl mb-6 shadow-lg">
              ❤️ PATREON
            </div>
            <h3 className="text-2xl font-bold text-amber-100 mb-2">Help Shape the Game. Unlock Exclusive Content.</h3>
            <p className="text-stone-400 text-sm mb-8">Votre soutien aide à financer le développement et à rendre EquiGenesis possible.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {patreonPerks.map((p, i) => (
                <div key={i} className="bg-black/20 rounded-xl p-4 border border-amber-900/20">
                  <div className="text-2xl mb-2">{p.icon}</div>
                  <div className="text-amber-200 font-bold text-sm">{p.title}</div>
                  <div className="text-stone-400 text-xs mt-1">{p.desc}</div>
                </div>
              ))}
            </div>
            <a
              href="https://www.patreon.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-12 py-4 rounded-2xl bg-[#FF424D] text-white font-bold text-lg hover:bg-[#e6333e] transition-all duration-300 shadow-xl"
            >
              Soutenir sur Patreon →
            </a>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="text-center px-4 pb-24">
        <h2 className="text-3xl font-bold text-amber-200 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
          Prêt à construire votre haras ?
        </h2>
        <p className="text-stone-400 mb-8">Rejoignez la communauté EquiGenesis — gratuit, passionnant, unique.</p>
        <button
          onClick={() => base44.auth.redirectToLogin('/Stable')}
          className="px-12 py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold text-xl shadow-2xl hover:from-amber-500 hover:to-amber-400 transition-all duration-300 transform hover:scale-105"
        >
          🐴 Commencer l'aventure
        </button>
      </section>

      {/* Footer social */}
      <footer className="border-t border-amber-900/30 py-8 text-center">
        <p className="text-amber-600 font-bold text-sm mb-4 tracking-widest uppercase">✦ For Horse Lovers, By Horse Lovers ✦</p>
        <div className="flex justify-center gap-6 mb-4">
          <a href="https://discord.gg" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/30 text-[#7289da] hover:bg-[#5865F2]/30 transition-all font-medium text-sm">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
            Discord
          </a>
          <a href="https://www.patreon.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF424D]/20 border border-[#FF424D]/30 text-[#FF424D] hover:bg-[#FF424D]/30 transition-all font-medium text-sm">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M14.82 2.41c3.96 0 7.18 3.24 7.18 7.21 0 3.96-3.22 7.18-7.18 7.18-3.97 0-7.21-3.22-7.21-7.18 0-3.97 3.24-7.21 7.21-7.21M2 21.6h3.5V2.41H2V21.6z"/></svg>
            Patreon
          </a>
        </div>
        <p className="text-stone-600 text-xs">© 2025 EquiGenesis — Tous droits réservés</p>
      </footer>
    </div>
  );
}