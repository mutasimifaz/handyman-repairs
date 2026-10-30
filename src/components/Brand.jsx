import { Link } from 'react-router-dom'
export default function Brand({ light = false }) {
  return <Link to="/" className={`inline-flex items-center gap-3 font-display text-xl font-bold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>
    <img src="/brand-mark.svg" className="h-10 w-10" alt="" />
    <span>handy<span className="text-safety">man</span><small className={`ml-2 text-[9px] font-sans font-semibold uppercase tracking-[.22em] ${light ? 'text-white/50' : 'text-muted'}`}>TOOLS</small></span>
  </Link>
}