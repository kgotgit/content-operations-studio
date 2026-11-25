/**
 * Reads a Studio environment variable with fallback support.
 */
function readEnv(name: string, fallback: string): string {
  const fromProcess = typeof process !== 'undefined' ? process.env?.[name] : undefined
  const fromImportMeta = (import.meta as ImportMeta & {env?: Record<string, string | undefined>})
    .env?.[name]

  return fromProcess || fromImportMeta || fallback
}

export const SANITY_PROJECT_ID = readEnv('SANITY_STUDIO_PROJECT_ID', '2wl7t8z4')
export const SANITY_DATASET = readEnv('SANITY_STUDIO_DATASET', 'dev')
export const SANITY_CLI_DATASET = readEnv('SANITY_STUDIO_CLI_DATASET', SANITY_DATASET)
export const SANITY_WORKFLOW_TAG = readEnv('SANITY_STUDIO_WORKFLOW_TAG', 'dev')
export const SANITY_WORKFLOW_DEV_DATASET = readEnv(
  'SANITY_STUDIO_WORKFLOW_DEV_DATASET',
  SANITY_DATASET,
)
export const SANITY_WORKFLOW_PROD_DATASET = readEnv(
  'SANITY_STUDIO_WORKFLOW_PROD_DATASET',
  'production',
)
