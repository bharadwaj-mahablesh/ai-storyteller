'use client';

import { useRouter } from 'next/navigation';
import Card from '../../components/Card';

const books = [
  {
    key: 'book1',
    title: 'Book 1: The Separation of Friends',
    description: 'The first book of Panchatantra, focusing on the loss of friendship.',
  },
  {
    key: 'book2',
    title: 'Book 2: The Gaining of Friends',
    description: 'Stories about friendship and alliances.',
  },
  {
    key: 'book3',
    title: 'Book 3: Of Crows and Owls',
    description: 'Tales of strategy and rivalry.',
  },
];

export default function PanchatantraPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-24 bg-gradient-to-br from-blue-100 to-purple-100">
      <h1 className="text-5xl font-bold mb-8 text-blue-900">Panchatantra</h1>
      <p className="text-xl mb-12 text-center text-blue-800">Select a book to explore its stories.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl">
        {books.map((book) => (
          <Card
            key={book.key}
            title={book.title}
            description={book.description}
            onClick={() => router.push(`/epics/panchatantra/${book.key}`)}
          />
        ))}
      </div>
    </main>
  );
}