import {createEngine} from '@sanity/workflow-engine'
import {useClient} from 'sanity'
import {SANITY_DATASET, SANITY_PROJECT_ID, SANITY_WORKFLOW_TAG} from './env'

const WORKFLOW_RESOURCE = {
  type: 'dataset' as const,
  id: `${SANITY_PROJECT_ID}.${SANITY_DATASET}`,
}

/**
 * Creates a document action that starts the blog-review workflow for post documents.
 */
export function startWorkflowDocumentAction(props: any) {
  const {published, draft, onComplete} = props
  const client = useClient({apiVersion: '2026-04-29'})
  const source = draft ?? published

  if (!source?._id || source._type !== 'post') {
    return null
  }

  const documentId = String(source._id).replace(/^drafts\./, '')

  return {
    label: 'Start Workflow',
    title: 'Start blog-review workflow for this post',
    tone: 'positive' as const,
    onHandle: async () => {
      try {
        const engine = createEngine({
          client,
          tag: SANITY_WORKFLOW_TAG,
          workflowResource: WORKFLOW_RESOURCE,
        })

        await engine.startInstance({
          definition: 'blog-review',
          initialFields: [
            {
              type: 'subject',
              name: 'subject',
              value: {
                id: `dataset:${SANITY_PROJECT_ID}:${SANITY_DATASET}:${documentId}`,
                type: 'post',
              },
            },
          ],
        })

        window.alert('Workflow instance started successfully.')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        window.alert(`Failed to start workflow: ${message}`)
      } finally {
        onComplete()
      }
    },
  }
}
