import { spawn } from 'node:child_process'
import type { PixelPlane } from './types.js'

/** Decode one local photo/video frame with FFmpeg. No shell interpolation. */
export async function decodeMediaFrame(path: string, width: number, height: number, seconds = 0): Promise<PixelPlane> {
  const w = Math.max(8, Math.min(240, Math.floor(width)))
  const h = Math.max(3, Math.min(120, Math.floor(height)))
  const args = ['-v', 'error']
  if (seconds > 0) args.push('-ss', String(seconds))
  args.push('-i', path, '-vf', `scale=${w}:${h}:flags=lanczos,format=gray`, '-frames:v', '1', '-f', 'rawvideo', 'pipe:1')
  const bytes = await new Promise<Buffer>((resolve, reject) => {
    const child = spawn(process.env.HERMES_ASCII_FFMPEG || 'ffmpeg', args, { shell: false, windowsHide: true })
    const chunks: Buffer[] = []
    let error = ''
    child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk))
    child.stderr.on('data', (chunk: Buffer) => { error += chunk.toString() })
    child.on('error', reject)
    child.on('close', (code) => code === 0 ? resolve(Buffer.concat(chunks)) : reject(new Error(error || `ffmpeg exited ${code}`)))
  })
  if (bytes.length < w * h) throw new Error(`decoded frame is short: ${bytes.length} < ${w * h}`)
  return Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => bytes[y * w + x]! / 255))
}
