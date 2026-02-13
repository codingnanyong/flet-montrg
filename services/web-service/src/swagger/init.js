/**
 * Swagger UI initialization using global SwaggerUIBundle (loaded via script in index.html).
 */
import { API_BASE } from '../config/config.js';
import { createRequestInterceptor } from './requestInterceptor.js';

export function initSwaggerUI(specUrl, _title, onComplete, onFailure) {
  const SwaggerUIBundle = window.SwaggerUIBundle;
  const SwaggerUIStandalonePreset = window.SwaggerUIStandalonePreset;
  if (!SwaggerUIBundle || !SwaggerUIStandalonePreset) {
    const err = new Error('Swagger UI not loaded');
    onFailure?.(err);
    return null;
  }

  const base = API_BASE || (typeof window !== 'undefined' ? window.location.origin : '');
  const url = specUrl.startsWith('http') ? specUrl : base + (specUrl.startsWith('/') ? specUrl : '/' + specUrl);
  const interceptor = createRequestInterceptor();

  return SwaggerUIBundle({
    url,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    plugins: [SwaggerUIBundle.plugins.DownloadUrl],
    layout: 'StandaloneLayout',
    displayOperationId: false,
    showExtensions: false,
    showCommonExtensions: false,
    tryItOutEnabled: true,
    docExpansion: 'none',
    requestInterceptor: interceptor,
    onComplete: () => onComplete?.(),
    onFailure: (err) => onFailure?.(err),
  });
}
