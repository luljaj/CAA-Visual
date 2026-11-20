const MUTE_KEY = 'caa_ledger_muted_v1'

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (isSoundMuted()) return null
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    audioCtx = new Ctx()
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

export function isSoundMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === 'true'
  } catch {
    return false
  }
}

export function setSoundMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? 'true' : 'false')
  } catch {
    // ignore storage quota errors
  }
}

export function playSealCrack(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  const now = ctx.currentTime

  // Crisp wax snap
  const len = Math.floor(ctx.sampleRate * 0.08)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const ch = buf.getChannelData(0)
  for (let i = 0; i < len; i++) {
    const decay = Math.exp((-i / len) * 9)
    ch[i] = (Math.random() * 2 - 1) * decay
  }
  const src = ctx.createBufferSource()
  src.buffer = buf

  const hp = ctx.createBiquadFilter()
  hp.type = 'bandpass'
  hp.frequency.setValueAtTime(1900, now)
  hp.Q.value = 1.6

  const g = ctx.createGain()
  g.gain.setValueAtTime(0.22, now)
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
  src.connect(hp).connect(g).connect(ctx.destination)
  src.start(now)

  // Heavy leather thud underneath
  const osc = ctx.createOscillator()
  const og = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(115, now + 0.02)
  osc.frequency.exponentialRampToValueAtTime(42, now + 0.22)
  og.gain.setValueAtTime(0.24, now + 0.02)
  og.gain.exponentialRampToValueAtTime(0.001, now + 0.23)
  osc.connect(og).connect(ctx.destination)
  osc.start(now + 0.02)
  osc.stop(now + 0.25)
}

export function playPageTurn(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  const now = ctx.currentTime

  const duration = 0.22
  const len = Math.floor(ctx.sampleRate * duration)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const ch = buf.getChannelData(0)
  for (let i = 0; i < len; i++) {
    const t = i / len
    const env = Math.sin(Math.PI * t) * (1 - t * 0.45)
    ch[i] = (Math.random() * 2 - 1) * env
  }

  const src = ctx.createBufferSource()
  src.buffer = buf

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(900, now)
  filter.frequency.exponentialRampToValueAtTime(2200, now + 0.14)
  filter.Q.value = 0.85

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.11, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

  src.connect(filter).connect(gain).connect(ctx.destination)
  src.start(now)
}

export function playStampSlam(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  const now = ctx.currentTime

  // Damped low thud
  const osc = ctx.createOscillator()
  const og = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(145, now)
  osc.frequency.exponentialRampToValueAtTime(46, now + 0.11)
  og.gain.setValueAtTime(0.32, now)
  og.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
  osc.connect(og).connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.13)

  // Contact paper slap
  const len = Math.floor(ctx.sampleRate * 0.045)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const ch = buf.getChannelData(0)
  for (let i = 0; i < len; i++) {
    ch[i] = (Math.random() * 2 - 1) * Math.exp((-i / len) * 8)
  }
  const src = ctx.createBufferSource()
  src.buffer = buf
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 1400
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(0.18, now)
  ng.gain.exponentialRampToValueAtTime(0.001, now + 0.045)
  src.connect(lp).connect(ng).connect(ctx.destination)
  src.start(now)
}

export function playBrassClick(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  const now = ctx.currentTime

  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(1650, now)
  osc.frequency.exponentialRampToValueAtTime(620, now + 0.032)
  g.gain.setValueAtTime(0.09, now)
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.035)
  osc.connect(g).connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.04)
}
