import {useEffect, useState} from 'react'
import {Box, Button, Card, Flex, Heading, Spinner, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'

interface WorkflowDefinitionRow {
  _id: string
  name?: string
  title?: string
  tag?: string
  version?: number
  _updatedAt?: string
}

interface WorkflowInstanceRow {
  _id: string
  definition?: string
  stage?: string
  completedAt?: string | null
  _updatedAt?: string
}

interface WorkflowsData {
  definitions: WorkflowDefinitionRow[]
  instances: WorkflowInstanceRow[]
}

/**
 * Fetches deployed workflow definitions and instances from the active dataset.
 */
async function fetchWorkflowsData(client: ReturnType<typeof useClient>): Promise<WorkflowsData> {
  const [definitions, instances] = await Promise.all([
    client.fetch<WorkflowDefinitionRow[]>(
      '*[_type == "sanity.workflow.definition"] | order(_updatedAt desc){_id, name, title, tag, version, _updatedAt}',
    ),
    client.fetch<WorkflowInstanceRow[]>(
      '*[_type == "sanity.workflow.instance"] | order(_updatedAt desc)[0...50]{_id, definition, stage, completedAt, _updatedAt}',
    ),
  ])

  return {definitions, instances}
}

/**
 * Renders a dedicated top-level Studio tool for workflow visibility.
 */
export function WorkflowsToolComponent() {
  const client = useClient({apiVersion: '2026-04-29'})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<WorkflowsData>({definitions: [], instances: []})

  /**
   * Refreshes the panel data from Content Lake.
   */
  const refresh = async () => {
    setLoading(true)
    setError(null)

    try {
      const next = await fetchWorkflowsData(client)
      setData(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  return (
    <Box padding={4}>
      <Stack space={4}>
        <Flex align="center" justify="space-between">
          <Heading size={1}>Workflows</Heading>
          <Button text="Refresh" mode="ghost" onClick={() => void refresh()} />
        </Flex>

        {loading ? (
          <Card padding={4} radius={2} shadow={1}>
            <Flex align="center" gap={3}>
              <Spinner muted />
              <Text>Loading workflow data...</Text>
            </Flex>
          </Card>
        ) : null}

        {error ? (
          <Card padding={4} radius={2} tone="critical">
            <Text>Failed to load workflows: {error}</Text>
          </Card>
        ) : null}

        {!loading && !error ? (
          <>
            <Card padding={4} radius={2} shadow={1}>
              <Stack space={3}>
                <Heading size={0}>Definitions ({data.definitions.length})</Heading>
                {data.definitions.length === 0 ? (
                  <Text muted>No workflow definitions found.</Text>
                ) : (
                  data.definitions.map((item) => (
                    <Card key={item._id} padding={3} radius={2} tone="transparent" border>
                      <Text>
                        {(item.name ?? 'unnamed')} v{item.version ?? '?'} | tag: {item.tag ?? '-'}
                      </Text>
                      <Text size={1} muted>
                        {item._id}
                      </Text>
                    </Card>
                  ))
                )}
              </Stack>
            </Card>

            <Card padding={4} radius={2} shadow={1}>
              <Stack space={3}>
                <Heading size={0}>Instances (latest {data.instances.length})</Heading>
                {data.instances.length === 0 ? (
                  <Text muted>No workflow instances found.</Text>
                ) : (
                  data.instances.map((item) => (
                    <Card key={item._id} padding={3} radius={2} tone="transparent" border>
                      <Text>
                        {item.definition ?? 'unknown'} | stage: {item.stage ?? '-'} | completed:{' '}
                        {item.completedAt ? 'yes' : 'no'}
                      </Text>
                      <Text size={1} muted>
                        {item._id}
                      </Text>
                    </Card>
                  ))
                )}
              </Stack>
            </Card>
          </>
        ) : null}
      </Stack>
    </Box>
  )
}

export const workflowsTool = {
  name: 'workflows',
  title: 'Workflows',
  component: WorkflowsToolComponent,
}
