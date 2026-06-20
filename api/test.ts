export default async function handler(req: any, res: any) {
  try {
    const daily = await import('./daily.js');
    res.status(200).json({ status: 'ok', keys: Object.keys(daily) });
  } catch (e: any) {
    res.status(500).json({ error: e.message, code: e.code, stack: e.stack });
  }
}
