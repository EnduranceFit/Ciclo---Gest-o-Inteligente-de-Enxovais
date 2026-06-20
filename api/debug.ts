export default async function handler(req: any, res: any) {
  try {
    const auth = await import('./_middleware/auth.js');
    res.status(200).json({ status: 'ok', auth: Object.keys(auth) });
  } catch (e: any) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
}
