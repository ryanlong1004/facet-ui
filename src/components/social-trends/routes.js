import SocialTrends from 'src/components/social-trends/SocialTrends.vue'
import { CONSTANTS } from 'src/constants'

export const socialTrendsRoutes = [
  {
    name: CONSTANTS.ROUTES.SOCIAL_TRENDS.NAME,
    component: SocialTrends,
    path: CONSTANTS.ROUTES.SOCIAL_TRENDS.PATH
  }
]
