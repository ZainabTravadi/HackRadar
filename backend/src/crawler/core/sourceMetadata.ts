import type { AdapterConfig, SourceClassification, SourceCapabilities } from './types';

export interface SourceMetadata {
  id: string;
  name: string;
  classification: SourceClassification;
  capabilities: SourceCapabilities;
  legalLimitations: string;
  productionReadiness: 'production-ready' | 'limited' | 'discovery-only';
}

export const SOURCE_METADATA: Record<string, SourceMetadata> = {
  devpost: {
    id: 'devpost',
    name: 'Devpost',
    classification: 'PRIMARY',
    capabilities: { pagination: true, detailPages: true, metadataQuality: 'full' },
    legalLimitations: 'Respect platform terms and rate limits.',
    productionReadiness: 'production-ready',
  },
  mlh: {
    id: 'mlh',
    name: 'MLH',
    classification: 'PRIMARY',
    capabilities: { pagination: true, detailPages: true, metadataQuality: 'full' },
    legalLimitations: 'Respect platform terms and rate limits.',
    productionReadiness: 'production-ready',
  },
  devfolio: {
    id: 'devfolio',
    name: 'Devfolio',
    classification: 'PRIMARY',
    capabilities: { pagination: true, detailPages: true, metadataQuality: 'full' },
    legalLimitations: 'Respect platform terms and rate limits.',
    productionReadiness: 'production-ready',
  },
  unstop: {
    id: 'unstop',
    name: 'Unstop',
    classification: 'PRIMARY',
    capabilities: { pagination: true, detailPages: true, metadataQuality: 'full' },
    legalLimitations: 'Respect platform terms and rate limits.',
    productionReadiness: 'production-ready',
  },
  dorahacks: {
    id: 'dorahacks',
    name: 'DoraHacks',
    classification: 'PRIMARY',
    capabilities: { pagination: true, detailPages: true, metadataQuality: 'full' },
    legalLimitations: 'Respect platform terms and rate limits.',
    productionReadiness: 'production-ready',
  },
  taikai: {
    id: 'taikai',
    name: 'TAIKAI',
    classification: 'PRIMARY',
    capabilities: { pagination: true, detailPages: true, metadataQuality: 'full' },
    legalLimitations: 'Respect platform terms and rate limits.',
    productionReadiness: 'production-ready',
  },
  hackerearth: {
    id: 'hackerearth',
    name: 'HackerEarth',
    classification: 'PRIMARY',
    capabilities: { pagination: true, detailPages: true, metadataQuality: 'full' },
    legalLimitations: 'Respect platform terms and rate limits.',
    productionReadiness: 'production-ready',
  },
  hack2skill: {
    id: 'hack2skill',
    name: 'Hack2Skill',
    classification: 'PRIMARY',
    capabilities: { pagination: true, detailPages: true, metadataQuality: 'full' },
    legalLimitations: 'Respect platform terms and rate limits.',
    productionReadiness: 'production-ready',
  },
  reskilll: {
    id: 'reskilll',
    name: 'Reskilll',
    classification: 'PRIMARY',
    capabilities: { pagination: true, detailPages: true, metadataQuality: 'full' },
    legalLimitations: 'Respect platform terms and rate limits.',
    productionReadiness: 'production-ready',
  },
  ethglobal: {
    id: 'ethglobal',
    name: 'ETHGlobal',
    classification: 'PRIMARY',
    capabilities: { pagination: true, detailPages: true, metadataQuality: 'full' },
    legalLimitations: 'Respect platform terms and rate limits.',
    productionReadiness: 'production-ready',
  },
  lablab: {
    id: 'lablab',
    name: 'lablab.ai',
    classification: 'PRIMARY',
    capabilities: { pagination: true, detailPages: true, metadataQuality: 'full' },
    legalLimitations: 'Respect platform terms and rate limits.',
    productionReadiness: 'production-ready',
  },
  angelhack: {
    id: 'angelhack',
    name: 'AngelHack',
    classification: 'PRIMARY',
    capabilities: { pagination: true, detailPages: true, metadataQuality: 'full' },
    legalLimitations: 'Respect platform terms and rate limits.',
    productionReadiness: 'production-ready',
  },
  eventbrite: {
    id: 'eventbrite',
    name: 'Eventbrite',
    classification: 'AGGREGATOR',
    capabilities: { pagination: true, detailPages: false, metadataQuality: 'partial' },
    legalLimitations: 'Do not scrape beyond public event listings or bypass site restrictions.',
    productionReadiness: 'limited',
  },
  meetup: {
    id: 'meetup',
    name: 'Meetup',
    classification: 'AGGREGATOR',
    capabilities: { pagination: true, detailPages: false, metadataQuality: 'partial' },
    legalLimitations: 'Do not scrape beyond public event listings or bypass site restrictions.',
    productionReadiness: 'limited',
  },
  luma: {
    id: 'luma',
    name: 'Luma',
    classification: 'AGGREGATOR',
    capabilities: { pagination: true, detailPages: false, metadataQuality: 'partial' },
    legalLimitations: 'Do not scrape beyond public event listings or bypass site restrictions.',
    productionReadiness: 'limited',
  },
  hackclub: {
    id: 'hackclub',
    name: 'Hack Club',
    classification: 'AGGREGATOR',
    capabilities: { pagination: true, detailPages: false, metadataQuality: 'partial' },
    legalLimitations: 'Do not scrape beyond public event listings or bypass site restrictions.',
    productionReadiness: 'limited',
  },
  university: {
    id: 'university',
    name: 'University Hackathons',
    classification: 'AGGREGATOR',
    capabilities: { pagination: true, detailPages: true, metadataQuality: 'partial' },
    legalLimitations: 'Do not scrape beyond public event listings or bypass site restrictions.',
    productionReadiness: 'limited',
  },
  github: {
    id: 'github',
    name: 'GitHub Events',
    classification: 'DISCOVERY',
    capabilities: { pagination: false, detailPages: false, metadataQuality: 'discovery' },
    legalLimitations: 'Only discover public announcements and enqueue canonical event URLs.',
    productionReadiness: 'discovery-only',
  },
  reddit: {
    id: 'reddit',
    name: 'Reddit',
    classification: 'DISCOVERY',
    capabilities: { pagination: false, detailPages: false, metadataQuality: 'discovery' },
    legalLimitations: 'Only discover public announcements and enqueue canonical event URLs.',
    productionReadiness: 'discovery-only',
  },
  discord: {
    id: 'discord',
    name: 'Discord',
    classification: 'DISCOVERY',
    capabilities: { pagination: false, detailPages: false, metadataQuality: 'discovery' },
    legalLimitations: 'Only discover public announcements and enqueue canonical event URLs.',
    productionReadiness: 'discovery-only',
  },
  telegram: {
    id: 'telegram',
    name: 'Telegram',
    classification: 'DISCOVERY',
    capabilities: { pagination: false, detailPages: false, metadataQuality: 'discovery' },
    legalLimitations: 'Only discover public announcements and enqueue canonical event URLs.',
    productionReadiness: 'discovery-only',
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    classification: 'DISCOVERY',
    capabilities: { pagination: false, detailPages: false, metadataQuality: 'discovery' },
    legalLimitations: 'Only discover public announcements and enqueue canonical event URLs.',
    productionReadiness: 'discovery-only',
  },
  twitter: {
    id: 'twitter',
    name: 'X (Twitter)',
    classification: 'DISCOVERY',
    capabilities: { pagination: false, detailPages: false, metadataQuality: 'discovery' },
    legalLimitations: 'Only discover public announcements and enqueue canonical event URLs.',
    productionReadiness: 'discovery-only',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    classification: 'DISCOVERY',
    capabilities: { pagination: false, detailPages: false, metadataQuality: 'discovery' },
    legalLimitations: 'Only discover public announcements and enqueue canonical event URLs.',
    productionReadiness: 'discovery-only',
  },
  google: {
    id: 'google',
    name: 'Google Events',
    classification: 'DISCOVERY',
    capabilities: { pagination: false, detailPages: false, metadataQuality: 'discovery' },
    legalLimitations: 'Only discover public announcements and enqueue canonical event URLs.',
    productionReadiness: 'discovery-only',
  },
};

export function getSourceMetadata(id: string): SourceMetadata {
  return SOURCE_METADATA[id] ?? {
    id,
    name: id,
    classification: 'DISCOVERY',
    capabilities: { pagination: false, detailPages: false, metadataQuality: 'discovery' },
    legalLimitations: 'No source-specific metadata available; treat as discovery-only.',
    productionReadiness: 'discovery-only',
  };
}

export function getSourceClassification(config: AdapterConfig | undefined, fallbackId: string): SourceClassification {
  return config?.sourceClassification ?? getSourceMetadata(fallbackId).classification;
}
