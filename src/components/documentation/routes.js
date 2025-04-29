import Documentation from 'src/components/documentation/Documentation.vue'
import { CONSTANTS } from 'src/constants'

export const documentationRoutes = [
  { path: CONSTANTS.ROUTES.DOCUMENTATION.PATH, name: CONSTANTS.ROUTES.DOCUMENTATION.NAME, component: Documentation }
]
