import Search from 'src/components/search/Search.vue'
import SavedSearches from 'src/components/search/SavedSearches.vue'
import { CONSTANTS } from 'src/constants'

export const searchRoutes = [
  {
    name: CONSTANTS.ROUTES.SEARCH.NAME,
    component: Search,
    path: CONSTANTS.ROUTES.SEARCH.PATH
  },
  {
    name: CONSTANTS.ROUTES.SAVED_SEARCHES.NAME,
    component: SavedSearches,
    path: CONSTANTS.ROUTES.SAVED_SEARCHES.PATH
  }
]
