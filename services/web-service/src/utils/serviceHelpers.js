/**
 * Service name display and filtering helpers.
 */
// Heroicons outline paths — 서비스별 고유 아이콘
const ICON_PATHS = {
  aggregation: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z', // chart-pie (집계)
  location: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', // map-pin
  realtime: 'M13 10V3L4 14h7v7l9-11h-7z', // lightning (실시간)
  thresholds: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', // chart-bar
  alerts: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', // exclamation-triangle (경고)
  'alert-subscription': 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z', // bookmark (구독/저장)
  'alert-notification': 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', // bell (알림)
  'sensor-threshold-mapping': 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4', // adjustments (센서-임계값 매핑)
};

export function toDisplayName(name, spec) {
  if (spec?.title) return spec.title;
  return name
    .replace(/-service$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function filterServices(availableServices, searchQuery) {
  const q = (searchQuery || '').toLowerCase().trim();
  return Object.keys(availableServices).filter((name) => {
    const spec = availableServices[name];
    const label = toDisplayName(name, spec);
    return (
      label.toLowerCase().includes(q) ||
      name.toLowerCase().includes(q)
    );
  });
}

export function serviceCardIconPath(name) {
  const key = name.replace(/-service$/, '');
  return ICON_PATHS[key] ?? 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4';
}
