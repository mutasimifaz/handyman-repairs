import { Link } from 'react-router-dom'
import { ArrowUpRight, PackageCheck } from 'lucide-react'
export default function ProductCard({ product, index = 0 }) {
  const image = product.images?.[0] || product.image || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=900'
  return <Link to={`/products/${product.id}`} className="group block">
    <div className="relative overflow-hidden rounded-2xl bg-[#e9e8e0] aspect-[4/3]">
      <img src={image} alt={product.name} loading="lazy" className="w-full h-full object-cover transition duration-700 group-hover:scale-[1.06]"/>
      <span className="absolute left-4 top-4 bg-paper/90 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest">{product.category || 'Workshop'}</span>
      <span className="absolute right-4 bottom-4 bg-safety text-white rounded-full p-3 translate-y-16 group-hover:translate-y-0 transition"><ArrowUpRight size={18}/></span>
    </div>
    <div className="pt-4 flex justify-between gap-3">
      <div><h3 className="font-display font-semibold text-lg group-hover:text-safety transition">{product.name}</h3><p className="text-xs text-muted mt-1 flex items-center gap-1"><PackageCheck size={13}/> {Number(product.available_quantity ?? product.stock ?? 0) > 0 ? 'In stock' : 'Check availability'}</p></div>
      <p className="font-display font-bold text-lg whitespace-nowrap">৳{Number(product.price || 0).toLocaleString()}</p>
    </div>
  </Link>
}