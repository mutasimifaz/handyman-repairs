import { Link } from 'react-router-dom'
import { ArrowUpRight, PackageCheck } from 'lucide-react'

export default function ProductCard({ product }) {
  const image = product.images?.[0] || product.image || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=900'
  const stock = Number(product.available_quantity ?? product.stock ?? 0)
  return <Link to={`/products/${product.id}`} className="group flex h-full min-w-0 flex-col">
    <div className="relative overflow-hidden rounded-2xl bg-white aspect-[4/3] flex items-center justify-center">
      <img src={image} alt={product.name || 'Product'} loading="lazy" className="w-full h-full object-contain p-5 sm:p-7 transition-transform duration-500 group-hover:scale-[1.035]" />
      <span className="absolute left-4 top-4 bg-white/90 text-ink rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest">{product.category || 'Workshop'}</span>
      <span className="absolute right-4 bottom-4 bg-safety text-white rounded-full p-3 translate-y-16 group-hover:translate-y-0 transition"><ArrowUpRight size={18}/></span>
    </div>
    <div className="flex flex-1 items-start justify-between gap-3 pt-4">
      <div className="min-w-0"><h3 className="font-display font-semibold text-lg leading-snug break-words group-hover:text-safety transition">{product.name}</h3><p className="text-xs text-muted mt-1 flex items-center gap-1"><PackageCheck size={13}/> {stock > 0 ? `${stock} in stock` : 'Currently unavailable'}</p></div>
      <p className="shrink-0 font-display font-bold text-lg whitespace-nowrap">৳{Number(product.price || 0).toLocaleString()}</p>
    </div>
  </Link>
}
