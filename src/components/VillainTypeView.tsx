import { VILLAIN_ADJUSTMENTS, ANTE_ADJUSTMENTS } from '../data/ranges';

export default function VillainTypeView() {
  const types = Object.entries(VILLAIN_ADJUSTMENTS);

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold text-white">相手タイプ別 レンジ調整ガイド</h2>
      <p className="text-sm text-gray-400">
        相手のプレイスタイルに応じて、基本レンジからどのように調整するかのガイドラインです。
      </p>

      {types.map(([key, data]) => (
        <div key={key} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-3">{data.title}</h3>
          <ul className="space-y-2">
            {data.tips.map((tip, i) => (
              <li key={i} className="text-sm text-gray-300 flex gap-2">
                <span className="text-emerald-400 mt-0.5 shrink-0">▸</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="bg-gray-800/50 rounded-lg p-4 border border-amber-700/50">
        <h3 className="text-lg font-bold text-amber-300 mb-3">📋 {ANTE_ADJUSTMENTS.description}</h3>
        <ul className="space-y-2">
          {ANTE_ADJUSTMENTS.tips.map((tip, i) => (
            <li key={i} className="text-sm text-gray-300 flex gap-2">
              <span className="text-amber-400 mt-0.5 shrink-0">▸</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
