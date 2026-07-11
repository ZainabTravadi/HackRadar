import { createAdapterAuditReport } from './audit';

console.info(createAdapterAuditReport([
  {
    source: 'Devpost',
    listing: '✅',
    pagination: '✅',
    detail: '⚠️',
    normalize: '✅',
    validate: '✅',
    dedupe: '✅',
    persistence: '✅',
    rawStorage: '✅',
    status: 'Production Ready',
  },
  {
    source: 'MLH',
    listing: '⚠️',
    pagination: '⚠️',
    detail: '⚠️',
    normalize: '⚠️',
    validate: '⚠️',
    dedupe: '⚠️',
    persistence: '⚠️',
    rawStorage: '⚠️',
    status: 'Partial',
  },
]));
