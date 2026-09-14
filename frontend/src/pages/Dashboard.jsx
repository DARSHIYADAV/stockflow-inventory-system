import { useQuery } from '@tanstack/react-query'
import Layout from '../components/Layout'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import { getDashboardSummary } from '../api/dashboard'
import { useAuth } from '../context/AuthContext'

function StatCard({ label, value, labelColor, valueColor }) {
  return (
    <div className="stat-card">
      <p className={`text-sm font-semibold ${labelColor}`}>{label}</p>
      <p className={`mt-2 text-3xl font-bold tabular-nums ${valueColor || 'text-ink-primary'}`}>
        {value}
      </p>
    </div>
  )
}

function describeActivity(item) {
  if (item.type === 'stock_transaction') {
    const sign = item.change_quantity > 0 ? '+' : ''
    const detail = item.supplier_name ? `from ${item.supplier_name}` : 'no supplier given'
    return `Stock ${sign}${item.change_quantity} on product ${item.product_id.slice(0, 8)}… — ${detail}`
  }
  return `Asset ${item.asset_id.slice(0, 8)}… ${item.action} — ${item.note || 'no note'}`
}

export default function Dashboard() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
  })

  return (
    <Layout>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-accent">Home</h1>

      {isLoading && <Spinner label="Loading dashboard..." />}
      {isError && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          Failed to load dashboard summary.
        </p>
      )}

      {data && (
        <>
          <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-4' : ''}`}>
            {isAdmin && (
              <>
                <StatCard
                  label="Total Products"
                  value={data.total_products}
                  labelColor="text-sky-600 dark:text-sky-400"
                />
                <StatCard
                  label="Low Stock"
                  value={data.low_stock_count}
                  labelColor="text-red-600 dark:text-red-400"
                  valueColor={
                    data.low_stock_count > 0 ? 'text-red-600 dark:text-red-400' : 'text-ink-primary'
                  }
                />
              </>
            )}
            <StatCard
              label="Total Assets"
              value={data.total_assets}
              labelColor="text-violet-600 dark:text-violet-400"
            />
            <StatCard
              label="Assigned Assets"
              value={data.assigned_assets_count}
              labelColor="text-amber-600 dark:text-amber-400"
            />
          </div>

          {isAdmin && (
            <div className="mt-8 card">
              <div className="border-b border-border px-5 py-3.5">
                <h2 className="font-semibold text-accent">Recent Activity</h2>
              </div>
              {data.recent_activity.length === 0 ? (
                <EmptyState icon="◷" message="No activity yet." />
              ) : (
                <ul className="divide-y divide-border">
                  {data.recent_activity.map((item) => (
                    <li
                      key={item.id}
                      className="row-hover flex items-center justify-between px-5 py-3.5"
                    >
                      <span className="text-sm text-ink-secondary">{describeActivity(item)}</span>
                      <span className="whitespace-nowrap text-xs text-ink-muted">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
