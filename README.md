# VaultDrop 🔐

> Secure, browser-based encrypted file sharing. No servers. No accounts. No privacy leaks.

## Features

- **AES-256-GCM encryption** — using Web Crypto API, all in the browser
- **Password protected links** — only people with the password can decrypt
- **Auto expiry** — links expire after 1h / 24h / 7 days / never
- **Zero server storage** — encrypted data lives in the URL itself
- **No accounts needed** — just drop, encrypt, share

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion**
- **Web Crypto API** (browser-native, no external crypto libs)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or push to GitHub and import in [vercel.com](https://vercel.com) — zero config needed.

## How It Works

1. User uploads a file and sets a password
2. Browser generates a random salt + IV
3. PBKDF2 derives an AES-256 key from password + salt
4. File is encrypted with AES-GCM in the browser
5. Encrypted bytes are base64-encoded into the shareable URL
6. Recipient opens the link, enters password, browser decrypts locally
7. Decrypted file is downloaded — server never sees plaintext

## Project Structure

```
app/
  page.tsx        # Home — upload & encrypt
  vault/page.tsx  # Vault — decrypt & download
  layout.tsx      # Root layout
  globals.css     # Global styles
lib/
  crypto.ts       # Web Crypto API utilities
```

## Built by

Zainab Ashraf — [github.com/Zainab-ashraf076](https://github.com/Zainab-ashraf076)
