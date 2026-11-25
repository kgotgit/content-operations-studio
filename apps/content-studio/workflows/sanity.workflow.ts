import {defineWorkflowConfig} from '@sanity/workflow-engine/define'
import {blogReview} from './blog-post-review'
import {
  SANITY_PROJECT_ID,
  SANITY_WORKFLOW_DEV_DATASET,
  SANITY_WORKFLOW_PROD_DATASET,
} from '../env'

const devResourceId = `${SANITY_PROJECT_ID}.${SANITY_WORKFLOW_DEV_DATASET}`
const prodResourceId = `${SANITY_PROJECT_ID}.${SANITY_WORKFLOW_PROD_DATASET}`

const workflowConfig = defineWorkflowConfig({
  deployments: [
    {
      name: 'dev',
      tag: 'dev',
      expectedMinReaderModel: 10,
      workflowResource: {type: 'dataset', id: devResourceId},
      definitions: [blogReview],
    },
    {
      name: 'sit',
      tag: 'sit',
      expectedMinReaderModel: 10,
      workflowResource: {type: 'dataset', id: devResourceId},
      definitions: [blogReview],
    },
    {
      name: 'qae',
      tag: 'qae',
      expectedMinReaderModel: 10,
      workflowResource: {type: 'dataset', id: devResourceId},
      definitions: [blogReview],
    },
    {
      name: 'pte',
      tag: 'pte',
      expectedMinReaderModel: 10,
      workflowResource: {type: 'dataset', id: devResourceId},
      definitions: [blogReview],
    },
    {
      name: 'prod',
      tag: 'prod',
      expectedMinReaderModel: 10,
      workflowResource: {type: 'dataset', id: prodResourceId},
      definitions: [blogReview],
    },
  ],
})

export default workflowConfig
