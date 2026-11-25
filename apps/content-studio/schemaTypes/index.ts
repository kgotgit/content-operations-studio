import blockContent from './blockContent'
import category from './category'
import post from './post'
import author from './author'
import { navigationSchemaTypes } from '@content-ops/navigation-sanity'

export const schemaTypes = [post, author, category, blockContent, ...navigationSchemaTypes]

