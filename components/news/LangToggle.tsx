'use client';

interface Props {
  lang: 'ja' | 'en';
  onChange: (lang: 'ja' | 'en') => void;
}

export default function LangToggle({ lang, onChange }: Props) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-gray-700/50 text-xs font-bold">
      <button
        onClick={() => onChange('ja')}
        className={`px-3 py-1.5 transition-colors ${
          lang === 'ja' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'
        }`}
      >
        🇯🇵 日本語
      </button>
      <button
        onClick={() => onChange('en')}
        className={`px-3 py-1.5 transition-colors ${
          lang === 'en' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'
        }`}
      >
        🇺🇸 English
      </button>
    </div>
  );
}
