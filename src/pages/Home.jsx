import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ShieldCheck, Truck, Wrench } from 'lucide-react'
import { motion } from 'framer-motion'
import ProductCard from '../components/ProductCard'
import { getProducts } from '../lib/data'
const fallback = [
 {id:'sample-1',name:'Precision Ratchet Set',price:2450,category:'Hand tools',available_quantity:18,images:['https://images.unsplash.com/photo-1581147036324-c1c9d8a6d2a5?w=900']},
 {id:'sample-2',name:'Workshop Power Drill',price:6800,category:'Power tools',available_quantity:9,images:['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=900']},
 {id:'sample-3',name:'Heavy Duty Tool Kit',price:4200,category:'Tool sets',available_quantity:12,images:['https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=900']}
]
export default function Home() {
 const [products,setProducts]=useState([])
 useEffect(()=>{getProducts().then(setProducts).catch(()=>setProducts([]))},[])
 const items=products.length?products.slice(0,3):fallback
 return <div>
  <section className="max-w-7xl mx-auto px-5 pt-10 md:pt-16">
   <div className="relative overflow-hidden rounded-[28px] bg-ink min-h-[560px] md:min-h-[600px] grid lg:grid-cols-[1fr_.9fr]">
    <div className="relative z-10 p-8 md:p-16 flex flex-col justify-center">
     <p className="text-safety text-xs font-bold tracking-[.24em] uppercase mb-7">Equipment for the everyday expert</p>
     <h1 className="font-display text-paper text-5xl md:text-7xl font-bold leading-[.98] tracking-[-.055em] max-w-xl">Make good work.<br/><span className="text-safety">With better tools.</span></h1>
     <p className="text-white/60 max-w-md mt-7 leading-7">Thoughtfully selected tools and workshop essentials built to show up, work hard and last.</p>
     <div className="flex flex-wrap gap-3 mt-9"><Link to="/products" className="bg-safety text-white rounded-full px-7 py-4 font-bold text-sm inline-flex items-center gap-3">Explore products <ArrowUpRight size={17}/></Link><Link to="/about" className="border border-white/25 text-white rounded-full px-7 py-4 font-bold text-sm">Why HandyMan</Link></div>
     <div className="mt-14 flex gap-8 text-white/55 text-xs"><span>01 / QUALITY FIRST</span><span>02 / BUILT TO LAST</span></div>
    </div>
    <div className="relative min-h-[280px] lg:min-h-full"><img src="https://images.unsplash.com/photo-1581147036324-c1c9d8a6d2a5?w=1400" alt="Professional tools arranged in a workshop" className="absolute inset-0 w-full h-full object-cover opacity-90"/><div className="absolute inset-0 bg-gradient-to-r from-ink via-transparent to-transparent"/></div>
    <div className="absolute right-7 top-7 hidden md:block border border-white/20 rounded-full w-24 h-24 text-white text-[9px] tracking-widest uppercase flex items-center justify-center text-center rotate-12">Tools<br/>that work<br/>as hard as you</div>
   </div>
  </section>
  <section className="max-w-7xl mx-auto px-5 py-20 md:py-28">
   <div className="flex flex-wrap justify-between items-end gap-5 mb-10"><div><p className="eyebrow">THE SHORTLIST</p><h2 className="section-title">Tools worth<br className="sm:hidden"/> making room for.</h2></div><Link to="/products" className="text-sm font-bold border-b border-ink pb-2">View all products ↗</Link></div>
   <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">{items.map((p,i)=><ProductCard key={p.id} product={p} index={i}/>)}</div>
   {!products.length && <p className="text-xs text-muted mt-5">Showing preview products until your Firebase catalogue is populated.</p>}
  </section>
  <section className="bg-[#e9e8e0] py-16"><div className="max-w-7xl mx-auto px-5 grid md:grid-cols-3 gap-8">{[[ShieldCheck,'Quality you can trust','Practical equipment selected for dependable performance.'],[Truck,'Order with confidence','Clear order tracking and straightforward support.'],[Wrench,'Made for real work','From daily repairs to demanding workshop jobs.']].map(([Icon,title,desc])=><div key={title} className="flex gap-4"><div className="bg-paper rounded-2xl p-4 h-fit"><Icon className="text-safety"/></div><div><h3 className="font-display font-bold text-lg">{title}</h3><p className="text-sm text-muted mt-2 leading-6">{desc}</p></div></div>)}</div></section>
 </div>
}