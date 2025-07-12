'use client'

import { createClient } from '@/app/utils/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ProfileMenu() {
  const [user, setUser] = useState<User | null>(null)
  const [accountName, setAccountName] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchUserAndAccount = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: account, error } = await supabase
          .from('accounts')
          .select('full_name')
          .eq('id', user.id)
          .single()

        if (account && !error) {
          setAccountName(account.full_name)
        }
      }
    }

    fetchUserAndAccount()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        // Re-fetch account name if user changes (e.g., after sign-in)
        supabase
          .from('accounts')
          .select('full_name')
          .eq('id', session.user.id)
          .single()
          .then(({ data: account, error }) => {
            if (account && !error) {
              setAccountName(account.full_name)
            }
          })
      } else {
        setAccountName(null)
      }
    })

    return () => {
      authListener.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    setIsOpen(false)
  }

  if (!user) {
    return null // Don't render anything if not logged in
  }

  const displayName = accountName || user.email?.charAt(0).toUpperCase() || 'U'

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        onClick={() => setIsOpen(!isOpen)}
      >
        {displayName.charAt(0)}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
            Signed in as <span className="font-semibold">{accountName || user.email}</span>
          </div>
          <Link href="/select-profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Select Profile
          </Link>
          <button
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
