const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
})

function getAllowedOrigins(env) {
  return new Set([
    'http://localhost:5173',
    'https://handyman-repairs.pages.dev',
    ...(env.ALLOWED_ORIGIN || '').split(',').map(x => x.trim()).filter(Boolean),
    ...(env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean),
  ])
}

function cors(origin, allowedOrigins) {
  const permitted = allowedOrigins.has(origin)

  return {
    ...(permitted ? { 'access-control-allow-origin': origin } : {}),
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type, authorization',
    'access-control-max-age': '86400',
    'vary': 'Origin',
  }
}

async function verifyFirebaseUser(request, env) {
  const authorization = request.headers.get('authorization') || ''
  const idToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!idToken) throw new Error('Sign in is required.')
  if (!env.FIREBASE_WEB_API_KEY) throw new Error('Firebase Web API key is not configured.')
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(env.FIREBASE_WEB_API_KEY)}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idToken }),
  })
  const result = await response.json().catch(() => ({}))
  const account = result.users?.[0]
  if (!response.ok || !account?.localId) throw new Error('Your sign-in session is invalid. Please sign in again.')
  return { uid: account.localId, email: account.email || '' }
}

function decodeFirestoreValue(value) {
  if (!value) return null
  if ('stringValue' in value) return value.stringValue
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return Number(value.doubleValue)
  if ('booleanValue' in value) return value.booleanValue
  if ('nullValue' in value) return null
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeFirestoreValue)
  if ('mapValue' in value) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([k,v]) => [k, decodeFirestoreValue(v)]))
  return null
}

function encodeFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null }
  if (typeof value === 'string') return { stringValue: value }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (Number.isInteger(value)) return { integerValue: String(value) }
  if (typeof value === 'number') return { doubleValue: value }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeFirestoreValue) } }
  if (typeof value === 'object') return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([k,v]) => [k, encodeFirestoreValue(v)])) } }
  return { nullValue: null }
}

async function serviceAccessToken(serviceAccountJson) {
  const account = JSON.parse(serviceAccountJson)
  const enc = new TextEncoder()
  const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const pem = account.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '')
  const binary = Uint8Array.from(atob(pem), c => c.charCodeAt(0))
  const key = await crypto.subtle.importKey('pkcs8', binary, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(enc.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })))
  const payload = b64url(enc.encode(JSON.stringify({ iss: account.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3500 })))
  const unsigned = `${header}.${payload}`
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(unsigned))
  const assertion = `${unsigned}.${b64url(signature)}`
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  })
  if (!response.ok) throw new Error('Could not authorize the Firestore service account.')
  return (await response.json()).access_token
}

async function firestoreRequest(env, path, options = {}) {
  const token = await serviceAccessToken(env.FIREBASE_SERVICE_ACCOUNT_JSON)
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}`, {
    ...options, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(options.headers || {}) },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error?.message || 'Firestore request failed.')
  return body
}


async function sha1Hex(value) {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

async function uploadToImgBB(image, env) {
  if (!env.IMGBB_API_KEY) throw new Error('ImgBB key is not configured.')
  const form = new FormData()
  form.append('image', image, image.name || 'product-image')
  const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(env.IMGBB_API_KEY)}`, { method: 'POST', body: form })
  const result = await response.json().catch(() => ({}))
  if (!response.ok || !result.success || !result.data?.url) {
    throw new Error(result.error?.message || `ImgBB upload failed (HTTP ${response.status}).`)
  }
  return result.data.display_url || result.data.url
}

