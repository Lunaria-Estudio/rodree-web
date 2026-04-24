export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    const { email } = req.body;

    if (!email || !email.includes('@')) {
        return res.status(400).json({ message: 'Proporcioná un email válido.' });
    }

    try {
        const response = await fetch('https://api.brevo.com/v3/contacts', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/json',
                'api-key': process.env.BREVO_API_KEY
            },
            body: JSON.stringify({
                email: email,
                listIds: [2],
                updateEnabled: true
            })
        });

        const data = await response.json();

        if (response.ok) {
            return res.status(200).json({ message: '¡Gracias por suscribirte!' });
        } else {
            const errorMsg = data.code === 'duplicate_parameter' ? 'Ya estás suscrito.' : (data.message || 'Error al procesar.');
            return res.status(response.status).json({ message: errorMsg });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Error de servidor. Intentá más tarde.' });
    }
}