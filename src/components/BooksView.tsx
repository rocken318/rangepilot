export default function BooksView() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl bg-gray-800/60 border border-gray-700 px-5 py-3">
        <h2 className="text-lg font-bold text-white">参考書籍</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          ポーカー学習に役立つ書籍を紹介します
        </p>
      </div>

      {/* Coming Soon */}
      <div className="rounded-xl bg-gray-800/60 border border-gray-700 px-5 py-6 text-center">
        <p className="text-gray-400">準備中です</p>
      </div>
    </div>
  );
}
