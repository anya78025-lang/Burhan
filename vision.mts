import { gemini, json, parseDataUrls } from '../lib/ai.mts'

// Fallback image analysis when no catalog model could handle the images.
const VISION_MODEL = { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' }

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ detail: 'Method not allowed' }, 405)
  let body: any
  try {
    body = await req.json()
  } catch {
    return json({ detail: 'Некорректный JSON' }, 400)
  }
  const prompt = typeof body?.prompt === 'string' && body.prompt.trim() ? body.prompt.slice(0, 8000) : 'Опиши изображение.'
  const imgs = parseDataUrls(body?.images)
  if (!imgs.length) return json({ detail: 'Нет изображений для анализа' }, 400)
  try {
    const res = await gemini().models.generateContent({
      model: VISION_MODEL.id,
      contents: [{ role: 'user', parts: [{ text: prompt }, ...imgs] }],
    })
    return json({ model: VISION_MODEL.id, label: VISION_MODEL.label, text: res.text || '' })
  } catch (e: any) {
    console.error('vision failed', e)
    return json({ detail: 'Не удалось проанализировать изображение: ' + (e?.message || e) }, 502)
  }
}

export const config = { path: '/api/vision' }
