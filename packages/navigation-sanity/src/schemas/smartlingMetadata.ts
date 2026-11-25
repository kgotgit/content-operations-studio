export const smartlingMetadata = {
  name: 'smartlingMetadata',
  title: 'Smartling Localization Metadata',
  type: 'object',
  fields: [
    {
      name: 'jobId',
      title: 'Smartling Job ID',
      type: 'string',
      readOnly: true,
    },
    {
      name: 'status',
      title: 'Translation Status',
      type: 'string',
      options: {
        list: [
          { title: 'Source (Canonical)', value: 'source' },
          { title: 'In Progress', value: 'in_progress' },
          { title: 'Translated', value: 'translated' },
        ],
      },
      initialValue: 'source',
    },
    {
      name: 'lastSyncedAt',
      title: 'Last Synced At',
      type: 'datetime',
      readOnly: true,
    },
  ],
};
