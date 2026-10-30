import { useEffect, useMemo, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { getProducts } from '../lib/data'
export default function Products(){
 const [items,setItems]=useState([]),[search,setSearch]=useState(''),[category,setCategory]=useState('All'),[loading,setLoading]=useState(true)
 useEffect(()=>{getProducts().then(setItems).catch(console.error).finally(()=>setLoading(false))},[])
 const categories=['All',...new Set(items.map(x=>x.category).filter(Boolean))]
 const shown=useMemo(()=>items.filter(p=>(category==='All'||p.category===category)&&`${p.name} ${p.short_description||''} ${p.category||''}`.toLowerCase().includes(search.toLowerCase())),[items,category,search])
 return <div className="max-w-7xl mx-auto px-5 py-14">
  <p className="eyebrow">THE CATALOGUE</p><div className="flex flex-wrap items-end justify-between gap-6"><h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight">Find your next<br/>workhorse.</h1><p className="text-muted max-w-sm leading-7">Purposeful tools for people who take pride in getting the job done right.</p></div>
  <div className="mt-12 flex flex-col md:flex-row gap-4 justify-between"><label className="flex items-center gap-3 bg-white border border-line rounded-full px-5 py-3 w-full md:max-w-md"><Search size={18} className="text-muted"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tools, categories..." className="bg-transparent outline-none w-full text-sm"/></label><div className="flex gap-2 flex-wrap">{categories.map(c=><button key={c} onClick={()=>setCategory(c)} className={`rounded-full px-4 py-2 text-xs font-bold ${category===c?'bg-ink text-white':'bg-white border border-line text-muted'}`}>{c}</button>)}</div></div>
  <div className="mt-9 flex justify-between text-xs text-muted"><span>{loading?'Loading catalogue…':`${shown.length} products`}</span><span>Curated for the workshop</span></div>
  {loading?<div className="py-24 text-center text-muted">Loading products…</div>:shown.length?<div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10 mt-5">{shown.map((p,i)=><ProductCard key={p.id} product={p} index={i}/>)}</div>:<div className="py-24 text-center"><p className="font-display text-2xl font-bold">No products found</p><p className="text-sm text-muted mt-2">Try another search or category.</p></div>}
 </div>
}