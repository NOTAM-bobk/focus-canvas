// Small, dependency-free helpers shared across the app.
import { useEffect, useState } from 'react';

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

export const todayKey = () => new Date().toISOString().slice(0, 10);

export const readState = (key, fallback) => {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const useLocalStorageState = (key, initial) => {
  const [value, setValue] = useState(() => {
    const stored = readState(key, undefined);
    if (stored !== undefined) return stored;
    return typeof initial === 'function' ? initial() : initial;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value]);

  return [value, setValue];
};

export const formatClock = (totalSeconds) => {
  const safe = Math.max(0, Math.ceil(totalSeconds));
  const minutes = String(Math.floor(safe / 60)).padStart(2, '0');
  const seconds = String(safe % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export const formatStopwatch = (totalSeconds) => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = String(Math.floor((safe % 3600) / 60)).padStart(2, '0');
  const seconds = String(safe % 60).padStart(2, '0');
  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
};

export const countdownParts = (target) => {
  const diff = new Date(target).getTime() - Date.now();
  const forward = Math.max(0, diff);
  return {
    days: Math.floor(forward / 86400000),
    hours: Math.floor((forward % 86400000) / 3600000),
    minutes: Math.floor((forward % 3600000) / 60000),
    seconds: Math.floor((forward % 60000) / 1000),
    done: diff <= 0,
  };
};

export const greeting = (hour) => {
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const BREATH_CYCLE = 16000;
export const breathPhase = (elapsed) => {
  const p = ((elapsed % BREATH_CYCLE) + BREATH_CYCLE) % BREATH_CYCLE;
  if (p < 4000) return 'Inhale';
  if (p < 8000) return 'Hold';
  if (p < 12000) return 'Exhale';
  return 'Hold';
};

/* Temperature helpers (Celsius stored, switchable display). */
export const toF = (value) => (value == null ? null : (value * 9) / 5 + 32);
export const temp = (value, unit) => (value == null ? '—' : `${Math.round(unit === 'f' ? toF(value) : value)}°`);

export const VALID_PROTOCOL = /^https?:\/\//i;
export const normalizeUrl = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return VALID_PROTOCOL.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export const addDays = (dateStr, days) => {
  const base = dateStr ? new Date(`${String(dateStr).slice(0, 10)}T00:00:00`) : new Date();
  return new Date(base.getTime() + days * 86400000).toISOString().slice(0, 10);
};

export const SOUND_SECONDS = 6;

// Synthesise one seamless loop of shaped noise for an ambience preset.
export const fillNoise = (data, type, sampleRate) => {
  const length = data.length;
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  let brown = 0;
  let rumble = 0;
  let pop = 0;
  const tau = Math.PI * 2;

  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    // Pink noise via the Paul Kellet filter bank.
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
    // Brown noise.
    brown = (brown + 0.02 * white) / 1.02;
    const t = i / sampleRate;
    let value;

    switch (type) {
      case 'pink':
        value = pink * 1.6;
        break;
      case 'brown':
        value = brown * 3.6;
        break;
      case 'rain':
        value = pink * 0.7 + white * 0.12;
        break;
      case 'storm': {
        // Low rumble plus one soft thunder swell per loop.
        rumble = (rumble + 0.004 * white) / 1.004;
        const boom = Math.max(0, (Math.sin(tau * (t / SOUND_SECONDS) - Math.PI / 2) + 1) / 2 - 0.82) / 0.18;
        value = (pink * 0.55 + white * 0.09) * 0.9 + rumble * 7 * boom;
        break;
      }
      case 'ocean': {
        const swell = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(tau * (t / 3)));
        value = brown * 4 * swell + pink * 0.3 * swell;
        break;
      }
      case 'wind': {
        const gust = 0.5 + 0.5 * Math.sin(tau * (t / 3) + 1);
        value = (pink * 1.1 + brown * 1.8) * (0.35 + 0.65 * gust);
        break;
      }
      case 'fire': {
        if (Math.random() < 0.00008) pop += (Math.random() * 2 - 1) * 0.9;
        pop *= 0.9985;
        value = brown * 2.6 + pink * 0.3 + pop;
        break;
      }
      case 'night': {
        const drift = 0.7 + 0.3 * Math.sin(tau * (t / SOUND_SECONDS));
        value = (brown * 2.3 + pink * 0.4) * drift;
        break;
      }
      case 'white':
      default:
        value = white * 0.7;
        break;
    }

    data[i] = clamp(value, -1, 1);
  }

  // Crossfade the tail into the head so the loop point is inaudible.
  const fade = Math.min(Math.floor(sampleRate * 0.4), Math.floor(length / 4));
  for (let i = 0; i < fade; i += 1) {
    const mix = i / fade;
    const tail = length - fade + i;
    data[tail] = data[tail] * (1 - mix) + data[i] * mix;
  }
};
