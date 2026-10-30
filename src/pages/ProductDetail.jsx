import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Minus, Plus, ShoppingBag, Star } from 'lucide-react'
import { getProduct, getReviews, addReview, createOrder } from '../lib/data'
import { useAuth } from '../context/AuthContext'
import { toast } from '../lib/toast'
export default function ProductDetail(){
 const {id}=useParams(),navigate=useNavigate(),{user}=useAuth()
 const [p,setP]=useState(null),[reviews,setReviews]=useState([]),[image,setImage]=useState(0),[qty,setQty]=useState(1),[review,setReview]=useState(''),[rating,setRating]=useState(5),[busy,setBusy]=useState(false)
 useEffect(()=>{getProduct(id).then(setP).catch(e=>toast(e.message));getReviews(id).then(setReviews).catch(()=>{})},[id])
 if(!p)return <div className="max-w-7xl mx-auto px-5 py-24 text-center text-muted">Loading product…</div>
 const imgs=p.images?.length?p.images:[p.image].filter(Boolean)
 const stock=Number(p.available_quantity??p.stock??0)
 const buy=async()=>{if(!user)return navigate('/signin');if(stock<qty)return toast('Not enough stock available');setBusy(true);try{await createOrder({uid:user.uid,email:user.email,customerName:user.displayName||'',productId:id,productName:p.name,image:imgs[0]||'',quantity:qty,unitPrice:Number(p.price),total:Number(p.price)*qty});toast('Order placed. You can track it in your account.');navigate('/account')}catch(e){toast(e.message)}finally{setBusy(false)}}
 const submitReview=async e=>{e.preventDefault();if(!user)return navigate('/signin');if(!review.trim())return;try{await addReview({uid:user.uid,email:user.email,name:user.displayName||'Customer',productId:id,rating,comment:review.trim()});setReview('');setReviews(await getReviews(id));toast('Review submitted')}catch(e){toast(e.message)}}
 return <div className="max-w-7xl mx-auto px-5 py-10">
  <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted mb-8"><ArrowLeft size={16}/> Back to catalogue</Link>
  <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-10 lg:gap-16">
   <div><div className="rounded-[26px] overflow-hidden bg-[#e9e8e0] aspect-[5/4]"><img src={imgs[image]||'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=900'} alt={p.name} className="w-full h-full object-cover"/></div>
    {imgs.length>1&&<div className="grid grid-cols-5 gap-3 mt-3">{imgs.map((src,i)=><button key={src+i} onClick={()=>setImage(i)} className={`aspect-square overflow-hidden rounded-xl border-2 ${image===i?'border-safety':'border-transparent'}`}><img src={src} alt={`${p.name} view ${i+1}`} className="w-full h-full object-cover"/></button>)}</div>}
   </div>
   <div className="lg:sticky lg:top-28 h-fit"><p className="eyebrow">{p.category||'WORKSHOP ESSENTIAL'}</p><h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mt-3">{p.name}</h1><p className="font-display text-3xl font-bold mt-6">৳{Number(p.price||0).toLocaleString()}</p><p className="text-muted leading-7 mt-6">{p.short_description||p.description||'A dependable addition to your workshop.'}</p>
    <div className="flex items-center gap-2 text-xs mt-6"><span className={`h-2 w-2 rounded-full ${stock>0?'bg-emerald-500':'bg-red-500'}`}/>{stock>0?`${stock} available`:'Currently unavailable'}</div>
    {p.specifications&&<div className="mt-8 border-y border-line py-5"><h3 className="font-display font-bold mb-3">Specifications</h3>{Object.entries(p.specifications).map(([k,v])=><div key={k} className="flex justify-between gap-5 py-2 text-sm border-b border-line/70 last:border-0"><span className="text-muted capitalize">{k}</span><span className="font-semibold text-right">{v}</span></div>)}</div>}
    <div className="flex items-center gap-4 mt-8"><div className="flex items-center border border-line rounded-full"><button onClick={()=>setQty(Math.max(1,qty-1))} className="p-3"><Minus size={15}/></button><span className="w-8 text-center text-sm font-bold">{qty}</span><button onClick={()=>setQty(Math.min(Math.max(stock,1),qty+1))} className="p-3"><Plus size={15}/></button></div><button disabled={busy||stock<1} onClick={buy} className="flex-1 bg-safety text-white rounded-full py-4 font-bold text-sm flex justify-center items-center gap-2 disabled:opacity-50"><ShoppingBag size={17}/>{busy?'Placing order…':'Place order'}</button></div>
    <p className="text-[11px] text-muted mt-3">Orders are submitted as pending and confirmed by the store.</p>
   </div>
  </div>
  <section className="mt-24 max-w-3xl"><p className="eyebrow">CUSTOMER NOTES</p><h2 className="font-display text-3xl font-bold mt-2">Reviews <span className="text-muted font-sans text-base">({reviews.length})</span></h2>
   <form onSubmit={submitReview} className="bg-white border border-line rounded-2xl p-5 mt-6"><p className="font-semibold text-sm mb-3">Share your experience</p><div className="flex gap-1 mb-3">{[1,2,3,4,5].map(n=><button type="button" key={n} onClick={()=>setRating(n)}><Star size={19} className={n<=rating?'fill-safety text-safety':'text-line'}/></button>)}</div><textarea value={review} onChange={e=>setReview(e.target.value)} placeholder="What should other makers know?" className="w-full min-h-24 bg-paper rounded-xl p-4 text-sm outline-none"/><button className="mt-3 rounded-full bg-ink text-white px-5 py-3 text-sm font-bold">Submit review</button></form>
   <div className="mt-6 grid gap-4">{reviews.map(r=><article key={r.id} className="border-b border-line pb-4"><div className="flex justify-between"><b className="text-sm">{r.name}</b><span className="text-xs text-safety">★ {r.rating}/5</span></div><p className="text-sm text-muted mt-2 leading-6">{r.comment}</p></article>)}</div>
  </section>
 </div>
}