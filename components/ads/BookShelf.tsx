import AmazonCard from './AmazonCard';

const BOOKS = [
  {
    asin: 'B01MQXK4QT',
    title: 'The Mathematics of Poker',
    author: 'Bill Chen, Jerrod Ankenman',
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/P/B01MQXK4QT.jpg',
    price: '¥2,800',
  },
  {
    asin: '4774188344',
    title: 'ポーカーで生計を立てる',
    author: 'Dusty Schmidt',
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/P/4774188344.jpg',
    price: '¥1,980',
  },
  {
    asin: 'B00BKJJZPK',
    title: 'Applications of No-Limit Hold\'em',
    author: 'Matthew Janda',
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/P/B00BKJJZPK.jpg',
    price: '¥3,200',
  },
];

export default function BookShelf() {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-500/80">
        📚 おすすめ書籍
      </h3>
      {BOOKS.map((book) => (
        <AmazonCard key={book.asin} {...book} />
      ))}
      <p className="text-[9px] text-gray-600 text-center pt-1">
        Amazonアソシエイトプログラム参加中
      </p>
    </div>
  );
}
