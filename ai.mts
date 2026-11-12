import { GoogleGenAI } from '@google/genai'

export const gemini = () =>
  new GoogleGenAI({
    apiKey: process.env.NETLIFY_AI_GATEWAY_KEY,
    httpOptions: { baseUrl: process.env.NETLIFY_AI_GATEWAY_URL?.replace(/\/$/, '') },
  })

const MAX_IMAGES = 4
const MAX_DATAURL = 8_000_000

export function parseDataUrls(images: unknown) {
  if (!Array.isArray(images)) return []
  return images
    .slice(0, MAX_IMAGES)
    .map((u) => (typeof u === 'string' && u.length < MAX_DATAURL ? /^data:(image\/[\w.+-]+);base64,(.+)$/.exec(u) : null))
    .filter((m): m is RegExpExecArray => !!m)
    .map((m) => ({ inlineData: { mimeType: m[1], data: m[2] } }))
}

export const json = (body: unknown, status = 200) => Response.json(body, { status })
