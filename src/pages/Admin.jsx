import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { getProducts, saveProduct, removeProduct, getAllOrders } from '../lib/data'
import { uploadImages } from '../lib/upload'
import { useAuth } from '../context/AuthContext'
import { toast } from '../lib/toast'
import { ImagePlus, Trash2, Pencil, X, UploadCloud, PackagePlus } from 'lucide-react'

const fileKey = file => `${file.name}:${file.size}:${file.lastModified}:${file.type}`
const uniqueFiles = files => {
  const seen = new Set()
  return files.filter(file => {
    const key = fileKey(file)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
const uniqueUrls = urls => [...new Set(urls.filter(Boolean))]

export default function Admin() {
  const { isAdmin } = useAuth()
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [tab, setTab] = useState('products')
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [files, setFiles] = useState([])
  const [existing, setExisting] = useState([])
  const [form, setForm] = useState({ name: '', category: 'Hand tools', price: '', available_quantity: '', minimum_order_quantity: '1', short_description: '', description: '' })

  const refresh = async () => {
    const [productList, orderList] = await Promise.all([getProducts(), getAllOrders()])
    setProducts(productList)
    setOrders(orderList)
  }

  useEffect(() => { refresh().catch(error => toast(error.message)) }, [])

  if (!isAdmin) return <div className="max-w-3xl mx-auto px-5 py-24 text-center"><h1 className="font-display text-3xl font-bold">Admin access required</h1><p className="text-muted mt-3">Your account does not have the admin role.</p><Link to="/account" className="text-safety font-bold inline-block mt-5">Back to account</Link></div>

  const reset = () => {
    setEditing(null)
    setFiles([])
    setExisting([])
    setForm({ name: '', category: 'Hand tools', price: '', available_quantity: '', minimum_order_quantity: '1', short_description: '', description: '' })
  }

  const edit = product => {
    setEditing(product.id)
    setExisting(uniqueUrls(product.images || [product.image].filter(Boolean)))
    setFiles([])
    setForm({
      name: product.name || '',
      category: product.category || 'Hand tools',
      price: product.price || '',
      available_quantity: product.available_quantity ?? product.stock ?? '',
      minimum_order_quantity: product.minimum_order_quantity || 1,
      short_description: product.short_description || '',
      description: product.description || '',
    })
    setTab('products')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const addFiles = event => {
    const incoming = Array.from(event.target.files || [])
    setFiles(current => uniqueFiles([...current, ...incoming]))
    event.target.value = ''
  }

  const submit = async event => {
    event.preventDefault()
    setBusy(true)
    try {
      const uploaded = await uploadImages(files, setProgress)
      const images = uniqueUrls([...existing, ...uploaded])
      if (!images.length) throw new Error('Choose at least one product image.')
      await saveProduct({
        ...form,
        price: Number(form.price),
        available_quantity: Number(form.available_quantity),
        minimum_order_quantity: Number(form.minimum_order_quantity),
        images,
        image: images[0],
      }, editing)
      toast(editing ? 'Product updated' : 'Product created')
      reset()
      await refresh()
    } catch (error) {
      toast(error.message)
    } finally {
      setBusy(false)
      setProgress(0)
    }
  }

  const del = async id => {
    if (!confirm('Delete this product?')) return
    try {
      await removeProduct(id)
      await refresh()
      toast('Product deleted')
    } catch (error) { toast(error.message) }
  }

  const setStatus = async (order, status) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), { status })
      await refresh()
      toast('Order updated')
    } catch (error) { toast(error.message) }
  }

  const update = (key, value) => setForm(current => ({ ...current, [key]: value }))

  return <div className="max-w-7xl mx-auto px-5 py-12">
    <p className="eyebrow">CONTROL ROOM</p>
    <h1 className="font-display text-5xl font-bold mt-2">Store admin.</h1>
    <p className="text-muted mt-3">Manage your catalogue and keep orders moving.</p>

    <div className="flex gap-2 mt-9 border-b border-line">
      {[['products', 'Products'], ['orders', 'Orders']].map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={`px-5 py-3 text-sm font-bold border-b-2 ${tab === key ? 'border-safety text-ink' : 'border-transparent text-muted'}`}>{label}</button>)}
    </div>

    {tab === 'products' ? <div className="grid lg:grid-cols-[.85fr_1.15fr] gap-8 mt-8">
      <form onSubmit={submit} className="bg-white border border-line rounded-2xl p-6 h-fit">
        <div className="flex justify-between items-center">
          <h2 className="font-display text-xl font-bold">{editing ? 'Edit product' : 'Add a product'}</h2>
          {editing && <button type="button" onClick={reset} aria-label="Cancel editing"><X size={18} /></button>}
        </div>
        <div className="grid gap-3 mt-5">
          <input required value={form.name} onChange={event => update('name', event.target.value)} placeholder="Product name" className="field" />
          <div className="grid grid-cols-2 gap-3">
            <input required type="number" min="0" value={form.price} onChange={event => update('price', event.target.value)} placeholder="Price (৳)" className="field" />
            <input required type="number" min="0" value={form.available_quantity} onChange={event => update('available_quantity', event.target.value)} placeholder="Stock quantity" className="field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.category} onChange={event => update('category', event.target.value)} className="field"><option>Hand tools</option><option>Power tools</option><option>Tool sets</option><option>Safety equipment</option><option>Accessories</option></select>
            <input type="number" min="1" value={form.minimum_order_quantity} onChange={event => update('minimum_order_quantity', event.target.value)} placeholder="Minimum order" className="field" />
          </div>
          <input value={form.short_description} onChange={event => update('short_description', event.target.value)} placeholder="Short description" className="field" />
          <textarea value={form.description} onChange={event => update('description', event.target.value)} placeholder="Full description" className="field min-h-24" />
        </div>

        <div className="mt-5">
          <p className="text-sm font-bold mb-2">Product gallery · multiple images</p>
          <label className="border-2 border-dashed border-line rounded-xl p-5 flex flex-col items-center text-center cursor-pointer hover:border-safety">
            <ImagePlus className="text-safety" />
            <span className="text-sm font-bold mt-2">Add images</span>
            <span className="text-xs text-muted mt-1">Select more than once; previous selections stay · max 8 MB each</span>
            <input type="file" accept="image/*" multiple onChange={addFiles} className="hidden" />
          </label>
          {(existing.length > 0 || files.length > 0) && <div className="grid grid-cols-4 gap-2 mt-3">
            {existing.map((src, index) => <div key={src} className="relative aspect-square rounded-lg overflow-hidden">
              <img src={src} alt={`Existing product image ${index + 1}`} className="w-full h-full object-cover" />
              <button type="button" aria-label="Remove image" onClick={() => setExisting(current => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute top-1 right-1 bg-ink text-white rounded-full p-1"><X size={12} /></button>
            </div>)}
            {files.map((file, index) => <div key={fileKey(file)} className="relative aspect-square rounded-lg overflow-hidden bg-paper">
              <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
              <button type="button" aria-label="Remove selected image" onClick={() => setFiles(current => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute top-1 right-1 bg-ink text-white rounded-full p-1"><X size={12} /></button>
            </div>)}
          </div>}
          <p className="text-xs text-muted mt-2">{existing.length + files.length} image(s) selected · duplicates are ignored</p>
        </div>

        {busy && <div className="h-1.5 bg-line rounded-full mt-4 overflow-hidden"><div className="h-full bg-safety transition-all" style={{ width: `${progress}%` }} /></div>}
        <button disabled={busy} className="mt-5 w-full rounded-full bg-ink text-white py-4 font-bold text-sm flex items-center justify-center gap-2">
          <UploadCloud size={17} />{busy ? `Uploading ${progress}%` : editing ? 'Save changes' : 'Publish product'}
        </button>
      </form>

      <div>
        <h2 className="font-display text-xl font-bold mb-4">Catalogue <span className="text-muted text-sm font-sans">({products.length})</span></h2>
        <div className="grid gap-3">{products.map(product => <article key={product.id} className="bg-white border border-line rounded-xl p-3 flex items-center gap-4">
          <img src={product.images?.[0] || product.image} alt={product.name} className="h-16 w-16 rounded-lg object-cover bg-paper" />
          <div className="min-w-0 flex-1"><p className="font-bold truncate">{product.name}</p><p className="text-xs text-muted mt-1">৳{Number(product.price).toLocaleString()} · Stock {product.available_quantity ?? product.stock ?? 0} · {product.images?.length || 1} image(s)</p></div>
          <button onClick={() => edit(product)} aria-label="Edit product" className="p-2 hover:text-safety"><Pencil size={17} /></button>
          <button onClick={() => del(product.id)} aria-label="Delete product" className="p-2 hover:text-red-500"><Trash2 size={17} /></button>
        </article>)}</div>
      </div>
    </div> : <div className="mt-8 grid gap-3">{orders.map(order => <article key={order.id} className="bg-white border border-line rounded-xl p-5 flex flex-wrap gap-4 items-center">
      <div className="flex-1 min-w-[220px]"><p className="font-bold">{order.productName}</p><p className="text-xs text-muted mt-1">{order.email} · Qty {order.quantity} · ৳{Number(order.total).toLocaleString()}</p></div>
      <span className="text-xs font-bold uppercase text-safety">{order.paymentStatus || 'unpaid'}</span>
      <select value={order.status} onChange={event => setStatus(order, event.target.value)} className="field !w-auto"><option value="pending">Pending</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
    </article>)}</div>}
  </div>
}
