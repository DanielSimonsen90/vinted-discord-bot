import fs from 'fs';
import path from 'path';
import Logger from '../utils/logger.js';
import { Locale } from 'discord.js';

const __dirname = path.resolve();

/**
 * Don't dare to touch this file or you will be cursed by the gods of localization.
 */
class LanguageService {
  static localesDir = path.join(__dirname, 'locales'); // Adjust path as needed
  static languages = {};
  static fallbackLanguage = 'en-GB';

  static initialize() {
    fs.readdirSync(this.localesDir).forEach(file => {
      const filePath = path.join(this.localesDir, file);
      const lang = path.basename(file, '.json');
      Logger.debug(`Loading language file for ${lang}`);
      this.languages[lang] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    });
  }

  static getText(lang, key) {
    // Check if the language exists
    if (!this.languages[lang]) {
      console.warn(`Language ${lang} not found, falling back to ${this.fallbackLanguage}`);
      lang = this.fallbackLanguage;
    }

    // Check if the key exists in the specified language
    if (this.languages[lang]?.[key]) return this.languages[lang][key];

    // Fall back to the default language if the key is not found in the specified language
    if (lang !== this.fallbackLanguage && this.languages[this.fallbackLanguage]?.[key]) {
      return this.languages[this.fallbackLanguage][key];
    }

    return `Missing translation for "${key}"`;
  }

  /**
   * 
   * @param {Locale} locale 
   */
  constructor(locale) {
    this.locale = locale;

    this.t = this.t.bind(this);
    this.tWithIcon = this.tWithIcon.bind(this);
  }

  /**
   * @param {string} key
   * @param {Record<string, string> | undefined} values
   */
  t(key, values = {}) {
    try {
      const template = LanguageService.getText(this.locale, key);
      return this.formatString(template, values);
    } catch (error) {
      console.error(error);
      return `Missing translation for "${key}" in "${this.locale}"`;
    }
  }

  /**
 * @param {string} key 
 * @param {string} icon 
 * @param {Record<string, string> | undefined} values 
 */
  tWithIcon(key, icon, values = {}) {
    return `${icon} ${this.t(key, values)}`;
  }

  /**
   * @private
   * @param {string} template string template
   * @param {object} values Value keys to replace with the actual values
   * @returns {string} The formatted string
   */
  formatString(template, values) {
    return template.replace(/{(\w+)}/g, (_, placeholder) => (
      values[placeholder] !== undefined ? values[placeholder] : `{${placeholder}}`
    ));
  }
}

// Initialize the languages when the module is loaded
LanguageService.initialize();

export default LanguageService;