async function uploadToCloudinary(image, env) {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials are not fully configured.')
  }
  const timestamp = String(Math.floor(Date.now() / 1000))
  const folder = 'handyman-products'
  // Cloudinary signed uploads require SHA-1 over sorted upload parameters + API secret.
  const signature = await sha1Hex(`folder=${folder}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`)
  const form = new FormData()
  form.append('file', image, image.name || 'product-image')
  form.append('api_key', env.CLOUDINARY_API_KEY)
  form.append('timestamp', timestamp)
  form.append('folder', folder)
  form.append('signature', signature)
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(env.CLOUDINARY_CLOUD_NAME)}/image/upload`, { method: 'POST', body: form })
  const result = await response.json().catch(() => ({}))
  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message || `Cloudinary upload failed (HTTP ${response.status}).`)
  }
  return result.secure_url
}

async function uploadProductImage(request, env) {
  await requireAdmin(request, env)
  const incoming = await request.formData()
  const image = incoming.get('image')
  if (!(image instanceof File)) throw new Error('Choose an image to upload.')
  if (!image.type.startsWith('image/')) throw new Error('Only image files can be uploaded.')
  if (image.size > 8 * 1024 * 1024) throw new Error('Image exceeds the 8 MB limit.')

  let imgbbError = 'ImgBB is not configured; trying Cloudinary.'
  if (env.IMGBB_API_KEY) {
    try {
      const url = await uploadToImgBB(image, env)
      return { url, provider: 'imgbb' }
    } catch (error) {
      imgbbError = error.message || 'ImgBB upload failed.'
    }
  }

  try {
    const url = await uploadToCloudinary(image, env)
    return { url, provider: 'cloudinary', fallback: true }
  } catch (cloudinaryError) {
    throw new Error(`Image upload failed on both providers. ImgBB: ${imgbbError} Cloudinary: ${cloudinaryError.message || 'Upload failed.'}`)
  }
}

async function createCheckout(request, env, origin) {
    const user = await verifyFirebaseUser(request, env)
  const body = await request.json()
  const productId = String(body.productId || '')
  const quantity = Math.max(1, Math.min(10, Math.floor(Number(body.quantity) || 1)))
  if (!/^[A-Za-z0-9_-]{1,150}$/.test(productId)) throw new Error('Invalid product.')

  const productDoc = await firestoreRequest(env, `products/${productId}`)
  const product = Object.fromEntries(Object.entries(productDoc.fields || {}).map(([k,v]) => [k, decodeFirestoreValue(v)]))
  const price = Number(product.price)
  const stock = Number(product.available_quantity ?? product.stock ?? 0)
  if (!product.name || !Number.isFinite(price) || price <= 0) throw new Error('This product is not available for checkout.')
  if (stock < quantity) throw new Error('There is not enough stock for this quantity.')

  const orderId = crypto.randomUUID()
  const total = Math.round(price * quantity * 100) / 100
  await firestoreRequest(env, `orders?documentId=${orderId}`, {
    method: 'POST', body: JSON.stringify({ fields: {
      uid: encodeFirestoreValue(user.uid), email: encodeFirestoreValue(user.email),
      productId: encodeFirestoreValue(productId), productName: encodeFirestoreValue(product.name),
      image: encodeFirestoreValue(product.image || ''), quantity: encodeFirestoreValue(quantity),
      unitPrice: encodeFirestoreValue(price), total: encodeFirestoreValue(total),
      status: encodeFirestoreValue('pending'), paymentStatus: encodeFirestoreValue('unpaid'),
      paymentProvider: encodeFirestoreValue('stripe'), createdAt: { timestampValue: new Date().toISOString() },
    } }),
  })

  const form = new URLSearchParams({
    mode: 'payment',
    success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
cancel_url: `${origin}/payment/cancel?order_id=${orderId}`,
    customer_email: user.email,
    client_reference_id: orderId,
    'metadata[orderId]': orderId,
    'metadata[uid]': user.uid,
    'line_items[0][price_data][currency]': (env.CURRENCY || 'bdt').toLowerCase(),
    'line_items[0][price_data][unit_amount]': String(Math.round(price * 100)),
    'line_items[0][price_data][product_data][name]': String(product.name).slice(0, 200),
    'custom_text[submit][message]': 'Your payment is securely processed by Stripe. Your order is confirmed after payment verification.',
    'line_items[0][quantity]': String(quantity),
  })
  if (typeof product.image === 'string' && /^https:\/\//i.test(product.image)) {
    form.set('line_items[0][price_data][product_data][images][0]', product.image)
  }
  const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST', headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'content-type': 'application/x-www-form-urlencoded' }, body: form,
  })
  const session = await stripeResponse.json()
  if (!stripeResponse.ok) throw new Error(session.error?.message || 'Stripe could not create a checkout session.')
  await firestoreRequest(env, `orders/${orderId}?updateMask.fieldPaths=stripeSessionId`, {
    method: 'PATCH', body: JSON.stringify({ fields: { stripeSessionId: encodeFirestoreValue(session.id) } }),
  })
  return { url: session.url, orderId }
}

async function verifyStripeSignature(rawBody, signatureHeader, secret) {
  const parts = Object.fromEntries(signatureHeader.split(',').map(part => part.split('=')))
  const timestamp = parts.t
  const signature = parts.v1
  if (!timestamp || !signature || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${rawBody}`))
  const expected = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
  if (expected.length !== signature.length) return false
  let mismatch = 0
  for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  return mismatch === 0
}

