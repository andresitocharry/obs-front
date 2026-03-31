'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      console.log('[DEBUG AUTH] URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('[DEBUG AUTH] Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 15) + '...')
      
      // 1. Intentamos extraer el código de la URL (flujo PKCE)
      const query = new URLSearchParams(window.location.search)
      const code = query.get('code')

      if (code) {
        console.log('Exchanging code for session...')
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          console.error('Error exchanging code:', error)
          router.push('/login?error=code_exchange_failed')
          return
        }
        if (data.session) {
          await handleSession(data.session)
          return
        }
      }

      // 2. Intentamos extraer el token del fragmento # (flujo implícito)
      if (window.location.hash) {
        console.log('Detected access token in hash...')
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const access_token = hashParams.get('access_token')
        const refresh_token = hashParams.get('refresh_token')
        
        if (access_token) {
          const { data, error } = await supabase.auth.setSession({ 
            access_token, 
            refresh_token: refresh_token || '' 
          })
          if (data.session) {
            await handleSession(data.session)
            return
          }
        }
      }

      // 3. Si no hay nada en la URL, probamos con el estado actual
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await handleSession(session)
      } else {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
          if (session) {
            subscription.unsubscribe()
            await handleSession(session)
          }
        })
      }
    }

    const handleSession = async (session: any) => {
      console.log('Success! Session established:', session.user.email)
      const role = session.user.user_metadata?.role || 'foundation'
      localStorage.setItem('role', role)
      localStorage.setItem('username', session.user.email?.split('@')[0] || 'user')
      
      if (role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/upload')
      }
    }

    handleCallback()

    const timeout = setTimeout(() => {
      router.push('/login?error=timeout')
    }, 20000) // Un poco más de tiempo para el flujo manual

    return () => clearTimeout(timeout)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-800">Finalizando inicio de sesión...</h2>
        <p className="text-slate-500">Espera un momento, por favor.</p>
      </div>
    </div>
  )
}
