import {
  defineAction,
  defineActivity,
  defineField,
  defineStage,
  defineTransition,
  defineWorkflow,
} from '@sanity/workflow-engine/define'
export const blogReview = defineWorkflow({
  name: 'blog-review',
  title: 'Blog review',
  description: 'Takes one blog from drafting, through an editor review, to approved.',
  initialStage: 'drafting',
  fields: [
    defineField({
      type: 'subject',
      name: 'subject',
      title: 'Blog',
      required: true,
      description: 'The document this instance moves through the stages.',
      initialValue: {type: 'input'},
    }),
  ],
  stages: [
    defineStage({
      name: 'drafting',
      title: 'Drafting',
      description: 'The writer is working on the blog.',
      activities: [
        defineActivity({
          name: 'write',
          title: 'Write the blog',
          actions: [
            defineAction({
              name: 'submit',
              title: 'Submit for review',
              status: 'done',
            }),
          ],
        }),
      ],
      transitions: [defineTransition({name: 'to-review', title: 'Send to review', to: 'review'})],
    }),
    defineStage({
      name: 'review',
      title: 'Editorial review',
      description: 'An editor reads the blog and approves it.',
      activities: [
        defineActivity({
          name: 'sign-off',
          title: 'Review the blog',
          actions: [
            defineAction({
              name: 'approve',
              title: 'Approve',
              status: 'done',
            }),
          ],
        }),
      ],
      transitions: [
        defineTransition({name: 'to-approved', title: 'Approve and finish', to: 'approved'}),
      ],
    }),
    defineStage({
      name: 'approved',
      title: 'Approved',
      description: 'The blog is approved. Nothing more to do here.',
    }),
  ],
})