async function firestoreDocument(env, path) {
  const token = await serviceAccessToken(env.FIREBASE_SERVICE_ACCOUNT_JSON)
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}`, {
    headers: { authorization: `Bearer ${token}` },
  })
  const body = await response.json().catch(() => ({}))
  if (response.status === 404) return null
  if (!response.ok) throw new Error(body.error?.message || 'Could not read Firestore document.')
  return body
}

async function commitPaidOrderAndStock(env, orderId, session) {
  const orderDoc = await firestoreDocument(env, `orders/${orderId}`)
  if (!orderDoc) throw new Error('The order for this payment was not found.')
  const order = Object.fromEntries(Object.entries(orderDoc.fields || {}).map(([k,v]) => [k, decodeFirestoreValue(v)]))
  if (order.paymentStatus === 'paid') return // Stripe retries are safe; never decrement twice.
  if (order.paymentStatus !== 'unpaid' || !order.productId) throw new Error('This order is not eligible for stock fulfilment.')

  const productDoc = await firestoreDocument(env, `products/${order.productId}`)
  if (!productDoc) throw new Error('The purchased product no longer exists.')
  const product = Object.fromEntries(Object.entries(productDoc.fields || {}).map(([k,v]) => [k, decodeFirestoreValue(v)]))
  const quantity = Number(order.quantity)
  const stockField = Object.prototype.hasOwnProperty.call(product, 'available_quantity') ? 'available_quantity' : 'stock'
  const stock = Number(product[stockField] ?? 0)
  if (!Number.isInteger(quantity) || quantity < 1) throw new Error('The order quantity is invalid.')

  // A paid Stripe session must be recorded even if stock changed after checkout.
  // Never create negative inventory; flag the order for manual fulfilment/refund review.
  const stockConflict = stock < quantity
  const newOrderFields = {
    paymentStatus: encodeFirestoreValue('paid'),
    status: encodeFirestoreValue(stockConflict ? 'stock_conflict' : 'confirmed'),
    stripePaymentIntentId: encodeFirestoreValue(session.payment_intent || ''),
    paidAt: { timestampValue: new Date().toISOString() },
    ...(stockConflict ? { stockConflict: encodeFirestoreValue(true) } : {}),
  }
  const writes = [{
    update: { name: orderDoc.name, fields: newOrderFields },
    updateMask: { fieldPaths: Object.keys(newOrderFields) },
    currentDocument: { updateTime: orderDoc.updateTime },
  }]
  if (!stockConflict) {
    const newStockFields = { [stockField]: encodeFirestoreValue(stock - quantity) }
    writes.push({
      update: { name: productDoc.name, fields: newStockFields },
      updateMask: { fieldPaths: [stockField] },
      currentDocument: { updateTime: productDoc.updateTime },
    })
  }
  const token = await serviceAccessToken(env.FIREBASE_SERVICE_ACCOUNT_JSON)
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:commit`, {
    method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ writes }),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    // A concurrent webhook may have won. Re-read; if already paid this is success.
    const latest = await firestoreDocument(env, `orders/${orderId}`)
    const latestStatus = decodeFirestoreValue(latest?.fields?.paymentStatus)
    if (latestStatus === 'paid') return
    throw new Error(result.error?.message || 'Could not safely update payment and stock. Stripe will retry the webhook.')
  }
}


