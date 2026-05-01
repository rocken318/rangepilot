import AmazonCard from '../../components/ads/AmazonCard';

const BOOKS = [
  {
    asin: 'B01MQXK4QT',
    title: 'The Mathematics of Poker',
    author: 'Bill Chen, Jerrod Ankenman',
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/P/B01MQXK4QT.jpg',
    price: '¥2,800',
    tag: 'GTO理論の数学的基礎',
  },
  {
    asin: '4774188344',
    title: 'ポーカーで生計を立てる',
    author: 'Dusty Schmidt',
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/P/4774188344.jpg',
    price: '¥1,980',
    tag: '日本語書籍',
  },
  {
    asin: 'B00BKJJZPK',
    title: "Applications of No-Limit Hold'em",
    author: 'Matthew Janda',
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/P/B00BKJJZPK.jpg',
    price: '¥3,200',
    tag: '6max NLH 上級者向け',
  },
  {
    asin: 'B07C4N4FSG',
    title: "Poker's 1%: The One Big Secret That Keeps Elite Players on Top",
    author: 'Ed Miller',
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/P/B07C4N4FSG.jpg',
    price: '¥1,500',
    tag: '思考パターン改善',
  },
];

export default function BooksView() {
  return (
    <div
      className="w-full min-h-screen px-4 py-6"
      style={{ background: 'linear-gradient(160deg, #0d1620 0%, #0f1923 60%, #0a1018 100%)' }}
    >
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-black text-white mb-1">📚 参考書籍</h2>
        <p className="text-xs text-gray-400 mb-6">GTO学習におすすめの書籍</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BOOKS.map((book) => (
            <div key={book.asin}>
              <p className="text-[10px] text-yellow-500/70 font-semibold mb-1 uppercase tracking-wider">
                {book.tag}
              </p>
              <AmazonCard {...book} />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-600 text-center mt-6">
          本サイトはAmazon.co.jpアソシエイトプログラムに参加しています。
        </p>
      </div>
    </div>
  );
}
