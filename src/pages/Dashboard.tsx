import { useAuth } from '@/contexts/AuthContext'
import { useAuthActions } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user, userProfile } = useAuth()
  const { signOut } = useAuthActions()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <Button variant="outline" onClick={handleSignOut}>
            Çıkış Yap
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Hoş Geldiniz!</h2>
          <div className="space-y-2">
            <p>
              <strong>Ad Soyad:</strong> {userProfile?.name || user?.displayName || 'N/A'}
            </p>
            <p>
              <strong>E-posta:</strong> {user?.email}
            </p>
            <p>
              <strong>Telefon:</strong> {userProfile?.phone || 'Belirtilmemiş'}
            </p>
            <p>
              <strong>Şirket:</strong> {userProfile?.company || 'Belirtilmemiş'}
            </p>
            <p>
              <strong>E-posta Doğrulandı:</strong>{' '}
              {user?.emailVerified ? 'Evet ✅' : 'Hayır ❌'}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
