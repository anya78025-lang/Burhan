import { gemini, json, parseDataUrls } from '../lib/ai.mts'
import { Modality } from '@google/genai'

// Image-capable models, tried in order until one returns an image.
const IMAGE_MODELS = [
  { id: 'gemini-3.1-flash-image', label: 'Gemini 3.1 Flash Image' },
  { id: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image' },
]

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ detail: 'Method not allowed' }, 405)
  let body: any
  try {
    body = await req.json()
  } catch {
    return json({ detail: 'Некорректный JSON' }, 400)
  }
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim().slice(0, 4000) : ''
  if (!prompt) return json({ detail: 'Пустой запрос для генерации' }, 400)
  const refs = parseDataUrls(body?.images)

  const ai = gemini()
  let lastError = ''
  for (const model of IMAGE_MODELS) {
    try {
      const res = await ai.models.generateContent({
        model: model.id,
        contents: [{ role: 'user', parts: [{ text: prompt }, ...refs] }],
        config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
      })
      const parts = res.candidates?.[0]?.content?.parts ?? []
      const images = parts
        .filter((p) => p.inlineData?.data)
        .map((p) => `data:${p.inlineData!.mimeType || 'image/png'};base64,${p.inlineData!.data}`)
      const text = parts.map((p) => p.text || '').join('').trim()
      if (images.length) return json({ model: model.id, label: model.label, images, text })
      lastError = text || 'Модель не вернула изображение'
    } catch (e: any) {
      lastError = e?.message || String(e)
      console.error('image generation failed', model.id, lastError)
    }
  }
  return json({ detail: 'Не удалось сгенерировать изображение: ' + lastError }, 502)
}

export const config = { path: '/api/generate-image' }
