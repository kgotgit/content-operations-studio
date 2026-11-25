const fs = require("fs");

const authors = [];
const categories = [];
const posts = [];

const authorNames = [
  "John Doe",
  "Jane Smith",
  "Alex Johnson",
  "Sarah Williams",
  "Michael Brown",
  "Emily Davis",
  "David Wilson",
  "Jessica Taylor",
  "Chris Anderson",
  "Olivia Martinez",
];

const categoryNames = [
  "Next.js",
  "React",
  "TypeScript",
  "Sanity",
  "AI",
  "DevOps",
  "Cloud",
  "JavaScript",
  "Web Development",
  "Productivity",
];

const loremParagraphs = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius turpis et commodo pharetra.",
  "Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula.",
  "Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula eu tempor congue.",
  "Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.",
  "Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante.",
  "Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra."
];

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function portableTextContent() {
  const count = Math.floor(Math.random() * 4) + 5;
  const blocks = [];

  blocks.push({
    _type: 'block',
    style: 'h2',
    children: [{ _type: 'span', text: 'Introduction' }]
  });

  for (let i = 0; i < count; i++) {
    blocks.push({
      _type: 'block',
      style: 'normal',
      children: [{
        _type: 'span',
        text: loremParagraphs[Math.floor(Math.random() * loremParagraphs.length)]
      }]
    });
  }

  return blocks;
}

authorNames.forEach((name, index) => {
  authors.push({
    _id: `author-${index + 1}`,
    _type: 'author',
    name,
    slug: { _type: 'slug', current: slugify(name) }
  });
});

categoryNames.forEach((title, index) => {
  categories.push({
    _id: `category-${index + 1}`,
    _type: 'category',
    title,
    description: `Articles about ${title}`
  });
});

for (let i = 1; i <= 100; i++) {
  const categoryIndex = (i - 1) % categoryNames.length;
  const authorIndex = (i - 1) % authorNames.length;

  posts.push({
    _id: `post-${i}`,
    _type: 'post',
    title: `${categoryNames[categoryIndex]} Guide ${i}`,
    slug: {
      _type: 'slug',
      current: `post-${i}-${slugify(categoryNames[categoryIndex])}`
    },
    excerpt: loremParagraphs[0],
    publishedAt: new Date(2026, i % 12, (i % 28) + 1).toISOString(),
    author: {
      _type: 'reference',
      _ref: `author-${authorIndex + 1}`
    },
    categories: [{
      _type: 'reference',
      _ref: `category-${categoryIndex + 1}`
    }],
    body: portableTextContent()
  });
}

const docs = [...authors, ...categories, ...posts];

fs.writeFileSync(
  'sample-blog-100.ndjson',
  docs.map(doc => JSON.stringify(doc)).join('\n')
);

console.log(`Generated ${docs.length} documents`);
