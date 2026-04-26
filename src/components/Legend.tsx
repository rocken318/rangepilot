import type { Mode } from '../types';

interface Props {
  mode: Mode;
}

interface LegendItem {
  color: string;
  label: string;
}

const LEGENDS: Record<string, LegendItem[]> = {
  open: [
    { color: 'bg-red-600', label: 'レイズ (R)' },
    { color: 'bg-yellow-500', label: '相手次第 / 混合 (M)' },
    { color: 'bg-gray-700', label: 'フォールド (F)' },
  ],
  vsOpen: [
    { color: 'bg-red-600', label: '3ベット バリュー (3B-V)' },
    { color: 'bg-rose-500', label: '3ベット ブラフ (3B-B)' },
    { color: 'bg-blue-600', label: 'コール (C)' },
    { color: 'bg-yellow-500', label: '相手次第 / 混合 (M)' },
    { color: 'bg-gray-700', label: 'フォールド (F)' },
  ],
  vs3Bet: [
    { color: 'bg-purple-700', label: '4ベット バリュー (4B-V)' },
    { color: 'bg-purple-500', label: '4ベット ブラフ (4B-B)' },
    { color: 'bg-blue-600', label: 'コール (C)' },
    { color: 'bg-yellow-500', label: '相手次第 / 混合 (M)' },
    { color: 'bg-gray-700', label: 'フォールド (F)' },
  ],
  bbDefense: [
    { color: 'bg-red-600', label: '3ベット (3B)' },
    { color: 'bg-blue-600', label: 'コール (C)' },
    { color: 'bg-yellow-500', label: '相手次第 (M)' },
    { color: 'bg-gray-700', label: 'フォールド (F)' },
  ],
  sbVsBb: [
    { color: 'bg-red-600', label: 'レイズ / 3ベット (R/3B)' },
    { color: 'bg-blue-600', label: 'コール (C)' },
    { color: 'bg-yellow-500', label: '相手次第 / 混合 (M)' },
    { color: 'bg-gray-700', label: 'フォールド (F)' },
  ],
};

export default function Legend({ mode }: Props) {
  const items = LEGENDS[mode] || LEGENDS.open;

  return (
    <div className="flex flex-wrap justify-center gap-4 bg-gray-800/30 rounded-xl px-4 py-3">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-md ${item.color}`} />
          <span className="text-sm text-gray-300">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
