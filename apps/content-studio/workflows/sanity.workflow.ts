import {defineWorkflowConfig} from '@sanity/workflow-engine/define'
import {blogReview} from './blog-post-review'

const workflowConfig = defineWorkflowConfig({
  deployments: [
    {
      name: 'dev',
      tag: 'dev',
      expectedMinReaderModel: 10,
      workflowResource: {type: 'dataset', id: '2wl7t8z4.dev'},
      definitions: [blogReview],
    },
    {
      name: 'sit',
      tag: 'sit',
      expectedMinReaderModel: 10,
      workflowResource: {type: 'dataset', id: '2wl7t8z4.dev'},
      definitions: [blogReview],
    },
    {
      name: 'qae',
      tag: 'qae',
      expectedMinReaderModel: 10,
      workflowResource: {type: 'dataset', id: '2wl7t8z4.dev'},
      definitions: [blogReview],
    },
    {
      name: 'pte',
      tag: 'pte',
      expectedMinReaderModel: 10,
      workflowResource: {type: 'dataset', id: '2wl7t8z4.dev'},
      definitions: [blogReview],
    },
    {
      name: 'prod',
      tag: 'prod',
      expectedMinReaderModel: 10,
      workflowResource: {type: 'dataset', id: '2wl7t8z4.production'},
      definitions: [blogReview],
    },
  ],
})

export default workflowConfig
