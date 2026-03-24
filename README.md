# @roostorg/coop-integration-example

Example [Coop](https://github.com/roostorg/coop) integration plugin. Reference repository showing how to build a custom integration and signals for use in Coop.

- **Integration config** – saving and loading per-org config (e.g. “True percentage”)
- **Routing rules** – using the plugin signal in conditions
- **Automated enforcement** – the same signal in enforcement rules

## What it provides

- **Integration:** `COOP_INTEGRATION_EXAMPLE`
- **Signal 1 – Random Signal Selection** (`RANDOM_SIGNAL_SELECTION`): Returns `true` or `false` at random. The probability (0–100%) comes from the org’s integration config (“True percentage”). Set e.g. `70` in Org settings → Integrations; the signal returns `true` about 70% of the time. Use this to test config saving and boolean conditions.
- **Signal 2 – Random Score** (`RANDOM_SCORE`): Returns a random number from **0 up to (but not including) 100**—the same 0–100 style as “True percentage,” so thresholds feel consistent. No integration config needed. In the rule builder set a **threshold** (e.g. `50`) and choose **above** or **below**. Use this to test numeric score conditions (e.g. “score ≥ 50” or “score &lt; 30”).

## Install

**From this repo (development):**

```bash
git clone https://github.com/roostorg/coop-integration-example.git
cd coop-integration-example
npm install
npm run build
```

**From npm:**

```bash
npm install @roostorg/coop-integration-example
```

## Configure in Coop

In your Coop `integrations.config.json` (or `INTEGRATIONS_CONFIG_PATH`), add:

**Local path (development):**  
If you cloned this repo next to your Coop server directory, use a path relative to the server (e.g. from `server/`):

```json
{
  "integrations": [
    { "package": "../coop-integration-example", "enabled": true }
  ]
}
```

**From npm:**

```json
{
  "integrations": [
    { "package": "@roostorg/coop-integration-example", "enabled": true }
  ]
}
```

Restart the Coop server so it loads the plugin.

## Use in the app

1. **Org settings → Integrations** – you should see Coop Integration Example”. Open it and set **True percentage (0–100)** (e.g. `70`) for Random Signal Selection. Save.
2. **Rules (routing or enforcement)** – when adding a condition:
   - **Random Signal Selection**: Pick that signal; the condition uses your configured percentage (true/false).
   - **Random Score**: Pick “Random Score”, then set a **threshold** on the 0–100 scale (e.g. `50`) and choose **above** or **below**. The rule compares the random score to your threshold.

## Contract

This package implements the Coop plugin contract from `@roostorg/types`:

- **Default export:** `CoopIntegrationPlugin` with `manifest` and `createSignals(context)`.
- **Manifest:** `id`, `name`, `version`, `requiresConfig`, `configurationFields`, `signalTypeIds`, `modelCard` (must include every section id in `REQUIRED_MODEL_CARD_SECTION_IDS` from `@roostorg/types`; call `assertModelCardHasRequiredSections(modelCard)` when registering).
- **createSignals:** Returns two descriptors:
  - `RANDOM_SIGNAL_SELECTION`: `run(input)` uses `context.getCredential(orgId)` for true percentage; returns `{ outputType: { scalarType: 'BOOLEAN' }, score: boolean }`.
  - `RANDOM_SCORE`: `run()` returns `{ outputType: { scalarType: 'NUMBER' }, score: number }` in **[0, 100)** (`Math.random() * 100`); no config. Threshold is set in the rule on the same scale (above/below).

## Publishing

CI runs on push/PR (build only). To publish to npm:

1. Create a [GitHub release](https://github.com/roostorg/coop-integration-example/releases) (tag e.g. `v1.0.1`). The **Publish to npm** workflow runs on release and runs `npm publish --access public`.
2. Add **NPM_TOKEN** in this repo’s secrets (Settings → Secrets and variables → Actions): an npm [automation token](https://docs.npmjs.com/creating-and-viewing-access-tokens) with publish permission for `@roostorg/coop-integration-example`.

You can also trigger **Publish to npm** manually from the Actions tab (workflow_dispatch).
