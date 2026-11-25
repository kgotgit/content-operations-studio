import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'
import {workflowsTool} from './workflowsTool'
import {startWorkflowDocumentAction} from './workflowActions'
import {SANITY_DATASET, SANITY_PROJECT_ID} from './env'

export default defineConfig({
  name: 'default',
  title: 'content-studio',

  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,

  plugins: [structureTool({structure}), visionTool()],

  tools: (prev) => [...prev, workflowsTool],

  document: {
    actions: (prev, context) => {
      if (context.schemaType === 'post') {
        return [...prev, startWorkflowDocumentAction]
      }

      return prev
    },
  },

  schema: {
    types: schemaTypes,
  },
})
