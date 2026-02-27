'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Lock, Download, AlertTriangle, Eye, EyeOff, Clock, FileText, Check } from 'lucide-react'
import { decryptFile, decodeVaultPayload, formatBytes, isExpired } from '@/lib/crypto'
import Link from 'next/link'

function VaultContent() {
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<'idle' | 'decrypting' | 'success' | 'error' | 'expired' | 'invalid'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [decryptedBlob, setDecryptedBlob] = useState<Blob | null>(null)
  const [meta, setMeta] = useState<{ fileName: string; fileSize: number; fileType: string; expiresAt?: number } | null>(null)

  useEffect(() => {
    const v = searchParams.get('v')
    if (!v) { setStatus('invalid'); return }
    const payload = decodeVaultPayload(v)
    if (!payload) { setStatus('invalid'); return }
    if (isExpired(payload.expiresAt)) { setStatus('expired'); return }
    setMeta({ fileName: payload.fileName, fileSize: payload.fileSize, fileType: payload.fileType, expiresAt: payload.expiresAt })
  }, [searchParams])

  const handleDecrypt = async () => {
    const v = searchParams.get('v')
    if (!v || !password) return
    const payload = decodeVaultPayload(v)
    if (!payload) return
    setStatus('decrypting')
    try {
      const decrypted = await decryptFile(payload.encryptedData, password, payload.salt, payload.iv)
      const blob = new Blob([decrypted], { type: payload.fileType || 'application/octet-stream' })
      setDecryptedBlob(blob)
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg('Wrong password or corrupted file.')
      setTimeout(() => setStatus('idle'), 2000)
    }
  }

  const handleDownload = () => {
    if (!decryptedBlob || !meta) return
    const url = URL.createObjectURL(decryptedBlob)
    const a = document.createElement('a')
    a.href = url; a.download = meta.fileName; a.click()
    URL.revokeObjectURL(url)
  }

  const getExpiryText = (expiresAt?: number) => {
    if (!expiresAt) return 'Never expires'
    const diff = expiresAt - Date.now()
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    if (h > 24) return `Expires in ${Math.floor(h / 24)} days`
    if (h > 0) return `Expires in ${h}h ${m}m`
    return `Expires in ${m} minutes`
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-vault-700/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-900/20 blur-[120px]" />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-vault-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">VaultDrop</span>
        </Link>
      </nav>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">

            {/* Invalid */}
            {status === 'invalid' && (
              <motion.div key="invalid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-7 h-7 text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Invalid Link</h2>
                <p className="text-gray-400 mb-6">This vault link is broken or incomplete.</p>
                <Link href="/" className="text-vault-400 hover:text-vault-300 text-sm transition-colors">← Create a new vault</Link>
              </motion.div>
            )}

            {/* Expired */}
            {status === 'expired' && (
              <motion.div key="expired" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                <div className="w-16 h-16 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-7 h-7 text-yellow-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Link Expired</h2>
                <p className="text-gray-400 mb-6">This vault has expired and is no longer accessible.</p>
                <Link href="/" className="text-vault-400 hover:text-vault-300 text-sm transition-colors">← Create a new vault</Link>
              </motion.div>
            )}

            {/* Unlock form */}
            {(status === 'idle' || status === 'decrypting' || status === 'error') && meta && (
              <motion.div key="unlock" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="text-center mb-8">
                  <motion.div className="w-16 h-16 rounded-2xl bg-vault-600/20 border border-vault-500/30 flex items-center justify-center mx-auto mb-4" animate={{ rotate: [0, -5, 5, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
                    <Lock className="w-7 h-7 text-vault-400" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-white mb-2">Vault Locked</h2>
                  <p className="text-gray-400">Enter the password to decrypt and download this file.</p>
                </div>

                {/* File info */}
                <div className="glass rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-vault-600/30 flex items-center justify-center text-vault-300 font-bold text-xs uppercase">
                      {meta.fileName.split('.').pop()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{meta.fileName}</p>
                      <p className="text-gray-500 text-sm">{formatBytes(meta.fileSize)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />{getExpiryText(meta.expiresAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Password input */}
                <div className="mb-6">
                  <label className="text-sm text-gray-400 mb-2 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleDecrypt()}
                      placeholder="Enter vault password"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-vault-500 transition-colors"
                      autoFocus
                    />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {status === 'error' && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-red-400 text-xs mt-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {errorMsg}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  onClick={handleDecrypt}
                  disabled={status === 'decrypting' || !password}
                  className="w-full bg-vault-600 hover:bg-vault-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all glow"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {status === 'decrypting' ? (
                    <>
                      <motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                      Decrypting...
                    </>
                  ) : (
                    <><Lock className="w-4 h-4" /> Unlock & Decrypt</>
                  )}
                </motion.button>
              </motion.div>
            )}

            {/* Success */}
            {status === 'success' && meta && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <motion.div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
                  <Check className="w-9 h-9 text-green-400" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">Decrypted!</h2>
                <p className="text-gray-400 mb-8">Your file is ready to download.</p>

                <div className="glass rounded-xl p-4 mb-6 flex items-center gap-3">
                  <FileText className="w-8 h-8 text-vault-400 shrink-0" />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-white font-medium truncate">{meta.fileName}</p>
                    <p className="text-gray-500 text-sm">{formatBytes(meta.fileSize)} · Decrypted ✓</p>
                  </div>
                </div>

                <motion.button
                  onClick={handleDownload}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all mb-4"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-4 h-4" /> Download File
                </motion.button>
                <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">← Encrypt your own file</Link>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

export default function VaultPage() {
  return (
    <Suspense>
      <VaultContent />
    </Suspense>
  )
}
