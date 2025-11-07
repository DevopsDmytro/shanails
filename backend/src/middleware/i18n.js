const i18n = require('../locales');

const i18nMiddleware = (req, res, next) => {
  // Get locale from query parameter, header, or default to Ukrainian
  const locale = req.query.lang || req.headers['accept-language'] || 'uk';
  
  // Set locale for this request
  i18n.setLocale(locale.split(',')[0].split('-')[0]);
  
  // Add t function to request object
  req.t = (key, params) => i18n.t(key, params);
  req.pluralize = (key, count, params) => i18n.pluralize(key, count, params);
  
  // Add locale info to response headers
  res.set('Content-Language', i18n.getCurrentLocale());
  
  next();
};

module.exports = i18nMiddleware;