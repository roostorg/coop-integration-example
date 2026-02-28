/**
 * Example COOP integration plugin with two signal types:
 * 1. Random Signal Selection – boolean, probability from org config (tests config saving).
 * 2. Random Score – numeric [0, 1], threshold set in the rule (tests score vs threshold).
 */

import type {
  CoopIntegrationPlugin,
  IntegrationManifest,
  ModelCard,
  PluginSignalContext,
  PluginSignalDescriptor,
} from '@roostorg/types';

const SIGNAL_TYPE_RANDOM_SELECTION = 'RANDOM_SIGNAL_SELECTION';
const SIGNAL_TYPE_RANDOM_SCORE = 'RANDOM_SCORE';
const INTEGRATION_ID = 'COOP_INTEGRATION_EXAMPLE';
const DEFAULT_TRUE_PERCENTAGE = 50;

const modelCard: ModelCard = {
  modelName: 'COOP Integration Example',
  version: '1.0.0',
  releaseDate: '2026',
  sections: [
    {
      id: 'modelDetails',
      title: 'Model Details',
      fields: [
        { label: 'Model Name', value: 'COOP Integration Example' },
        {
          label: 'Purpose',
          value:
            'Example plugin with two signals: one uses org config (boolean), one returns a numeric score so you can set a threshold in the rule (over/under).',
        },
        {
          label: 'Signals',
          value: `${SIGNAL_TYPE_RANDOM_SELECTION} (boolean, config-driven) and ${SIGNAL_TYPE_RANDOM_SCORE} (number 0–1, threshold in rule).`,
        },
      ],
    },
    {
      id: 'technicalIntegration',
      title: 'Technical Integration',
      fields: [
        {
          label: 'Signal types',
          value: `${SIGNAL_TYPE_RANDOM_SELECTION}, ${SIGNAL_TYPE_RANDOM_SCORE}`,
        },
        {
          label: 'Config',
          value: 'truePercentage (0–100) for Random Signal Selection only; Random Score needs no config.',
        },
      ],
    },
  ],
};

const manifest: IntegrationManifest = {
  id: INTEGRATION_ID,
  name: 'COOP Integration Example',
  version: '1.0.0',
  description:
    'Example plugin with two signals: config-driven boolean and a numeric score you compare with a threshold in the rule.',
  docsUrl: 'https://github.com/roostorg/coop/tree/main/coop-integration-example',
  requiresConfig: true,
  configurationFields: [
    {
      key: 'truePercentage',
      label: 'True percentage (0–100)',
      required: true,
      inputType: 'text',
      placeholder: '50',
      description:
        'Used by Random Signal Selection only. Probability (0–100) that it returns true. Default 50 if not set.',
    },
  ],
  signalTypeIds: [SIGNAL_TYPE_RANDOM_SELECTION, SIGNAL_TYPE_RANDOM_SCORE],
  modelCard,
  logoPath: 'roost-example-logo.png',
  logoWithBackgroundPath: 'roost-example-with-background.png',
};

/** Parses truePercentage from org config; returns 0–100, default 50 if missing or invalid. */
function parseTruePercentage(config: Record<string, unknown>): number {
  const v = config.truePercentage;
  if (v === undefined || v === null) return DEFAULT_TRUE_PERCENTAGE;
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  if (!Number.isFinite(n)) return DEFAULT_TRUE_PERCENTAGE;
  return Math.max(0, Math.min(100, n));
}

function hasTruePercentageConfig(config: Record<string, unknown> | null | undefined): boolean {
  if (config == null) return false;
  const v = (config as { truePercentage?: unknown }).truePercentage;
  return v !== undefined && v !== null && String(v).trim() !== '';
}

function createRandomSignalSelectionDescriptor(
  context: PluginSignalContext,
): PluginSignalDescriptor {
  const { integrationId, getCredential } = context;
  const outputType = { scalarType: 'BOOLEAN' as const };

  return {
    id: { type: SIGNAL_TYPE_RANDOM_SELECTION },
    displayName: 'Coin Flip Selection',
    description:
      'Returns true or false at random, with a configurable probability (true percentage 0–100) from the integration config.',
    docsUrl: null,
    recommendedThresholds: {
      highPrecisionThreshold: 0.5,
      highRecallThreshold: 0.5,
    },
    supportedLanguages: 'ALL',
    pricingStructure: { type: 'FREE' },
    eligibleInputs: ['STRING', 'IMAGE', 'FULL_ITEM'],
    outputType,
    getCost: () => 0,
    needsMatchingValues: false,
    eligibleSubcategories: [],
    needsActionPenalties: false,
    integration: integrationId,
    allowedInAutomatedRules: true,

    async run(input: unknown): Promise<{ outputType: typeof outputType; score: boolean }> {
      const orgId = (input as { orgId?: string })?.orgId;
      if (typeof orgId !== 'string') {
        return { outputType, score: Math.random() < DEFAULT_TRUE_PERCENTAGE / 100 };
      }
      const config = await getCredential(orgId);
      const truePct = parseTruePercentage(config ?? {});
      const score = Math.random() * 100 < truePct;
      // Because outputType is { scalarType: 'BOOLEAN' }, Coop will use the output score as is for the condition.
      return { outputType, score };
    },

    async getDisabledInfo(orgId: string) {
      const config = await getCredential(orgId);
      if (hasTruePercentageConfig(config ?? undefined)) {
        return { disabled: false };
      }
      return {
        disabled: true,
        disabledMessage:
          'Configure the integration (True percentage 0–100) in Org settings to use this signal.',
      };
    },
  };
}

function createRandomScoreDescriptor(
  context: PluginSignalContext,
): PluginSignalDescriptor {
  const { integrationId } = context;
  const outputType = { scalarType: 'NUMBER' as const };

  return {
    id: { type: SIGNAL_TYPE_RANDOM_SCORE },
    displayName: 'Random Score',
    description:
      'Returns a random number between 0 and 1. Set a threshold in the rule (e.g. 0.5) and choose "above" or "below" to test numeric conditions.',
    docsUrl: null,
    recommendedThresholds: {
      highPrecisionThreshold: 0.5,
      highRecallThreshold: 0.5,
    },
    supportedLanguages: 'ALL',
    pricingStructure: { type: 'FREE' },
    eligibleInputs: ['STRING', 'IMAGE', 'FULL_ITEM'],
    outputType,
    getCost: () => 0,
    needsMatchingValues: false,
    eligibleSubcategories: [],
    needsActionPenalties: false,
    integration: integrationId,
    allowedInAutomatedRules: true,

    async run(
      _input: unknown,
    ): Promise<{ outputType: typeof outputType; score: number }> {
      // Returns a random number between 0 and 100.
      // Because outputType is { scalarType: 'NUMBER' }, Coop can take the score and compare it to a threshold in the rule.
      const score = Math.random() * 100;
      return { outputType, score };
    },

    async getDisabledInfo() {
      return { disabled: false };
    },
  };
}

function createSignals(
  context: PluginSignalContext,
): ReadonlyArray<{ signalTypeId: string; signal: PluginSignalDescriptor }> {
  return [
    {
      signalTypeId: SIGNAL_TYPE_RANDOM_SELECTION,
      signal: createRandomSignalSelectionDescriptor(context),
    },
    {
      signalTypeId: SIGNAL_TYPE_RANDOM_SCORE,
      signal: createRandomScoreDescriptor(context),
    },
  ];
}

const plugin: CoopIntegrationPlugin = {
  manifest,
  createSignals,
};

export default plugin;
export { manifest, createSignals };
