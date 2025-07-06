'use client';

import { useRouter } from 'next/navigation';
import Card from './components/Card';

const epics = [
  {
    key: 'panchatantra',
    title: 'Panchatantra',
    description: 'Dive into the ancient Indian fables of wisdom and wit.',
  },
  {
    key: 'ramayana',
    title: 'Ramayana',
    description: 'Explore the adventures and morals from the great Indian epic Ramayana.',
  },
  {
    key: 'mahabharata',
    title: 'Mahabharata',
    description: 'Discover the legendary tales and lessons from the Mahabharata.',
  },
];

export default function Home() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-24 bg-gradient-to-br from-blue-100 to-purple-100">
      <h1 className="text-5xl font-bold mb-8 text-blue-900">Welcome to AI Storyteller</h1>
      <p className="text-xl mb-12 text-center text-blue-800">Explore the rich world of Indian Epics.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl">
        {epics.map((epic) => (
          <Card
            key={epic.key}
            title={epic.title}
            description={epic.description}
            onClick={() => router.push(`/epics/${epic.key}`)}
          />
        ))}
      </div>
    </main>
  );
}