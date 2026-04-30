import { useState } from 'react';
import { toPng } from 'html-to-image';
import type { HandEntry, Action } from '../types';
import { getHandName } from '../types';

interface Props {
  range: Record<string, HandEntry>;
  scenarioLabel: string;
}

const ACTION_TEXT: Record<Action, string> = {
  raise: 'Raise',
  '3betValue': '3Bet-Value',
  '3betBluff': '3Bet-Bluff',
  '3bet': '3Bet',
  call: 'Call',
  mixed: 'Mixed',
  fold: 'Fold',
  '4betValue': '4Bet-Value',
  '4betBluff': '4Bet-Bluff',
  bet: 'Bet',
  check: 'Check',
};

export default function ExportControls({ range, scenarioLabel }: Props) {
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 1800);
  };

  const handlePng = async () => {
    const matrixEl = document.getElementById('hand-matrix');
    if (!matrixEl) return;

    // Build an off-screen wrapper for a polished export
    const wrapper = document.createElement('div');
    wrapper.style.cssText = [
      'position:fixed',
      'top:-9999px',
      'left:-9999px',
      'width:640px',
      'background:#111827',
      'padding:24px',
      'border-radius:16px',
      'font-family:ui-sans-serif,system-ui,sans-serif',
      'display:flex',
      'flex-direction:column',
      'gap:14px',
    ].join(';');

    // Title section
    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = 'display:flex;align-items:center;gap:8px;';
    const titleText = document.createElement('div');
    titleText.style.cssText = 'color:#f9fafb;font-size:15px;font-weight:700;line-height:1.3;';
    titleText.textContent = scenarioLabel;
    titleDiv.appendChild(titleText);

    // Matrix clone
    const matrixClone = matrixEl.cloneNode(true) as HTMLElement;
    matrixClone.style.cssText = 'width:100%;overflow:visible;';

    // Footer row: watermark
    const footerDiv = document.createElement('div');
    footerDiv.style.cssText = 'display:flex;justify-content:flex-end;align-items:center;';
    const watermark = document.createElement('span');
    watermark.style.cssText = 'color:#4b5563;font-size:11px;font-weight:600;letter-spacing:0.05em;';
    watermark.textContent = 'RangePilot';
    footerDiv.appendChild(watermark);

    wrapper.appendChild(titleDiv);
    wrapper.appendChild(matrixClone);
    wrapper.appendChild(footerDiv);
    document.body.appendChild(wrapper);

    try {
      const dataUrl = await toPng(wrapper, {
        backgroundColor: '#111827',
        pixelRatio: 3,
        style: { borderRadius: '16px' },
      });
      const link = document.createElement('a');
      link.download = `${scenarioLabel.replace(/[\s/]+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
      showFeedback('保存しました');
    } catch (e) {
      console.error('PNG export failed:', e);
      showFeedback('エラー');
    } finally {
      document.body.removeChild(wrapper);
    }
  };

  const handleJsonCopy = () => {
    const data = Object.values(range).filter(e => e.action !== 'fold');
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    showFeedback('コピーしました');
  };

  const handleTextCopy = () => {
    const groups: Record<string, string[]> = {};
    for (let i = 0; i < 13; i++) {
      for (let j = 0; j < 13; j++) {
        const h = getHandName(i, j);
        const entry = range[h];
        if (entry && entry.action !== 'fold') {
          const label = ACTION_TEXT[entry.action];
          if (!groups[label]) groups[label] = [];
          groups[label].push(h);
        }
      }
    }
    const lines = [`${scenarioLabel}:`];
    for (const [action, hands] of Object.entries(groups)) {
      lines.push(`${action}: ${hands.join(', ')}`);
    }
    lines.push('Fold: others');
    navigator.clipboard.writeText(lines.join('\n'));
    showFeedback('コピーしました');
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handlePng}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-xs font-medium transition-colors shadow-sm"
        >
          📷 PNG保存
        </button>
        <button
          onClick={handleJsonCopy}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-xs font-medium transition-colors shadow-sm"
        >
          📋 JSONコピー
        </button>
        <button
          onClick={handleTextCopy}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-xs font-medium transition-colors shadow-sm"
        >
          📝 テキストコピー
        </button>
      </div>
      {feedback && (
        <p className="text-xs text-green-400 transition-opacity">{feedback}</p>
      )}
    </div>
  );
}
