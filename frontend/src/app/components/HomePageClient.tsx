'use client';

import { useRouter } from 'next/navigation';
import Card from './Card';

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

export default function HomePageClient() {
  const router = useRouter();

  return (
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
  );
}