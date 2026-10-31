import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, BadgeCheck, Clock3, LoaderCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const WORKER_URL = (import.meta.env.VITE_PAYMENT_WORKER_URL || '').replace(/\/+$/, '')

export default function PaymentResult() {
  const location = useLocation()
  const [params] = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const success = location.pathname === '/payment/success'
  const orderId = params.get('order_id') || ''
  const sessionId = params.get('session_id') || ''
  const [state, setState] = useState(success ? 'checking' : 'cancelled')
  const [message, setMessage] = useState('Checking your payment directly with Stripe…')

  useEffect(() => {
    if (!success) {
      setState('cancelled')
      return
    }
    if (authLoading) return
    if (!user) {
      setState('error')
      setMessage('Please sign in with the account used for this purchase, then open your order from your account.')
      return
    }
    if (!sessionId || !orderId || !WORKER_URL) {
      setState('error')
      setMessage('We could not verify this checkout. Please contact support with your order reference.')
      return
    }

    let active = true
    ;(async () => {
      try {
        const token = await user.getIdToken()
        const response = await fetch(`${WORKER_URL}/confirm-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ sessionId, orderId })
        })
        const result = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(result.error || 'Payment verification failed.')
        if (!active) return
        if (result.confirmed) {
          setState(result.status === 'stock_conflict' ? 'stock_conflict' : 'confirmed')
          setMessage(result.status === 'stock_conflict'
            ? 'Your payment was received, but stock needs a manual check. Please contact support.'
            : 'Your payment is verified and your order is confirmed. Stock has been updated.')
        } else {
          setState('pending')
          setMessage(result.message || 'Stripe has not confirmed the payment yet. Please refresh this page in a moment.')
        }
      } catch (error) {
        if (!active) return
        setState('error')
        setMessage(error.message || 'We could not verify your payment.')
      }
    })()
    return () => { active = false }
  }, [success, authLoading, user, sessionId, orderId])

  const confirmed = state === 'confirmed'
  const cancelled = state === 'cancelled'
  const checking = state === 'checking'
  return <section className="max-w-3xl mx-auto px-5 py-20 md:py-28"><div className="payment-result-card">
    <div className={`payment-result-icon ${confirmed ? 'payment-result-success' : 'payment-result-cancel'}`}>
      {checking ? <LoaderCircle size={30} className="animate-spin"/> : confirmed ? <BadgeCheck size={31}/> : <Clock3 size={29}/>}
    </div>
    <p className="eyebrow">{confirmed ? 'PAYMENT VERIFIED' : cancelled ? 'CHECKOUT CANCELLED' : checking ? 'VERIFYING PAYMENT' : 'PAYMENT STATUS'}</p>
    <h1 className="font-display text-4xl sm:text-5xl font-bold mt-3">
      {confirmed ? 'Thanks for your order.' : cancelled ? 'No payment was completed.' : checking ? 'Checking your payment…' : state === 'stock_conflict' ? 'Payment received.' : 'Your order needs a check.'}
    </h1>
    <p className="text-muted leading-7 mt-5 max-w-xl mx-auto">{message}</p>
    {orderId && <p className="text-xs text-muted mt-5 break-all">Order reference: {orderId}</p>}
    <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8"><Link to="/account" className="hero-primary justify-center">View my account <ArrowUpRight size={17}/></Link><Link to="/products" className="hero-secondary justify-center"><ArrowLeft size={16}/> Back to shop</Link></div>
  </div></section>
}
