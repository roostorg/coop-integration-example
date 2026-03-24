/**
 * Example Coop integration plugin with two signal types:
 * 1. Random Signal Selection – boolean, probability from org config (tests config saving).
 * 2. Random Score – numeric 0–100, threshold set in the rule (tests score vs threshold).
 */

import {
  assertModelCardHasRequiredSections,
  type CoopIntegrationPlugin,
  type IntegrationManifest,
  type ModelCard,
  type PluginSignalContext,
  type PluginSignalDescriptor,
} from '@roostorg/types';

const SIGNAL_TYPE_RANDOM_SELECTION = 'RANDOM_SIGNAL_SELECTION';
const SIGNAL_TYPE_RANDOM_SCORE = 'RANDOM_SCORE';
const INTEGRATION_ID = 'COOP_INTEGRATION_EXAMPLE';
const DEFAULT_TRUE_PERCENTAGE = 50;

const modelCard: ModelCard = {
  modelName: 'Coop Integration Example',
  version: '2.0.0',
  releaseDate: 'March 2026',
  sections: [
    {
      id: 'trainingData',
      title: 'Training Data',
      fields: [
        {
          label: 'Overview',
          value:
            'This reference integration does not use a trained model. Outputs are randomly generated for demonstration and testing of COOP rules, configuration, and UI only.',
        },
      ],
    },
    {
      id: 'policyAndTaxonomy',
      title: 'Policy and Taxonomy',
      fields: [
        {
          label: 'Scope',
          value:
            'Not a content policy engine. Signals are placeholders: boolean “coin flip” with configurable probability and a numeric random score for threshold exercises in rules.',
        },
      ],
    },
    {
      id: 'annotationMethodology',
      title: 'Annotation Methodology',
      fields: [
        {
          label: 'Method',
          value:
            'No human or automated labeling pipeline. Values are produced with Math.random() (or equivalent logic) at evaluation time.',
        },
      ],
    },
    {
      id: 'performanceBenchmarks',
      title: 'Performance and Benchmarks',
      fields: [
        {
          label: 'Benchmarks',
          value:
            'No precision, recall, or latency benchmarks apply. Do not use performance claims from this package in production decisions.',
        },
      ],
    },
    {
      id: 'biasAndLimitations',
      title: 'Bias and Limitations',
      fields: [
        {
          label: 'Limitations',
          value:
            'Outputs are uncorrelated with input content. Unsuitable for safety, compliance, or moderation decisions. For integration testing and developer learning only.',
        },
      ],
    },
    {
      id: 'implementationGuidance',
      title: 'Implementation Guidance',
      fields: [
        {
          label: 'Signals',
          value: `${SIGNAL_TYPE_RANDOM_SELECTION} (boolean; org config truePercentage 0–100). ${SIGNAL_TYPE_RANDOM_SCORE} (number 0–100; set threshold and above/below in the rule).`,
        },
        {
          label: 'Configuration',
          value:
            'Random Signal Selection requires org integration config (true percentage). Random Score requires no integration config.',
        },
        {
          label: 'Versioning',
          value:
            'modelCard.version and manifest.version identify this integration plugin release. They are independent of the @roostorg/types dependency major version (e.g. 2.x).',
        },
      ],
    },
    {
      id: 'relevantLinks',
      title: 'Relevant Links',
      fields: [
        {
          label: 'Repository',
          value: 'https://github.com/roostorg/coop-integration-example',
        },
        {
          label: 'Documentation',
          value: 'https://roostorg.github.io/coop/INTEGRATIONS_PLUGIN.html',
        },
      ],
    },
  ],
};

assertModelCardHasRequiredSections(modelCard);

const manifest: IntegrationManifest = {
  id: INTEGRATION_ID,
  name: 'Coop Integration Example',
  /** Same semver as modelCard.version: this plugin’s release, not @roostorg/types. */
  version: '2.0.0',
  description:
    'Example plugin with two signals: config-driven boolean and a numeric score you compare with a threshold in the rule.',
  docsUrl: 'https://roostorg.github.io/coop/INTEGRATIONS_PLUGIN.html',
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
      'Returns a random number from 0 up to (but not including) 100. Set a threshold in the rule (e.g. 50) and choose "above" or "below" to test numeric conditions.',
    docsUrl: null,
    recommendedThresholds: {
      highPrecisionThreshold: 50,
      highRecallThreshold: 50,
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
      // [0, 100) — same scale as percentages elsewhere in this plugin (e.g. truePercentage).
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
