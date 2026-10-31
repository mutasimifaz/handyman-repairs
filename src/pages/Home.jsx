import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, BadgeCheck, Boxes, ShieldCheck, Truck, Wrench } from 'lucide-react'
import { motion } from 'framer-motion'
import ProductCard from '../components/ProductCard'
import { getProducts } from '../lib/data'

const fallback = [
]
const benefits = [
  [ShieldCheck, 'Quality-minded selection', 'Practical equipment chosen for dependable everyday performance.'],
  [Truck, 'A smoother order experience', 'Straightforward ordering and a place to keep track of your purchases.'],
  [Wrench, 'Ready for real work', 'Useful essentials for repairs, projects and busy workshops.']
]

export default function Home() {
  const [products, setProducts] = useState([])
  useEffect(() => { getProducts().then(setProducts).catch(() => setProducts([])) }, [])
  const items = products.length ? products.slice(0, 6) : fallback
  return <div className="home-page">
    <section className="hero-wrap"><div className="hero-grid">
      <div className="hero-copy">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }} className="hero-kicker"><span className="hero-kicker-dot"/> EQUIPMENT FOR PEOPLE WHO GET IT DONE</motion.div>
        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .08 }}>Make every<span> job count.</span></motion.h1>
        <motion.p className="hero-description" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .16 }}>The tools you reach for. The quality you can rely on. Workshop essentials selected for people who take pride in the work.</motion.p>
        <motion.div className="hero-actions" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .24 }}>
          <Link to="/products" className="hero-primary">Explore the collection <ArrowUpRight size={18}/></Link>
          <Link to="/products" className="hero-secondary">Browse tools <ArrowDownRight size={17}/></Link>
        </motion.div>
        <div className="hero-meta"><div><strong>01</strong><span>BUILT FOR DAILY USE</span></div><div><strong>02</strong><span>NO-NONSENSE ESSENTIALS</span></div></div>
      </div>
      <div className="hero-visual">
        <img src="https://images.unsplash.com/photo-1669582389450-67a661bccde0?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D" alt="Carefully arranged professional tools in a workshop" fetchPriority="high"/>
        <div className="hero-image-shade"/>
        <div className="hero-stamp"><span>THE RIGHT TOOL</span><strong>changes<br/>the work.</strong><span className="stamp-line"/><small>HANDYMAN TOOLS · EST. FOR MAKERS</small></div>
        <div className="hero-image-index"><span>01</span> / THE WORKSHOP EDIT</div>
        <div className="hero-floating-card"><div className="floating-icon"><BadgeCheck size={19}/></div><div><strong>Chosen with purpose</strong><span>Tools for the long run</span></div></div>
      </div>
    </div><div className="hero-bottomline"><span>GOOD WORK STARTS HERE</span><span className="hero-bottom-mark"><Boxes size={15}/> TOOLS · WORKSHOP · EVERYDAY</span></div></section>

    <section className="featured-section"><div className="section-heading-row"><div><p className="eyebrow">THE SHORTLIST</p><h2 className="section-title">Useful tools.<br className="sm:hidden"/> Serious potential.</h2><p className="section-intro">A few workshop favourites worth a closer look.</p></div><Link to="/products" className="text-link">View all products <ArrowUpRight size={16}/></Link></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7 items-stretch">{items.map((p) => <ProductCard key={p.id} product={p}/>)}</div>
      {!products.length && <p className="text-xs text-muted mt-5">Preview items are shown until your Firebase catalogue is populated.</p>}
    </section>

    <section className="benefits-section"><div className="benefits-heading"><p className="eyebrow">THE HANDYMAN STANDARD</p><h2>Less fuss.<br/>More getting it done.</h2></div><div className="benefits-grid">
      {benefits.map(([Icon, title, desc], i) => <article className="benefit-card" key={title}><span className="benefit-number">0{i + 1}</span><div className="benefit-icon"><Icon size={21}/></div><h3>{title}</h3><p>{desc}</p></article>)}
    </div></section>

    <section className="closing-cta"><div><p className="eyebrow">YOUR NEXT PROJECT STARTS HERE</p><h2>Find the tool.<br/><span>Get to work.</span></h2></div><Link to="/products" className="closing-cta-link">Shop the collection <ArrowUpRight size={18}/></Link></section>
  </div>
}
