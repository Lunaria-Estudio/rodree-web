import admin from 'firebase-admin';

export default async function handler(req, res) {
  const { id } = req.query;
  
  // Valores por defecto (Fallback)
  let title = 'RODREE | Playa Digital';
  let description = 'Curaduría Sonora & Rituales Nocturnos';
  let image = 'https://rodree-web.vercel.app/assets/foto-bio-rodree.jpg';
  let url = id ? `https://rodree-web.vercel.app/post/${id}` : 'https://rodree-web.vercel.app/';

  try {
    if (id && process.env.FIREBASE_SERVICE_ACCOUNT) {
      if (!admin.apps.length) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        // Fix: Corregir saltos de línea escapados en la clave privada
        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      }

      const db = admin.firestore();
      const postDoc = await db.collection('posts').doc(id).get();

      if (postDoc.exists) {
        const post = postDoc.data();
        title = post.title || title;
        description = post.shortText || description;
        image = post.imageUrl || image;
      }
    }
  } catch (error) {
    console.error('OG Error (using fallback):', error);
    // El código continúa para servir la página con los valores por defecto
  }

  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta name="description" content="${description}">
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${description}">
        <meta property="og:image" content="${image}">
        <meta property="og:url" content="${url}">
        <meta property="og:type" content="article">
        <meta name="twitter:card" content="summary_large_image">
        <meta http-equiv="refresh" content="0;url=${url}">
      </head>
      <body>Redirecting...</body>
    </html>
  `);
};