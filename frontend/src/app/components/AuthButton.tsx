'use client'

import { useFormStatus } from 'react-dom'

export default function AuthButton({ text }: { text: string }) {
  const { pending } = useFormStatus()

  return (
    <button className="bg-green-700 rounded-md px-4 py-2 text-foreground mb-2">
      {pending ? 'Submitting...' : text}
    </button>
  )
}
