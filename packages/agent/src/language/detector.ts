
import type { SupportedLanguage } from '@voiceai/shared';
import { SUPPORTED_LANGUAGES } from '@voiceai/shared';


export function normalizeLanguage(detectedLang: string): SupportedLanguage {
  const lower = detectedLang.toLowerCase();

  if (lower.startsWith('en')) return 'en';
  if (lower.startsWith('hi')) return 'hi';
  if (lower.startsWith('ta')) return 'ta';

  return 'en';
}


export class LanguageTracker {
  private history: SupportedLanguage[] = [];
  private currentLang: SupportedLanguage;
  private windowSize: number;

  constructor(initialLang: SupportedLanguage = 'en', windowSize = 3) {
    this.currentLang = initialLang;
    this.windowSize = windowSize;
  }

  
  recordDetection(lang: string): SupportedLanguage {
    const normalized = normalizeLanguage(lang);
    this.history.push(normalized);

    // only recent history
    if (this.history.length > this.windowSize * 2) {
      this.history = this.history.slice(-this.windowSize);
    }

    const recent = this.history.slice(-this.windowSize);
    if (recent.length >= this.windowSize) {
      const counts: Record<string, number> = {};
      for (const l of recent) {
        counts[l] = (counts[l] || 0) + 1;
      }

      const majority = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (majority && majority[1] >= Math.ceil(this.windowSize / 2)) {
        const newLang = majority[0] as SupportedLanguage;
        if (newLang !== this.currentLang) {
          console.log(` language switched: ${this.currentLang} → ${newLang}`);
          this.currentLang = newLang;
        }
      }
    }

    return this.currentLang;
  }

  getCurrentLanguage(): SupportedLanguage {
    return this.currentLang;
  }
}