async function getDocumentData(env, path) {
  const doc = await firestoreDocument(env, path)
  if (!doc) return null
  return { raw: doc, data: Object.fromEntries(Object.entries(doc.fields || {}).map(([k, v]) => [k, decodeFirestoreValue(v)])) }
}

async function requireAdmin(request, env) {
  const user = await verifyFirebaseUser(request, env)
  const profile = await getDocumentData(env, `users/${user.uid}`)
  if (profile?.data?.role !== 'admin') throw new Error('Admin access required.')
  return user
}

async function updateOrderStatus(request, env) {
  await requireAdmin(request, env)
  const body = await request.json().catch(() => ({}))
  const orderId = String(body.orderId || '')
  const status = String(body.status || '')
  if (!/^[A-Za-z0-9_-]{1,150}$/.test(orderId)) throw new Error('Invalid order reference.')
  if (!['pending', 'processing', 'shipped', 'completed', 'cancelled'].includes(status)) throw new Error('Invalid order status.')

  const orderDoc = await firestoreDocument(env, `orders/${orderId}`)
  if (!orderDoc) throw new Error('Order not found.')
  const order = Object.fromEntries(Object.entries(orderDoc.fields || {}).map(([k, v]) => [k, decodeFirestoreValue(v)]))
  const previousStatus = String(order.status || 'pending')
  if (previousStatus === 'cancelled' && status !== 'cancelled') {
    throw new Error('A cancelled order cannot be reopened. Create a new order instead.')
  }
  if (previousStatus === status && !(status === 'cancelled' && order.paymentStatus === 'paid' && order.stockRestored !== true)) {
    return { success: true, alreadyUpdated: true }
  }

  const orderFields = { status: encodeFirestoreValue(status) }
  const writes = []
  if (status === 'cancelled' && order.paymentStatus === 'paid' && order.stockRestored !== true) {
    if (!order.productId) throw new Error('The product for this order could not be identified.')
    const quantity = Number(order.quantity)
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error('The order quantity is invalid.')
    const productDoc = await firestoreDocument(env, `products/${order.productId}`)
    if (!productDoc) throw new Error('The product no longer exists; stock could not be restored.')
    const product = Object.fromEntries(Object.entries(productDoc.fields || {}).map(([k, v]) => [k, decodeFirestoreValue(v)]))
    const stockField = Object.prototype.hasOwnProperty.call(product, 'available_quantity') ? 'available_quantity' : 'stock'
    const stock = Number(product[stockField] ?? 0)
    if (!Number.isFinite(stock) || stock < 0) throw new Error('The product stock value is invalid.')
    orderFields.stockRestored = encodeFirestoreValue(true)
    writes.push({
      update: { name: productDoc.name, fields: { [stockField]: encodeFirestoreValue(stock + quantity) } },
      updateMask: { fieldPaths: [stockField] },
      currentDocument: { updateTime: productDoc.updateTime },
    })
  }
  writes.push({
    update: { name: orderDoc.name, fields: orderFields },
    updateMask: { fieldPaths: Object.keys(orderFields) },
    currentDocument: { updateTime: orderDoc.updateTime },
  })
  const token = await serviceAccessToken(env.FIREBASE_SERVICE_ACCOUNT_JSON)
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:commit`, {
    method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ writes }),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error?.message || 'Could not safely update the order and stock. Refresh and try again.')
  return { success: true, stockRestored: Boolean(orderFields.stockRestored) }
}

async function getCompletedOrdersForProduct(env, uid, productId) {
  const token = await serviceAccessToken(env.FIREBASE_SERVICE_ACCOUNT_JSON)
  const endpoint = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`
  // Query only by uid, then filter in Worker code to avoid requiring a composite index.
  const query = { structuredQuery: {
    from: [{ collectionId: 'orders' }],
    where: { fieldFilter: { field: { fieldPath: 'uid' }, op: 'EQUAL', value: encodeFirestoreValue(uid) } },
    limit: 100,
  } }
  const response = await fetch(endpoint, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(query) })
  const rows = await response.json().catch(() => [])
  if (!response.ok) throw new Error('Could not check your purchase. Please try again.')
  return rows.filter(row => {
    if (!row.document) return false
    const order = Object.fromEntries(Object.entries(row.document.fields || {}).map(([key, value]) => [key, decodeFirestoreValue(value)]))
    return order.productId === productId && order.paymentStatus === 'paid' && order.status === 'completed' && order.stockConflict !== true
  }).map(row => ({
    id: row.document.name.split('/').pop(),
    data: Object.fromEntries(Object.entries(row.document.fields || {}).map(([key, value]) => [key, decodeFirestoreValue(value)])),
  }))
}

