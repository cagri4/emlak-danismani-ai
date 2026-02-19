import { Link } from 'react-router-dom'
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'
import { useProperties } from '@/hooks/useProperties'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PropertyGrid from '@/components/property/PropertyGrid'
import { Building2, CheckCircle2, XCircle, Home, ArrowRight } from 'lucide-react'

export default function Dashboard() {
  const metrics = useDashboardMetrics()
  const { properties, loading } = useProperties({
    limit: 6,
    orderBy: 'createdAt',
    orderDirection: 'desc',
  })

  const statCards = [
    {
      title: 'Toplam Mülk',
      value: metrics.total,
      icon: Building2,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Aktif',
      value: metrics.aktif,
      icon: CheckCircle2,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Satıldı',
      value: metrics.satildi,
      icon: XCircle,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Kiralık',
      value: metrics.kiralik,
      icon: Home,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Portföyünüze genel bakış</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {metrics.loading ? (
                      <div className="h-9 w-16 bg-gray-200 animate-pulse rounded" />
                    ) : (
                      stat.value
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Recent Properties */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Son Eklenen Mülkler
            </h2>
            <Link to="/properties">
              <Button variant="ghost" className="gap-2">
                Tümünü Gör
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <PropertyGrid properties={properties} />
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
