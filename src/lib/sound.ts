"use client";

import { settingsStore } from "@/lib/settings";

/**
 * 효과음. 소리 파일 없이 Web Audio로 짧은 소리를 합성합니다.
 */
export type SoundKind =
  "move" | "capture" | "check" | "castle" | "error" | "success";

let context: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    context ??= new AudioContext();
    if (context.state === "suspended") void context.resume();
    return context;
  } catch {
    return null;
  }
}

/** 나무 기물이 판에 닿는 듯한 짧은 소리 (걸러낸 잡음) */
function knock(ctx: AudioContext, at: number, gain: number, frequency: number) {
  const length = Math.floor(ctx.sampleRate * 0.06);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 4);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = frequency;
  filter.Q.value = 1.2;
  const volume = ctx.createGain();
  volume.gain.value = gain;
  source.connect(filter).connect(volume).connect(ctx.destination);
  source.start(at);
}

function tone(
  ctx: AudioContext,
  at: number,
  frequency: number,
  duration: number,
  gain: number,
) {
  const oscillator = ctx.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  const volume = ctx.createGain();
  volume.gain.setValueAtTime(gain, at);
  volume.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  oscillator.connect(volume).connect(ctx.destination);
  oscillator.start(at);
  oscillator.stop(at + duration);
}

export function playSound(kind: SoundKind): void {
  if (!settingsStore.get().sound) return;
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;

  switch (kind) {
    case "move":
      knock(ctx, now, 1.6, 1800);
      break;
    case "capture":
      knock(ctx, now, 2.2, 1100);
      knock(ctx, now + 0.05, 1.2, 1500);
      break;
    case "castle":
      knock(ctx, now, 1.6, 1800);
      knock(ctx, now + 0.09, 1.4, 1600);
      break;
    case "check":
      knock(ctx, now, 1.8, 1500);
      tone(ctx, now + 0.02, 880, 0.18, 0.08);
      break;
    case "error":
      tone(ctx, now, 220, 0.2, 0.12);
      break;
    case "success":
      tone(ctx, now, 660, 0.12, 0.08);
      tone(ctx, now + 0.1, 990, 0.2, 0.08);
      break;
  }
}

/** SAN을 보고 알맞은 효과음 종류를 고릅니다 */
export function soundForSan(san: string): SoundKind {
  if (san.includes("+") || san.includes("#")) return "check";
  if (san.startsWith("O-O")) return "castle";
  if (san.includes("x")) return "capture";
  return "move";
}
