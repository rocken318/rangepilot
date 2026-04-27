import { useState } from 'react';
import { POSTFLOP_SECTIONS } from '../data/postflopGuide';
import type { PostflopSection } from '../data/postflopGuide';

export default function PostflopGuideView() {
  const [selectedSection, setSelectedSection] = useState<string>(POSTFLOP_SECTIONS[0].id);

  const currentSection: PostflopSection =
    POSTFLOP_SECTIONS.find((s) => s.id === selectedSection) ?? POSTFLOP_SECTIONS[0];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-white">ポストフロップ基礎ガイド</h2>
        <p className="text-sm text-gray-400 mt-1">
          プリフロップの次に重要なポストフロップの基本を学びましょう
        </p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {POSTFLOP_SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => setSelectedSection(section.id)}
            className={`min-h-[40px] px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedSection === section.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {section.title}
          </button>
        ))}
      </div>

      {/* Section description header */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-5 py-3">
        <p className="text-sm text-gray-300 leading-relaxed">{currentSection.description}</p>
      </div>

      {/* Subsections */}
      {currentSection.subsections.map((sub, idx) => (
        <div
          key={idx}
          className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 space-y-3"
        >
          {/* Subsection title */}
          <h3 className="text-lg font-bold text-white">{sub.title}</h3>

          {/* Content */}
          <p className="text-base text-gray-300 leading-relaxed">{sub.content}</p>

          {/* Flow steps */}
          {sub.flowSteps && sub.flowSteps.length > 0 && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              {sub.flowSteps.map((step, stepIdx) => (
                <div key={stepIdx}>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-200">{step}</span>
                  </div>
                  {stepIdx < sub.flowSteps!.length - 1 && (
                    <div className="w-0.5 h-4 bg-blue-500/30 ml-[5px]" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tips */}
          {sub.tips && sub.tips.length > 0 && (
            <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-4 space-y-2">
              {sub.tips.map((tip, tipIdx) => (
                <div key={tipIdx} className="flex gap-2">
                  <span className="flex-shrink-0">💡</span>
                  <span className="text-sm text-gray-300">{tip}</span>
                </div>
              ))}
            </div>
          )}

          {/* Examples */}
          {sub.examples && sub.examples.length > 0 && (
            <div className="space-y-3">
              {sub.examples.map((example, exIdx) => (
                <div
                  key={exIdx}
                  className="bg-gray-900/50 border border-gray-600/30 rounded-lg p-4"
                >
                  <div className="text-lg font-mono font-bold text-white mb-2">
                    {example.board}
                  </div>
                  <p className="text-sm text-gray-300">{example.analysis}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
