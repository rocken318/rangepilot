'use client';

const CATEGORIES = [
  { value: 'all', label: 'すべて' },
  { value: 'tournament', label: 'トーナメント' },
  { value: 'general', label: 'ニュース' },
] as const;

type Category = (typeof CATEGORIES)[number]['value'];

interface Props {
  active: Category;
  onChange: (c: Category) => void;
}

export default function CategoryFilter({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            active === cat.value
              ? 'bg-yellow-500 text-gray-900'
              : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700/50'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
