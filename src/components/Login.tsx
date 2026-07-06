import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  async function sendLink(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) {
      setError(error.message)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-6 p-6">
      <header>
        <p className="text-xs tracking-widest text-muted">ACEDAY</p>
        <h1 className="text-xl font-medium">Sign in</h1>
      </header>

      {status === 'sent' ? (
        <p className="text-sm text-win-strong">
          Check your inbox — we sent a sign-in link to {email}.
        </p>
      ) : (
        <form onSubmit={sendLink} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={status === 'sending'}
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            {status === 'sending' ? 'Sending…' : 'Send magic link'}
          </button>
          {status === 'error' && <p className="text-sm text-loss-strong">{error}</p>}
        </form>
      )}
    </div>
  )
}
