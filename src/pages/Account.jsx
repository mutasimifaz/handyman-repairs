import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Box, CircleAlert, Clock3, PackageCheck, RefreshCw, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getUserOrders } from '../lib/data'

function formatDate(value) {
  if (!value) return 'Date unavailable'
  const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function statusLabel(value) {
  return String(value || 'pending').replaceAll('_', ' ')
}

export default function Account() {
  const { user, profile } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    if (!user?.uid) {
      setOrders([])
      setLoading(false)
      return () => { active = false }
    }

    setLoading(true)
    setError('')
    getUserOrders(user.uid)
      .then((result) => { if (active) setOrders(result) })
      .catch((err) => {
        console.error('Unable to load customer orders:', err)
        if (active) setError(err?.message || 'Your order history could not be loaded. Please try again.')
      })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [user?.uid])

  const paidCount = orders.filter((order) => order.paymentStatus === 'paid').length
  const pendingCount = orders.filter((order) => order.paymentStatus !== 'paid' && !['failed', 'cancelled'].includes(order.paymentStatus)).length

  async function reloadOrders() {
    if (!user?.uid) return
    setLoading(true)
    setError('')
    try { setOrders(await getUserOrders(user.uid)) }
    catch (err) { console.error(err); setError(err?.message || 'Your order history could not be loaded.') }
    finally { setLoading(false) }
  }

  return (
    <main className="max-w-7xl mx-auto px-5 py-12 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1 className="font-display text-4xl md:text-6xl font-bold mt-2 tracking-tight">Hello, {profile?.name || user?.displayName || 'maker'}.</h1>
          <p className="text-muted mt-3">A clear view of your purchases and order progress.</p>
        </div>
        <Link to="/products" className="inline-flex items-center gap-2 rounded-full bg-ink text-white px-5 py-3 text-sm font-bold hover:bg-safety transition">
          Explore catalogue <ArrowUpRight size={16} />
        </Link>
      </div>

      <div className="mt-10 grid lg:grid-cols-[300px_1fr] gap-6 lg:gap-8">
        <aside className="rounded-3xl bg-ink text-white p-7 h-fit">
          <div className="flex items-center justify-between">
            <span className="text-white/50 text-[11px] uppercase tracking-[.2em]">Account</span>
            <ShieldCheck size={19} className="text-safety" />
          </div>
          <p className="font-display text-2xl font-bold mt-5">{profile?.name || user?.displayName || 'Customer'}</p>
          <p className="text-white/55 text-sm mt-2 break-all">{user?.email}</p>
          <div className="border-t border-white/10 mt-7 pt-5 grid grid-cols-2 gap-4">
            <div><p className="text-white/45 text-xs">Paid orders</p><p className="font-display text-3xl font-bold mt-1">{paidCount}</p></div>
            <div><p className="text-white/45 text-xs">In progress</p><p className="font-display text-3xl font-bold mt-1">{pendingCount}</p></div>
          </div>
          {profile?.role === 'admin' && (
            <Link to="/admin" className="flex items-center justify-between gap-3 mt-7 rounded-xl bg-white/10 hover:bg-white/15 px-4 py-3 text-sm font-bold text-safety transition">
              Open admin dashboard <ArrowUpRight size={16} />
            </Link>
          )}
        </aside>

        <section className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="eyebrow">PURCHASES</p><h2 className="font-display text-3xl md:text-4xl font-bold mt-1">Order history</h2></div>
            <button type="button" onClick={reloadOrders} disabled={loading} className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-xs font-bold hover:border-ink disabled:opacity-50">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-line bg-white p-10 text-center text-muted">Loading your orders…</div>
          ) : error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 md:p-8">
              <div className="flex items-start gap-3"><CircleAlert size={20} className="text-red-600 mt-0.5 shrink-0" /><div><h3 className="font-bold text-red-900">We couldn't load your orders</h3><p className="text-sm text-red-800 mt-2 break-words">{error}</p><button type="button" onClick={reloadOrders} className="mt-4 rounded-full bg-ink text-white px-5 py-2.5 text-xs font-bold">Try again</button></div></div>
            </div>
          ) : orders.length ? (
            <div className="mt-6 grid gap-3">
              {orders.map((order) => {
                const isPaid = order.paymentStatus === 'paid'
                return (
                  <article key={order.id} className="rounded-2xl border border-line bg-white p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-paper flex items-center justify-center shrink-0"><Box size={21} className="text-ink" /></div>
                      <div className="min-w-0"><h3 className="font-display text-lg font-bold truncate">{order.productName || 'Workshop product'}</h3><p className="text-xs text-muted mt-1">Qty {order.quantity || 1} <span className="mx-1.5">·</span> Order #{order.id.slice(0, 8)}</p><p className="text-xs text-muted mt-1">{formatDate(order.paidAt || order.createdAt)}</p></div>
                    </div>
                    <div className="sm:text-right sm:shrink-0">
                      <p className="font-display text-xl font-bold">৳{Number(order.total || 0).toLocaleString()}</p>
                      <div className="flex sm:justify-end flex-wrap gap-2 mt-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
                          {isPaid ? <PackageCheck size={12} /> : <Clock3 size={12} />}{statusLabel(order.paymentStatus)}
                        </span>
                        <span className="rounded-full bg-paper px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">{statusLabel(order.status)}</span>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-line bg-white p-10 md:p-14 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-paper flex items-center justify-center"><PackageCheck size={25} className="text-ink" /></div>
              <h3 className="font-display text-2xl font-bold mt-5">No orders yet</h3>
              <p className="text-sm text-muted mt-2 max-w-sm mx-auto">Your purchases will appear here as soon as an order is created.</p>
              <Link to="/products" className="inline-flex items-center gap-2 mt-6 bg-ink text-white rounded-full px-6 py-3 text-sm font-bold hover:bg-safety transition">Browse products <ArrowUpRight size={16} /></Link>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
