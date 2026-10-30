import fs from "node:fs";
import path from "node:path";

const workerFile = path.resolve("src/index.js");
if (!fs.existsSync(workerFile)) {
  console.error("Could not find src/index.js. Run this script from the payment-worker folder.");
  process.exit(1);
}

let source = fs.readFileSync(workerFile, "utf8");
const start = source.indexOf("async function uploadProductImage(request, env) {");
const end = source.indexOf("\nasync function createCheckout(request, env) {", start);

if (start === -1 || end === -1) {
  console.error("Could not safely locate uploadProductImage(). No files were changed.");
  process.exit(1);
}

const replacement = `async function uploadProductImage(request, env) {
  const user = await verifyFirebaseUser(request, env);
  await requireAdmin(user, env);

  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary is not fully configured on the Worker.');
  }

  const incoming = await request.formData();
  const image = incoming.get('image');

  if (!(image instanceof File)) throw new Error('Choose an image to upload.');
  if (!image.type.startsWith('image/')) throw new Error('Only image files can be uploaded.');
  if (image.size > 8 * 1024 * 1024) throw new Error('Image exceeds the 8 MB limit.');

  const form = new FormData();
  form.append('file', image, image.name || 'product-image');

  // Backend Basic Authentication keeps the API secret inside the Worker.
  const credentials = btoa(\`\${env.CLOUDINARY_API_KEY}:\${env.CLOUDINARY_API_SECRET}\`);
  const response = await fetch(
    \`https://api.cloudinary.com/v1_1/\${encodeURIComponent(env.CLOUDINARY_CLOUD_NAME)}/image/upload\`,
    {
      method: 'POST',
      headers: { authorization: \`Basic \${credentials}\` },
      body: form,
    }
  );

  const responseText = await response.text();
  let result = {};
  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(\`Cloudinary returned an unreadable response (HTTP \${response.status}).\`);
  }

  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message || \`Cloudinary upload failed (HTTP \${response.status}).\`);
  }

  return { url: result.secure_url };
}`;

source = source.slice(0, start) + replacement + source.slice(end);

const oldCheck = "!env.IMGBB_API_KEY || !env.FIREBASE_SERVICE_ACCOUNT_JSON || !env.FIREBASE_WEB_API_KEY || !env.FIREBASE_PROJECT_ID";
const newCheck = "!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET || !env.FIREBASE_SERVICE_ACCOUNT_JSON || !env.FIREBASE_WEB_API_KEY || !env.FIREBASE_PROJECT_ID";

if (!source.includes(oldCheck)) {
  console.error("Could not find the expected upload configuration check. No files were changed.");
  process.exit(1);
}
source = source.replace(oldCheck, newCheck);

const backup = workerFile + ".before-cloudinary";
if (!fs.existsSync(backup)) fs.copyFileSync(workerFile, backup);
fs.writeFileSync(workerFile, source, "utf8");

console.log("Cloudinary migration applied. Backup: src/index.js.before-cloudinary");
console.log("Stripe, Firebase auth, Firestore admin checks, and webhook code were not changed.");