function reviewDocumentId(orderId) {
  return `order_${orderId}`
}

async function getReviewsForUser(env, uid) {
  const token = await serviceAccessToken(env.FIREBASE_SERVICE_ACCOUNT_JSON)
  const endpoint = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`
  const query = { structuredQuery: {
    from: [{ collectionId: 'reviews' }],
    where: { fieldFilter: { field: { fieldPath: 'uid' }, op: 'EQUAL', value: encodeFirestoreValue(uid) } },
    limit: 100,
  } }
  const response = await fetch(endpoint, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(query) })
  const rows = await response.json().catch(() => [])
  if (!response.ok) throw new Error('Could not load your previous reviews.')
  return rows.filter(row => row.document).map(row => ({
    id: row.document.name.split('/').pop(),
    data: Object.fromEntries(Object.entries(row.document.fields || {}).map(([key, value]) => [key, decodeFirestoreValue(value)])),
  }))
}

async function checkReviewEligibility(request, env) {
  const user = await verifyFirebaseUser(request, env)
  const body = await request.json().catch(() => ({}))
  const productId = String(body.productId || '')
  if (!/^[A-Za-z0-9_-]{1,150}$/.test(productId)) throw new Error('Invalid product.')
  // These two user-scoped queries are independent, so run them concurrently.
  // Reviews are indexed by orderId in memory; this replaces one sequential
  // Firestore document read per completed order with a single reviews query.
  const [orders, allUserReviews] = await Promise.all([
    getCompletedOrdersForProduct(env, user.uid, productId),
    getReviewsForUser(env, user.uid),
  ])
  const userReviews = allUserReviews.filter(item => item.data.productId === productId)
  const reviewsByOrder = new Map(userReviews.filter(item => item.data.orderId).map(item => [item.data.orderId, item]))
  const legacyReview = userReviews.find(item => !item.data.orderId)
  let legacyReviewAssigned = false
  const eligibleOrders = orders.map(order => {
    let reviewItem = reviewsByOrder.get(order.id)
    if (!reviewItem && legacyReview && !legacyReviewAssigned) {
      reviewItem = legacyReview
      legacyReviewAssigned = true
    }
    const review = reviewItem?.data
    return {
      orderId: order.id,
      hasReview: Boolean(review && review.uid === user.uid && (!review.orderId || review.orderId === order.id)),
      rating: review?.rating || 5,
      comment: review?.comment || '',
    }
  })
  return { eligible: eligibleOrders.length > 0, eligibleOrders }
}

async function createVerifiedReview(request, env) {
  const user = await verifyFirebaseUser(request, env)
  const body = await request.json()
  const productId = String(body.productId || '')
  const orderId = String(body.orderId || '')
  const rating = Number(body.rating)
  const comment = String(body.comment || '').trim()
  if (!/^[A-Za-z0-9_-]{1,150}$/.test(productId) || !/^[A-Za-z0-9_-]{1,150}$/.test(orderId)) throw new Error('Invalid product or order reference.')
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('Choose a rating from 1 to 5.')
  if (!comment || comment.length > 2000) throw new Error('Write a review of up to 2,000 characters.')

  const orders = await getCompletedOrdersForProduct(env, user.uid, productId)
  const eligibleOrder = orders.find(order => order.id === orderId)
  if (!eligibleOrder) throw new Error('Only customers with a paid, completed, non-cancelled order can review this product.')

  const deterministicReviewId = reviewDocumentId(orderId)
  let reviewId = deterministicReviewId
  let existing = await firestoreDocument(env, `reviews/${reviewId}`)
  if (!existing) {
    const legacy = (await getReviewsForUser(env, user.uid)).find(item => item.data.productId === productId && !item.data.orderId)
    if (legacy) {
      reviewId = legacy.id
      existing = await firestoreDocument(env, `reviews/${reviewId}`)
    }
  }
  const existingData = existing ? Object.fromEntries(Object.entries(existing.fields || {}).map(([key, value]) => [key, decodeFirestoreValue(value)])) : null
  if (existingData && (existingData.uid !== user.uid || existingData.productId !== productId || (existingData.orderId && existingData.orderId !== orderId))) {
    throw new Error('This order review belongs to another account or order.')
  }
  const fields = {
    uid: encodeFirestoreValue(user.uid), orderId: encodeFirestoreValue(orderId), productId: encodeFirestoreValue(productId),
    name: encodeFirestoreValue(String(body.name || user.email || 'Verified customer').slice(0, 100)),
    rating: encodeFirestoreValue(rating), comment: encodeFirestoreValue(comment),
    verifiedPurchase: encodeFirestoreValue(true), createdAt: existing?.fields?.createdAt || { timestampValue: new Date().toISOString() },
    updatedAt: { timestampValue: new Date().toISOString() },
  }
  const updateMask = new URLSearchParams()
  Object.keys(fields).forEach(fieldPath => updateMask.append('updateMask.fieldPaths', fieldPath))
  await firestoreRequest(env, `reviews/${reviewId}?${updateMask.toString()}`, { method: 'PATCH', body: JSON.stringify({ fields }) })
  return { success: true, reviewId, updated: Boolean(existing) }
}

// The browser return page also asks the Worker to verify the Checkout Session
// directly with Stripe. This means stock fulfilment does not depend solely on
// the webhook arriving before the customer returns to the site.
async function confirmCheckout(request, env) {
  const user = await verifyFirebaseUser(request, env)
  const body = await request.json().catch(() => ({}))
  const sessionId = String(body.sessionId || '')
  const orderId = String(body.orderId || '')
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) throw new Error('Invalid checkout reference.')
  if (!/^[A-Za-z0-9_-]{1,150}$/.test(orderId)) throw new Error('Invalid order reference.')

  const stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
  })
  const session = await stripeResponse.json().catch(() => ({}))
  if (!stripeResponse.ok) throw new Error(session.error?.message || 'Could not verify your payment with Stripe.')

  if (session.id !== sessionId ||
      session.metadata?.orderId !== orderId ||
      session.client_reference_id !== orderId ||
      session.payment_status !== 'paid' ||
      session.status !== 'complete') {
    return { confirmed: false, message: 'Stripe has not confirmed this payment yet.' }
  }

  const orderDoc = await firestoreDocument(env, `orders/${orderId}`)
  if (!orderDoc) throw new Error('The order could not be found.')
  const order = Object.fromEntries(Object.entries(orderDoc.fields || {}).map(([k,v]) => [k, decodeFirestoreValue(v)]))
  if (order.uid !== user.uid || session.metadata?.uid !== user.uid) throw new Error('This order does not belong to your account.')
  if (order.stripeSessionId && order.stripeSessionId !== sessionId) throw new Error('Checkout reference does not match this order.')

  await commitPaidOrderAndStock(env, orderId, session)
  const updated = await firestoreDocument(env, `orders/${orderId}`)
  const status = decodeFirestoreValue(updated?.fields?.status)
  return { confirmed: decodeFirestoreValue(updated?.fields?.paymentStatus) === 'paid', status }
}

async function handleWebhook(request, env) {
  const rawBody = await request.text()
  const signature = request.headers.get('stripe-signature') || ''
  if (!await verifyStripeSignature(rawBody, signature, env.STRIPE_WEBHOOK_SECRET)) return json({ error: 'Invalid signature' }, 400)
  const event = JSON.parse(rawBody)
  const session = event.data?.object
  const orderId = session?.metadata?.orderId
  if (event.type === 'checkout.session.completed' && session?.payment_status === 'paid' && orderId) {
    await commitPaidOrderAndStock(env, orderId, session)
  } else if (event.type === 'checkout.session.expired' && orderId) {
    const orderDoc = await firestoreDocument(env, `orders/${orderId}`)
    if (orderDoc && decodeFirestoreValue(orderDoc.fields?.paymentStatus) === 'unpaid') {
      await firestoreRequest(env, `orders/${orderId}?updateMask.fieldPaths=paymentStatus`, {
        method: 'PATCH', body: JSON.stringify({ fields: { paymentStatus: encodeFirestoreValue('failed') } }),
      })
    }
  }
  return json({ received: true })
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('origin') || ''
const allowedOrigins = getAllowedOrigins(env)
const headers = cors(origin, allowedOrigins)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
    const url = new URL(request.url)
    try {
      if (url.pathname === '/upload-image' && request.method === 'POST') {
        if (!allowedOrigins.has(origin)) return json({ error: 'Origin not allowed.' }, 403, headers)
        if (!env.FIREBASE_SERVICE_ACCOUNT_JSON || !env.FIREBASE_PROJECT_ID || !env.FIREBASE_WEB_API_KEY) return json({ error: 'Image upload service is not configured.' }, 503, headers)
        return json(await uploadProductImage(request, env), 200, headers)
      }
      if (url.pathname === '/webhook' && request.method === 'POST') return await handleWebhook(request, env)
      if (url.pathname === '/review-eligibility' && request.method === 'POST') {
        if (!allowedOrigins.has(origin)) return json({ error: 'Origin not allowed.' }, 403, headers)
        if (!env.FIREBASE_SERVICE_ACCOUNT_JSON || !env.FIREBASE_PROJECT_ID || !env.FIREBASE_WEB_API_KEY) return json({ error: 'Review service is not configured.' }, 503, headers)
        return json(await checkReviewEligibility(request, env), 200, headers)
      }
      if (url.pathname === '/admin/order-status' && request.method === 'POST') {
        if (!allowedOrigins.has(origin)) return json({ error: 'Origin not allowed.' }, 403, headers)
        if (!env.FIREBASE_SERVICE_ACCOUNT_JSON || !env.FIREBASE_PROJECT_ID || !env.FIREBASE_WEB_API_KEY) return json({ error: 'Order service is not configured.' }, 503, headers)
        return json(await updateOrderStatus(request, env), 200, headers)
      }
      if (url.pathname === '/reviews' && request.method === 'POST') {
        if (!allowedOrigins.has(origin)) return json({ error: 'Origin not allowed.' }, 403, headers)
        if (!env.FIREBASE_SERVICE_ACCOUNT_JSON || !env.FIREBASE_PROJECT_ID || !env.FIREBASE_WEB_API_KEY) return json({ error: 'Review service is not configured.' }, 503, headers)
        return json(await createVerifiedReview(request, env), 201, headers)
      }
      if (url.pathname === '/confirm-payment' && request.method === 'POST') {
        if (!allowedOrigins.has(origin)) return json({ error: 'Origin not allowed.' }, 403, headers)
        if (!env.STRIPE_SECRET_KEY || !env.FIREBASE_SERVICE_ACCOUNT_JSON || !env.FIREBASE_PROJECT_ID || !env.FIREBASE_WEB_API_KEY) return json({ error: 'Payment confirmation service is not configured.' }, 503, headers)
        return json(await confirmCheckout(request, env), 200, headers)
      }
      if (url.pathname === '/create-checkout-session' && request.method === 'POST') {
        if (!allowedOrigins.has(origin)) return json({ error: 'Origin not allowed.' }, 403, headers)
        if (!env.STRIPE_SECRET_KEY || !env.FIREBASE_SERVICE_ACCOUNT_JSON || !env.FIREBASE_PROJECT_ID || !env.FRONTEND_URL) return json({ error: 'Payment service is not configured yet.' }, 503, headers)
        return json(await createCheckout(request, env, origin), 200, headers)
      }
      return json({ error: 'Not found' }, 404, headers)
    } catch (error) {
      return json({ error: error.message || 'Payment request failed.' }, 400, headers)
    }
  },
}
