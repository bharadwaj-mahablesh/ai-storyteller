'use client'

import { useRouter } from 'next/navigation'
import { setCookie } from 'cookies-next'

interface ProfileCardProps {
  id: string
  name: string
  ageGroup: string
}

export default function ProfileCard({ id, name, ageGroup }: ProfileCardProps) {
  const router = useRouter()

  const handleSelectProfile = () => {
    setCookie('selected_profile_id', id, { maxAge: 60 * 60 * 24 * 30 }) // Store for 30 days
    router.push('/home')
  }

  return (
    <div
      className="bg-white p-6 rounded-lg shadow-md text-center cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={handleSelectProfile}
    >
      <h2 className="text-xl font-semibold mb-2">{name}</h2>
      <p className="text-gray-600">Age Group: {ageGroup}</p>
    </div>
  )
}
