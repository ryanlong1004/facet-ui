import CuratedDashboard from 'src/components/curated/CuratedDashboard.vue'
import Categories from 'src/components/curated/Categories.vue'
import CuratedCollections from 'src/components/collections/CuratedCollections.vue'
import SharedCollection from 'src/components/collections/SharedCollection.vue'
import { CONSTANTS } from 'src/constants'

export const curatedRoutes = [
  {
    name: CONSTANTS.ROUTES.CURATED.NAME,
    component: CuratedDashboard,
    path: '/curated',
    redirect: { name: CONSTANTS.ROUTES.CURATED.CATEGORIES.NAME },
    children: [
      {
        name: CONSTANTS.ROUTES.CURATED.CATEGORIES.NAME,
        components: { content: Categories },
        path: 'categories',
        children: [{
          name: CONSTANTS.ROUTES.CURATED.CATEGORIES.CATEGORY.NAME,
          components: { content: Categories },
          path: ':slug'
        }]
      },
      {
        name: CONSTANTS.ROUTES.CURATED.COLLECTIONS.NAME,
        components: { content: CuratedCollections },
        path: 'collections',
        children: [{
          name: CONSTANTS.ROUTES.CURATED.COLLECTIONS.COLLECTION.NAME,
          components: { content: CuratedCollections },
          path: ':id'
        }]
      }
    ]
  },
  {
    name: 'share-collection',
    path: '/shared-collection/:collectionId',
    component: SharedCollection
  }
]
