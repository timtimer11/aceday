import { useSession } from './lib/useSession'
import Login from './components/Login'
import Shell from './components/Shell'

export default function App() {
  const { session, loading } = useSession()

  if (loading) return null
  if (!session) return <Login />
  return <Shell userId={session.user.id} email={session.user.email} />
}
