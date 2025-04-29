import _ from 'lodash'

import { requireOnboardingEnterGuard } from 'src/route-guards'
import Account from './Account.vue'
import AccountContent from './AccountContent.vue'
import AccountSetup from './AccountSetup.vue'
import AccountSuccess from './AccountSuccess.vue'
import AccountTeam from './AccountTeam.vue'
import ContentLocal from './ContentLocal.vue'

export const CURIO_ROUTE_NAME = 'curio'

export const curioRoutes = [
  {
    component: Account,
    name: CURIO_ROUTE_NAME,
    path: '/curio',
    redirect: { name: 'curio-account-setup' },
    children: [
      {
        components: { content: AccountContent },
        name: 'curio-account-content',
        path: 'content'
      },
      {
        components: { content: ContentLocal },
        name: 'curio-account-content-local',
        path: 'content/local'
      },
      {
        components: { content: AccountSetup },
        name: 'curio-account-setup',
        path: 'setup'
      },
      {
        components: { content: AccountSuccess },
        name: 'curio-account-success',
        path: 'success'
      },
      {
        components: { content: AccountTeam },
        name: 'curio-account-team',
        path: 'team'
      }
    ].map(r => {
      return _.assign({}, r, {
        beforeEnter: requireOnboardingEnterGuard
      })
    })
  }
]
