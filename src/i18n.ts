/**
 * Simple i18n implementation for the plugin
 * Supports: English (en), German (de), Spanish (es)
 */

type TranslationKey =
  | 'copyAsMarkdown'
  | 'copyAsAsciiDoc'
  | 'copyAsHtml'
  | 'exportSuccess'
  | 'noBlockFound'
  | 'exportFailed';

type Translations = {
  [key in TranslationKey]: string;
};

const translations: Record<string, Translations> = {
  en: {
    copyAsMarkdown: '📄 Copy as Markdown',
    copyAsAsciiDoc: '📝 Copy as AsciiDoc',
    copyAsHtml: '🌐 Copy as HTML',
    exportSuccess: '✅ Exported {count} block(s) to {format} and copied to clipboard!',
    noBlockFound: '❌ No block found to export',
    exportFailed: '❌ Export failed: {error}',
  },
  de: {
    copyAsMarkdown: '📄 Als Markdown kopieren',
    copyAsAsciiDoc: '📝 Als AsciiDoc kopieren',
    copyAsHtml: '🌐 Als HTML kopieren',
    exportSuccess: '✅ {count} Block/Blöcke als {format} exportiert und in Zwischenablage kopiert!',
    noBlockFound: '❌ Kein Block zum Exportieren gefunden',
    exportFailed: '❌ Export fehlgeschlagen: {error}',
  },
  es: {
    copyAsMarkdown: '📄 Copiar como Markdown',
    copyAsAsciiDoc: '📝 Copiar como AsciiDoc',
    copyAsHtml: '🌐 Copiar como HTML',
    exportSuccess: '✅ {count} bloque(s) exportado(s) a {format} y copiado(s) al portapapeles!',
    noBlockFound: '❌ No se encontró ningún bloque para exportar',
    exportFailed: '❌ Error al exportar: {error}',
  },
};

let currentLocale: string = 'en';

/**
 * Initialize i18n by detecting user's preferred language from Logseq
 */
export async function initI18n(): Promise<void> {
  try {
    const userConfigs = await logseq.App.getUserConfigs();
    const preferredLanguage = userConfigs.preferredLanguage || 'en';
    
    // Map Logseq locale to our supported languages
    if (preferredLanguage.startsWith('de')) {
      currentLocale = 'de';
    } else if (preferredLanguage.startsWith('es')) {
      currentLocale = 'es';
    } else {
      currentLocale = 'en'; // Default fallback
    }
  } catch (error) {
    console.error('Failed to detect user language, falling back to English:', error);
    currentLocale = 'en';
  }
}

/**
 * Translate a key with optional parameter substitution
 * @param key - Translation key
 * @param params - Optional parameters to substitute in the translation
 * @returns Translated string
 */
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  let text = translations[currentLocale]?.[key] || translations.en[key];
  
  // Replace parameters in the format {paramName}
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      text = text.replace(`{${paramKey}}`, String(value));
    });
  }
  
  return text;
}

/**
 * Get current locale
 */
export function getCurrentLocale(): string {
  return currentLocale;
}

