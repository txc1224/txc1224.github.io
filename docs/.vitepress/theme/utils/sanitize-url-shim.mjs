import * as sanitizeUrlModule from '@braintree/sanitize-url/dist/index.js';

const sanitizeUrl =
  sanitizeUrlModule.sanitizeUrl || sanitizeUrlModule.default?.sanitizeUrl || sanitizeUrlModule.default;

export { sanitizeUrl };
export default sanitizeUrl;
