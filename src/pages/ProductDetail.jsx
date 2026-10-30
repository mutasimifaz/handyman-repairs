import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Minus, Plus, ShoppingBag, Star, ShieldCheck } from 'lucide-react'
import { getProduct, getReviews, addReview } from '../lib/data'
import { useAuth } from '../context/AuthContext'
import { toast } from '../lib/toast'

const PAYMENT_WORKER_URL = import.meta.env.VITE_PAYMENT_WORKER_URL?.replace(/\/+$/, '')

export default function ProductDetail() {
  const { id } = useParams(), navigate = useNavigate(), { user } = useAuth()
  const [p, setP] = useState(null), [reviews, setReviews] = useState([]), [image, setImage] = useState(0)
  const [qty, setQty] = useState(1), [review, setReview] = useState(''), [rating, setRating] = useState(5), [busy, setBusy] = useState(false)
  useEffect(() => { setP(null); getProduct(id).then(setP).catch(e => toast(e.message)); getReviews(id).then(setReviews).catch(() => {}) }, [id])
  if (!p) return <div className="max-w-7xl mx-auto px-5 py-24 text-center text-muted">Loading product…</div>
  const imgs = p.images?.length ? p.images : [p.image].filter(Boolean)
  const stock = Number(p.available_quantity ?? p.stock ?? 0)
  const buy = async () => {
    if (!user) return navigate('/signin')
    if (!PAYMENT_WORKER_URL) return toast('Payment service URL is missing. Add VITE_PAYMENT_WORKER_URL to .env.')
    if (stock < qty) return toast('Not enough stock available.')
    setBusy(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch(`${PAYMENT_WORKER_URL}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: id, quantity: qty })
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Could not start checkout.')
      if (!result.url) throw new Error('Payment service did not return a checkout URL.')
      window.location.assign(result.url)
    } catch (error) { toast(error.message || 'Unable to start checkout.'); setBusy(false) }
  }
  const submitReview = async e => {
    e.preventDefault()
    if (!user) return navigate('/signin')
    if (!review.trim()) return
    try {
      await addReview({ uid: user.uid, email: user.email, name: user.displayName || 'Customer', productId: id, rating, comment: review.trim() })
      setReview(''); setReviews(await getReviews(id)); toast('Review submitted')
    } catch (error) { toast(error.message) }
  }
  return <div className="max-w-7xl mx-auto px-5 py-8 md:py-12">
    <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted mb-7 hover:text-ink"><ArrowLeft size={16}/> Back to catalogue</Link>
    <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-8 lg:gap-16">
      <div><div className="rounded-[24px] md:rounded-[30px] overflow-hidden bg-[#e9e8e0] aspect-[5/4]"><img src={imgs[image] || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=900'} alt={p.name} className="w-full h-full object-cover"/></div>
        {imgs.length > 1 && <div className="grid grid-cols-5 gap-2 sm:gap-3 mt-3">{imgs.map((src, i) => <button key={`${src}-${i}`} onClick={() => setImage(i)} aria-label={`View image ${i + 1}`} className={`aspect-square overflow-hidden rounded-xl border-2 ${image === i ? 'border-safety' : 'border-transparent'}`}><img src={src} alt="" className="w-full h-full object-cover"/></button>)}</div>}
      </div>
      <div className="lg:sticky lg:top-28 h-fit"><p className="eyebrow">{p.category || 'WORKSHOP ESSENTIAL'}</p><h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mt-3">{p.name}</h1><p className="font-display text-3xl font-bold mt-5">৳{Number(p.price || 0).toLocaleString()}</p><p className="text-muted leading-7 mt-5">{p.short_description || p.description || 'A dependable addition to your workshop.'}</p>
        <div className="flex items-center gap-2 text-xs mt-5"><span className={`h-2 w-2 rounded-full ${stock > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}/>{stock > 0 ? `${stock} available` : 'Currently unavailable'}</div>
        {p.specifications && <div className="mt-7 border-y border-line py-5"><h3 className="font-display font-bold mb-3">Specifications</h3>{Object.entries(p.specifications).map(([k, v]) => <div key={k} className="flex justify-between gap-5 py-2 text-sm border-b border-line/70 last:border-0"><span className="text-muted capitalize">{k}</span><span className="font-semibold text-right">{v}</span></div>)}</div>}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-7"><div className="flex w-fit items-center border border-line rounded-full"><button aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty - 1))} className="p-3"><Minus size={15}/></button><span className="w-8 text-center text-sm font-bold">{qty}</span><button aria-label="Increase quantity" onClick={() => setQty(Math.min(10, Math.max(stock, 1), qty + 1))} className="p-3"><Plus size={15}/></button></div>
          <button disabled={busy || stock < 1} onClick={buy} className="flex-1 bg-safety text-white rounded-full px-5 py-4 font-bold text-sm flex justify-center items-center gap-2 disabled:opacity-50"><ShoppingBag size={17}/>{busy ? 'Connecting to checkout…' : 'Continue to secure checkout'}</button></div>
        <p className="text-[11px] text-muted mt-3 flex items-center gap-2"><ShieldCheck size={14}/> Payment confirmation is verified by the payment server.</p>
      </div>
    </div>
    <section className="mt-20 md:mt-24 max-w-3xl"><p className="eyebrow">CUSTOMER NOTES</p><h2 className="font-display text-3xl font-bold mt-2">Reviews <span className="text-muted font-sans text-base">({reviews.length})</span></h2>
      <form onSubmit={submitReview} className="bg-white border border-line rounded-2xl p-4 sm:p-5 mt-6"><p className="font-semibold text-sm mb-3">Share your experience</p><div className="flex gap-1 mb-3">{[1,2,3,4,5].map(n => <button type="button" key={n} onClick={() => setRating(n)} aria-label={`Rate ${n} stars`}><Star size={19} className={n <= rating ? 'fill-safety text-safety' : 'text-line'}/></button>)}</div><textarea value={review} onChange={e => setReview(e.target.value)} placeholder="What should other makers know?" className="w-full min-h-24 bg-paper rounded-xl p-4 text-sm outline-none"/><button className="mt-3 rounded-full bg-ink text-white px-5 py-3 text-sm font-bold">Submit review</button></form>
      <div className="mt-6 grid gap-4">{reviews.map(r => <article key={r.id} className="border-b border-line pb-4"><div className="flex justify-between gap-3"><b className="text-sm">{r.name}</b><span className="text-xs text-safety whitespace-nowrap">★ {r.rating}/5</span></div><p className="text-sm text-muted mt-2 leading-6">{r.comment}</p></article>)}</div>
    </section>
  </div>
}
