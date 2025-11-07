const fs = require('fs');
const path = require('path');

class Localization {
  constructor() {
    this.locales = {};
    this.currentLocale = 'uk';
    this.loadLocales();
  }

  loadLocales() {
    const localesDir = path.join(__dirname);
    
    try {
      const files = fs.readdirSync(localesDir).filter(file => file.endsWith('.json'));
      
      files.forEach(file => {
        const locale = path.basename(file, '.json');
        const content = fs.readFileSync(path.join(localesDir, file), 'utf8');
        this.locales[locale] = JSON.parse(content);
      });
    } catch (error) {
      console.error('Error loading locales:', error);
    }
  }

  setLocale(locale) {
    if (this.locales[locale]) {
      this.currentLocale = locale;
    } else {
      console.warn(`Locale ${locale} not found, using default ${this.currentLocale}`);
    }
  }

  t(key, params = {}) {
    const keys = key.split('.');
    let translation = this.locales[this.currentLocale];

    for (const k of keys) {
      if (translation && translation[k]) {
        translation = translation[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    if (typeof translation === 'string') {
      return this.interpolate(translation, params);
    }

    return translation;
  }

  interpolate(text, params) {
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      if (params[key] !== undefined) {
        return params[key];
      }
      return match;
    });
  }

  pluralize(key, count, params = {}) {
    const pluralKey = `${key}_${this.getPluralForm(count)}`;
    const translation = this.t(pluralKey, { ...params, count });
    
    if (translation !== pluralKey) {
      return translation;
    }

    // Fallback to singular form
    return this.t(key, { ...params, count });
  }

  getPluralForm(count) {
    // Ukrainian pluralization rules
    const tens = count % 100;
    const ones = count % 10;
    
    if (ones === 1 && tens !== 11) {
      return 'one';
    } else if (ones >= 2 && ones <= 4 && (tens < 10 || tens >= 20)) {
      return 'few';
    } else {
      return 'many';
    }
  }

  getAvailableLocales() {
    return Object.keys(this.locales);
  }

  getCurrentLocale() {
    return this.currentLocale;
  }
}

const i18n = new Localization();

module.exports = i18n;