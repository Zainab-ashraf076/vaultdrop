'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Upload, Lock, Clock, Copy, Check, ChevronRight, Zap, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { encryptFile, encodeVaultPayload, formatBytes } from '@/lib/crypto'

type Step = 'upload' | 'configure' | 'done'

export default function Home() {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [expiry, setExpiry] = useState('24h')
  const [isDragging, setIsDragging] = useState(false)
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) { setFile(dropped); setStep('configure') }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) { setFile(selected); setStep('configure') }
  }

  const getExpiryMs = () => {
    const map: Record<string, number> = {
      '1h': 3600000, '24h': 86400000, '7d': 604800000, 'never': 0
    }
    return map[expiry] || 86400000
  }

  const handleEncrypt = async () => {
    if (!file || !password) { setError('Please enter a password'); return }
    if (password.length < 4) { setError('Password must be at least 4 characters'); return }
    setError('')
    setIsEncrypting(true)
    try {
      const expiryMs = getExpiryMs()
      const expiresAt = expiryMs ? Date.now() + expiryMs : undefined
      const result = await encryptFile(file, password)
      const payload = encodeVaultPayload({ ...result, expiresAt })
      const url = `${window.location.origin}/vault?v=${payload}`
      setShareLink(url)
      setStep('done')
    } catch {
      setError('Encryption failed. Please try again.')
    } finally {
      setIsEncrypting(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => {
    setStep('upload'); setFile(null); setPassword(''); setShareLink(''); setExpiry('24h'); setError('')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-vault-700/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-900/20 blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-vault-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">VaultDrop</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>End-to-end encrypted</span>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-2xl mx-auto px-6 pt-12 pb-24">
        <AnimatePresence mode="wait">

          {/* STEP 1 — Upload */}
          {step === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-10">
                <motion.div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-vault-300 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  <Zap className="w-3 h-3" /> Browser-only encryption — your files never leave your device
                </motion.div>
                <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
                  Share files,<br />
                  <span className="gradient-text">not your privacy.</span>
                </h1>
                <p className="text-gray-400 text-lg">Encrypt any file in your browser, get a shareable link. No servers. No accounts.</p>
              </div>

              {/* Drop Zone */}
              <motion.div
                className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer p-12 text-center ${isDragging ? 'border-vault-500 bg-vault-600/10' : 'border-white/10 hover:border-vault-500/50 hover:bg-white/[0.02]'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <input ref={fileRef} type="file" className="hidden" onChange={handleFileSelect} />
                <motion.div className="w-16 h-16 rounded-2xl bg-vault-600/20 border border-vault-500/30 flex items-center justify-center mx-auto mb-4" animate={isDragging ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}>
                  <Upload className="w-7 h-7 text-vault-400" />
                </motion.div>
                <p className="text-white font-semibold text-lg mb-1">Drop your file here</p>
                <p className="text-gray-500 text-sm">or click to browse — any file type, up to 10MB</p>
              </motion.div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                {[
                  { icon: Lock, label: 'AES-256 Encryption' },
                  { icon: Clock, label: 'Auto Expiry Links' },
                  { icon: Shield, label: 'Zero Server Storage' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="glass rounded-xl p-3 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-vault-400 shrink-0" />
                    <span className="text-xs text-gray-400">{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Configure */}
          {step === 'configure' && file && (
            <motion.div key="configure" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <button onClick={reset} className="text-gray-500 text-sm hover:text-gray-300 mb-6 flex items-center gap-1 transition-colors">
                ← Back
              </button>

              <h2 className="text-3xl font-bold text-white mb-2">Protect your file</h2>
              <p className="text-gray-400 mb-8">Set a password and expiry. Only people with both can access it.</p>

              {/* File preview */}
              <div className="glass rounded-xl p-4 flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-lg bg-vault-600/30 flex items-center justify-center text-vault-300 font-bold text-xs uppercase">
                  {file.name.split('.').pop()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{file.name}</p>
                  <p className="text-gray-500 text-sm">{formatBytes(file.size)}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-400" />
              </div>

              {/* Password */}
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">Encryption Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleEncrypt()}
                    placeholder="Enter a strong password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-vault-500 transition-colors"
                  />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 text-red-400 text-xs mt-2">
                    <AlertCircle className="w-3 h-3" /> {error}
                  </motion.p>
                )}
              </div>

              {/* Expiry */}
              <div className="mb-8">
                <label className="text-sm text-gray-400 mb-2 block">Link Expiry</label>
                <div className="grid grid-cols-4 gap-2">
                  {[{ v: '1h', l: '1 Hour' }, { v: '24h', l: '24 Hours' }, { v: '7d', l: '7 Days' }, { v: 'never', l: 'Never' }].map(({ v, l }) => (
                    <button
                      key={v}
                      onClick={() => setExpiry(v)}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all ${expiry === v ? 'bg-vault-600 text-white glow-sm' : 'glass text-gray-400 hover:text-white hover:border-vault-500/30'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <motion.button
                onClick={handleEncrypt}
                disabled={isEncrypting || !password}
                className="w-full bg-vault-600 hover:bg-vault-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all glow"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {isEncrypting ? (
                  <>
                    <motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                    Encrypting...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Encrypt & Generate Link
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              <p className="text-center text-gray-600 text-xs mt-4">
                🔒 Encryption happens entirely in your browser
              </p>
            </motion.div>
          )}

          {/* STEP 3 — Done */}
          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center">
              <motion.div
                className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
              >
                <Check className="w-9 h-9 text-green-400" />
              </motion.div>

              <h2 className="text-3xl font-bold text-white mb-2">Your vault is ready!</h2>
              <p className="text-gray-400 mb-8">Share this link. Only someone with your password can open it.</p>

              <div className="glass rounded-xl p-4 mb-4">
                <p className="text-xs text-gray-500 mb-2 text-left">Shareable Link</p>
                <div className="flex items-center gap-3">
                  <p className="text-vault-300 text-sm flex-1 truncate text-left font-mono">{shareLink.slice(0, 60)}...</p>
                  <motion.button
                    onClick={handleCopy}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${copied ? 'bg-green-500/20 text-green-400' : 'bg-vault-600/30 text-vault-300 hover:bg-vault-600/50'}`}
                    whileTap={{ scale: 0.95 }}
                  >
                    {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                  </motion.button>
                </div>
              </div>

              <div className="glass rounded-xl p-4 mb-8 text-left">
                <p className="text-xs text-gray-500 mb-3">Share details</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">File</span>
                    <span className="text-white">{file?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Expires</span>
                    <span className="text-white">{expiry === 'never' ? 'Never' : `in ${expiry}`}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Encryption</span>
                    <span className="text-green-400">AES-256-GCM ✓</span>
                  </div>
                </div>
              </div>

              <button onClick={reset} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
                ← Encrypt another file
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
