const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

module.exports = async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.redirect('/');
  }

  try {
    const postDoc = await db.collection('posts').doc(id).get();

    if (!postDoc.exists) {
      return res.redirect('/');
    }

    const post = postDoc.data();
    const title = post.title || 'RODREE | Playa Digital';
    const description = post.shortText || 'Curaduría Sonora & Rituales Nocturnos';
    const image = post.imageUrl || 'https://rodree-web.vercel.app/assets/foto-bio-rodree.jpg';
    const url = `https://rodree-web.vercel.app/post/${id}`;

    // Return minimal HTML with OG tags for the bot
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta name="description" content="${description}">
          
          <!-- Open Graph -->
          <meta property="og:title" content="${title}">
          <meta property="og:description" content="${description}">
          <meta property="og:image" content="${image}">
          <meta property="og:url" content="${url}">
          <meta property="og:type" content="article">
          
          <!-- Twitter -->
          <meta name="twitter:card" content="summary_large_image">
          
          <meta http-equiv="refresh" content="0;url=${url}">
        </head>
        <body>Redirecting...</body>
      </html>
    `);
  } catch (error) {
    console.error('OG Error:', error);
    return res.redirect('/');
  }
};