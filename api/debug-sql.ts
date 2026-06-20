export default async function handler(_req: any, res: any) {
  try {
    const { sql } = await import('@vercel/postgres');
    res.status(200).json({ status: 'ok', sql: typeof sql });
  } catch (e: any) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
}
