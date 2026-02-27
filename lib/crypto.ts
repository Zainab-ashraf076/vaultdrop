// Web Crypto API — all encryption happens in the browser
// Server never sees plaintext data

export async function generateKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  return window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptFile(
  file: File,
  password: string
): Promise<{ encryptedData: ArrayBuffer; salt: Uint8Array; iv: Uint8Array; fileName: string; fileType: string; fileSize: number }> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16))
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const key = await generateKey(password, salt)
  const fileBuffer = await file.arrayBuffer()
  const encryptedData = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, fileBuffer)
  return { encryptedData, salt, iv, fileName: file.name, fileType: file.type, fileSize: file.size }
}

export async function decryptFile(
  encryptedData: ArrayBuffer,
  password: string,
  salt: Uint8Array,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  const key = await generateKey(password, salt)
  return window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encryptedData)
}

export function encodeVaultPayload(params: {
  encryptedData: ArrayBuffer
  salt: Uint8Array
  iv: Uint8Array
  fileName: string
  fileType: string
  fileSize: number
  expiresAt?: number
}): string {
  const payload = {
    d: btoa(String.fromCharCode(...new Uint8Array(params.encryptedData))),
    s: btoa(String.fromCharCode(...params.salt)),
    i: btoa(String.fromCharCode(...params.iv)),
    n: params.fileName,
    t: params.fileType,
    z: params.fileSize,
    e: params.expiresAt,
  }
  return btoa(encodeURIComponent(JSON.stringify(payload)))
}

export function decodeVaultPayload(encoded: string): {
  encryptedData: ArrayBuffer
  salt: Uint8Array
  iv: Uint8Array
  fileName: string
  fileType: string
  fileSize: number
  expiresAt?: number
} | null {
  try {
    const json = JSON.parse(decodeURIComponent(atob(encoded)))
    const toUint8 = (b64: string) => new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0)))
    const toBuffer = (b64: string) => toUint8(b64).buffer
    return {
      encryptedData: toBuffer(json.d),
      salt: toUint8(json.s),
      iv: toUint8(json.i),
      fileName: json.n,
      fileType: json.t,
      fileSize: json.z,
      expiresAt: json.e,
    }
  } catch {
    return null
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function isExpired(expiresAt?: number): boolean {
  if (!expiresAt) return false
  return Date.now() > expiresAt
}
