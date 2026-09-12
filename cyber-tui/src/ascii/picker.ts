import { spawn } from 'node:child_process'

const IMAGE_FILTER = 'Images and video|*.png;*.jpg;*.jpeg;*.webp;*.gif;*.bmp;*.mp4;*.mov;*.webm|All files|*.*'

/** Remove wrapping quotes added when a path is copied from Explorer. */
export function normalizeMediaPath(value: string): string {
  const trimmed = value.trim()
  if (trimmed.length >= 2) {
    const first = trimmed[0]
    const last = trimmed[trimmed.length - 1]
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) return trimmed.slice(1, -1)
  }
  return trimmed
}

/** Open the native Windows file chooser. Other platforms can use /ascii image PATH. */
export async function pickLocalMedia(): Promise<string | null> {
  if (process.platform !== 'win32') throw new Error('native media picking is currently available on Windows; use /ascii image PATH')

  const script = [
    'Add-Type -AssemblyName System.Windows.Forms',
    '$dialog = New-Object System.Windows.Forms.OpenFileDialog',
    `$dialog.Filter = '${IMAGE_FILTER}'`,
    "$dialog.Title = 'Choose your Hermes ASCII Forge image'",
    '$dialog.Multiselect = $false',
    'if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { [Console]::Out.Write($dialog.FileName) }'
  ].join('; ')

  return await new Promise<string | null>((resolve, reject) => {
    const child = spawn('powershell.exe', ['-NoProfile', '-STA', '-Command', script], {
      shell: false,
      windowsHide: true
    })
    let output = ''
    let error = ''
    child.stdout.on('data', (chunk: Buffer) => { output += chunk.toString() })
    child.stderr.on('data', (chunk: Buffer) => { error += chunk.toString() })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(error.trim() || `image picker exited ${code}`))
      else resolve(normalizeMediaPath(output) || null)
    })
  })
}
