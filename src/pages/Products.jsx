import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUpRight, Boxes, Search, SlidersHorizontal, Wrench, X } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { getProducts } from '../lib/data'

export default function Products() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('featured')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getProducts()
      .then((data) => { if (active) setItems(Array.isArray(data) ? data : []) })
      .catch((err) => { console.error('Unable to load catalogue:', err); if (active) setError(err?.message || 'The catalogue could not be loaded.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const categories = useMemo(() => ['All', ...new Set(items.map((item) => item.category).filter(Boolean))], [items])
  const shown = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = items.filter((product) =>
      (category === 'All' || product.category === category) &&
      `${product.name || ''} ${product.short_description || ''} ${product.description || ''} ${product.category || ''}`.toLowerCase().includes(term)
    )
    if (sort === 'price-low') filtered.sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
    if (sort === 'price-high') filtered.sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
    if (sort === 'name') filtered.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
    return filtered
  }, [items, category, search, sort])

  const featured = !search.trim() && category === 'All' && sort === 'featured' ? shown[0] : null

  return (
    <main className="max-w-7xl mx-auto px-5 py-12 md:py-16">
      <section className="relative overflow-hidden rounded-[2rem] bg-ink text-white px-7 py-10 md:px-12 md:py-14">
        <div className="absolute -right-16 -top-20 w-72 h-72 rounded-full border border-white/10" />
        <div className="absolute -right-4 -bottom-36 w-80 h-80 rounded-full border border-white/10" />
        <div className="relative max-w-3xl">
          <p className="text-safety text-[11px] font-bold uppercase tracking-[.24em]">THE HANDYMAN CATALOGUE</p>
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mt-4">Tools for the<br /><span className="text-white/45">work ahead.</span></h1>
          <p className="text-white/60 max-w-lg leading-7 mt-5">Reliable workshop essentials, selected for people who care about doing the job properly.</p>
          <div className="flex flex-wrap items-center gap-5 mt-8 text-xs text-white/65">
            <span className="inline-flex items-center gap-2"><Boxes size={15} /> {loading ? 'Loading collection' : `${items.length} products`}</span>
            <span className="inline-flex items-center gap-2"><Wrench size={15} /> Built for the workbench</span>
          </div>
        </div>
        <div className="relative mt-9 md:mt-0 md:absolute md:right-12 md:bottom-12 md:text-right"><p className="font-display text-6xl md:text-7xl font-bold text-white/10">01—</p><p className="text-[10px] uppercase tracking-[.22em] text-white/45">Find your next essential</p></div>
      </section>

      <section className="mt-10 md:mt-14">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div><p className="eyebrow">SHOP THE RANGE</p><h2 className="font-display text-3xl md:text-4xl font-bold mt-1">The collection</h2></div>
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <label className="flex items-center gap-3 bg-white border border-line rounded-full px-5 py-3 w-full sm:min-w-[280px] xl:w-[320px]">
              <Search size={17} className="text-muted shrink-0" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tools and equipment…" className="bg-transparent outline-none w-full text-sm" />
              {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search"><X size={15} className="text-muted" /></button>}
            </label>
            <label className="flex items-center gap-2 bg-white border border-line rounded-full px-4 py-3 text-sm">
              <SlidersHorizontal size={15} className="text-muted" /><span className="text-xs text-muted">Sort</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)} className="bg-transparent outline-none text-xs font-bold"><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A–Z</option></select>
            </label>
          </div>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-4 py-25 text-xs font-bold transition ${category === item ? 'bg-ink text-white' : 'bg-white border border-line text-muted hover:border-ink hover:text-ink'}`}>{item}</button>)}
        </div>

        <div className="mt-5 flex items-center justify-between border-y border-line py-3 text-xs text-muted"><span>{loading ? 'Loading catalogue…' : `${shown.length} ${shown.length === 1 ? 'product' : 'products'} shown`}</span><span className="hidden sm:inline-flex items-center gap-1">Selected for your workspace <ArrowDown size={13} /></span></div>

        {loading ? (
          <div className="py-24 text-center text-muted">Loading products…</div>
        ) : error ? (
          <div className="py-20 text-center"><p className="font-display text-2xl font-bold">Catalogue unavailable</p><p className="text-sm text-muted mt-2">{error}</p></div>
        ) : shown.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10 mt-7">
            {shown.map((product, index) => (
              <div
  key={product.id}
  className={
    index === 0 && featured
      ? 'sm:col-span-2 xl:col-span-2'
      : featured && index <= 2
        ? 'lg:pt-[28px]'
        : ''
  }
>
  {index === 0 && featured && (
    <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-safety">
      <span className="w-5 h-px bg-safety" /> Featured pick
    </div>
  )}
  <ProductCard product={product} index={index} />
</div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center"><div className="mx-auto w-14 h-14 rounded-2xl bg-white border border-line flex items-center justify-center"><Search size={22} className="text-muted" /></div><p className="font-display text-2xl font-bold mt-5">No products found</p><p className="text-sm text-muted mt-2">Try another search or choose a different category.</p><button type="button" onClick={() => { setSearch(''); setCategory('All'); setSort('featured') }} className="inline-flex items-center gap-2 mt-5 text-sm font-bold underline underline-offset-4">Clear filters <ArrowUpRight size={15} /></button></div>
        )}
      </section>
    </main>
  )
}
