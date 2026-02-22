/**
 * @module i18n
 * Internationalization support. Stores the user's preferred language
 * and provides UI label translations. AI prompts append language
 * instructions so the model responds in the chosen language.
 */

export const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'pt', name: 'Português' },
    { code: 'it', name: 'Italiano' },
    { code: 'nl', name: 'Nederlands' },
    { code: 'ru', name: 'Русский' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'ar', name: 'العربية' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'pl', name: 'Polski' },
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'th', name: 'ไทย' },
    { code: 'id', name: 'Bahasa Indonesia' },
    { code: 'uk', name: 'Українська' },
    { code: 'sv', name: 'Svenska' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

export function getStoredLanguage(): LanguageCode {
    return (localStorage.getItem('preferredLanguage') as LanguageCode) || 'en';
}

export function setStoredLanguage(code: LanguageCode): void {
    localStorage.setItem('preferredLanguage', code);
}

export function getLanguageName(code: LanguageCode): string {
    return SUPPORTED_LANGUAGES.find(l => l.code === code)?.name || 'English';
}

export function getLanguageInstruction(code: LanguageCode): string {
    if (code === 'en') return '';
    const name = getLanguageName(code);
    return `\n\nIMPORTANT: You MUST respond entirely in ${name} (${code}). All explanations, examples, and text should be in ${name}.`;
}
