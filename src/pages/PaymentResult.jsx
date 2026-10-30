import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, BadgeCheck, Clock3 } from 'lucide-react'

export default function PaymentResult() {
  const location = useLocation()
  const [params] = useSearchParams()
  const success = location.pathname === '/payment/success'
  const orderId = params.get('order_id')
  return <section className="max-w-3xl mx-auto px-5 py-20 md:py-28"><div className="payment-result-card">
    <div className={`payment-result-icon ${success ? 'payment-result-success' : 'payment-result-cancel'}`}>{success ? <BadgeCheck size={31}/> : <Clock3 size={29}/>}</div>
    <p className="eyebrow">{success ? 'CHECKOUT RETURNED' : 'CHECKOUT CANCELLED'}</p>
    <h1 className="font-display text-4xl sm:text-5xl font-bold mt-3">{success ? 'Thanks for your order.' : 'No payment was completed.'}</h1>
    <p className="text-muted leading-7 mt-5 max-w-xl mx-auto">{success ? 'Your checkout has returned successfully. The payment server is verifying the result. Your order will be marked confirmed only after Stripe sends its verified confirmation.' : 'You left checkout before completing payment. Your order has not been confirmed. You can return to the catalogue whenever you are ready.'}</p>
    {orderId && <p className="text-xs text-muted mt-5 break-all">Order reference: {orderId}</p>}
    <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8"><Link to="/account" className="hero-primary justify-center">View my account <ArrowUpRight size={17}/></Link><Link to="/products" className="hero-secondary justify-center"><ArrowLeft size={16}/> Back to shop</Link></div>
  </div></section>
}
