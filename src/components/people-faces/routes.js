import PeopleFacesAdmin from 'src/components/people-faces/PeopleFacesAdmin.vue'
import { CONSTANTS } from 'src/constants'

export const peopleFacesRoutes = [
  { path: CONSTANTS.ROUTES.PEOPLE_FACES.PATH, name: CONSTANTS.ROUTES.PEOPLE_FACES.NAME, component: PeopleFacesAdmin }
]
