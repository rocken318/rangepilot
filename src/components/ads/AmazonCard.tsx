interface Props {
  asin: string;
  title: string;
  author: string;
  imageUrl: string;
  price?: string;
}

export default function AmazonCard({ asin, title, author, imageUrl, price }: Props) {
  const tag = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG ?? '';
  const url = `https://www.amazon.co.jp/dp/${asin}?tag=${tag}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="flex gap-3 p-3 rounded-lg border border-gray-700/50 hover:border-yellow-500/40 transition-colors bg-gray-900/40"
    >
      <img
        src={imageUrl}
        alt={title}
        className="w-12 h-16 object-cover rounded flex-shrink-0"
      />
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-xs font-semibold text-white line-clamp-2 leading-snug">{title}</p>
        <p className="text-[10px] text-gray-400">{author}</p>
        {price && (
          <p className="text-xs text-yellow-400 font-bold mt-auto">{price}</p>
        )}
        <span className="text-[9px] text-gray-500 mt-auto">Amazon.co.jp</span>
      </div>
    </a>
  );
}
