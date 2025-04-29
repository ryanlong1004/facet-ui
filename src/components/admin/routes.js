import { scopedRouteGuard } from 'src/route-guards'
import { SCOPES } from 'src/plugins/ScopeEnforcer'
import Admin from './Admin'
import Activity from '../activity/Activity'
import Reindex from './Reindex.vue'
import Download from './Download'

import AdminAccount from './AdminAccount.vue'
import AdminActivity from './AdminActivity.vue'
import AdminBranding from './AdminBranding.vue'
import AdminCustomData from './AdminCustomData.vue'
import AdminDashboard from './AdminDashboard.vue'
import AdminDevelopers from './AdminDevelopers.vue'
import AdminLocation from './AdminLocation.vue'
import AdminPayment from './AdminPayment.vue'
import AdminPlan from './AdminPlan.vue'
import AdminInsights from './AdminInsights.vue'
import AdminProfile from './AdminProfile.vue'
import AdminStorage from './AdminStorage.vue'
import AdminSupport from './AdminSupport.vue'
import AdminUsersRolesGroups from './AdminUsersRolesGroups.vue'
import AdminUsers from './AdminUsers.vue'
import AdminRoles from './AdminRoles.vue'
import AdminGroups from './AdminGroups.vue'
import Analytics from 'src/components/analytics/AnalyticsDashboard.vue'
import JobHistory from 'src/components/admin/activity/JobHistory.vue'
import JobSummary from 'src/components/admin/activity/JobSummary.vue'

import ExtractorsNew from './extractors/Extractors.vue'
import ProfileForm from './extractors/ProfileForm.vue'
import SecreteExtractors from './extractors/SecretExtractors.vue'
import ExtractorProfile from './extractors/Profile.vue'

import CloudStorageConnect from './CloudStorageConnect.vue'
import ContentStorage from './ContentStorage.vue'

export const ADMIN_ROUTE = 'admin'

export const adminRoutes = [
  // Global Admin
  {
    component: Admin,
    name: ADMIN_ROUTE,
    path: '/admin',
    redirect: { name: 'admin-profile' },
    children: [
      {
        components: { content: AdminProfile },
        name: 'admin-profile',
        path: 'profile'
      },
      {
        components: { content: AdminAccount },
        name: 'admin-account',
        path: 'account',
        redirect: { name: 'admin-dashboard' },
        meta: {
          anyScope: [SCOPES.BILLING_ADMIN]
        }
      },
      {
        // if this route changes, you have to update the url in the SaaS application's "trial ending soon" email template
        components: { content: AdminDashboard },
        name: 'admin-dashboard',
        path: 'account/dashboard',
        meta: {
          anyScope: [SCOPES.BILLING_ADMIN]
        }
      },
      {
        components: { content: AdminPayment },
        name: 'admin-payment',
        path: 'account/payment',
        meta: {
          anyScope: [SCOPES.BILLING_ADMIN]
        }
      },
      {
        components: { content: AdminPlan },
        name: 'admin-plan',
        path: 'account/plan',
        meta: {
          anyScope: [SCOPES.BILLING_ADMIN]
        }
      },
      {
        components: { content: AdminDevelopers },
        name: 'admin-developers',
        path: 'developers'
      },
      {
        components: { content: AdminSupport },
        name: 'admin-support',
        path: 'support'
      },
      {
        components: { content: AdminUsersRolesGroups },
        name: 'admin-users-roles-groups',
        path: 'users-roles-groups',
        meta: {
          anyScope: [SCOPES.ADMIN_GROUPS, SCOPES.ADMIN_ROLES, SCOPES.ADMIN_USERS]
        },
        redirect: { name: 'admin-users' },
        children: [
          {
            components: { 'admin-route-content': AdminUsers },
            name: 'admin-users',
            path: 'users'
          },
          {
            components: { 'admin-route-content': AdminGroups },
            name: 'admin-groups',
            path: 'groups'
          },
          {
            components: { 'admin-route-content': AdminRoles },
            name: 'admin-roles',
            path: 'roles'
          },
        ],
      },
      {
        components: { content: AdminActivity },
        name: 'admin-activity',
        path: 'activity',
        redirect: { name: 'job-history' },
        children: [
          {
            components: { content: JobHistory },
            name: 'job-history',
            path: 'jobs'
          },
          {
            components: { content: JobSummary },
            name: 'job-summary',
            path: 'jobs/:id'
          }
        ],
        meta: {
          anyScope: [SCOPES.ADMIN_ACTIVITY]
        }
      },
      {
        components: { content: Activity },
        name: 'activity',
        path: 'activity-legacy',
        meta: {
          anyScope: [SCOPES.ADMIN_ACTIVITY]
        }
      },
      {
        components: { content: AdminBranding },
        name: 'admin-branding',
        path: 'branding',
        meta: {
          anyScope: [SCOPES.ADMIN_BRANDING]
        }
      },
      {
        components: { content: AdminStorage },
        name: 'admin-storage',
        path: 'storage',
        meta: {
          anyScope: [SCOPES.STORAGE_MANAGE, SCOPES.STORAGE_VIEW]
        }
      },
      {
        components: { content: CloudStorageConnect },
        name: 'admin-add-cloud-storage',
        path: 'storage/add',
        meta: {
          anyScope: [SCOPES.STORAGE_MANAGE]
        }
      },
      {
        components: { content: AdminLocation },
        name: 'admin-add-location',
        path: 'storage/add/:type',
        meta: {
          anyScope: [SCOPES.STORAGE_MANAGE]
        }
      },
      {
        components: { content: AdminLocation },
        name: 'admin-edit-location',
        path: 'storage/edit/:locationId',
        meta: {
          anyScope: [SCOPES.STORAGE_MANAGE]
        }
      },
      {
        // If this route changes, you have to update the redirects in the box.com and dropbox callback handlers in the data_api
        components: { content: ContentStorage },
        name: 'content-storage',
        path: 'storage/sync/:locationId',
        meta: {
          anyScope: [SCOPES.STORAGE_MANAGE]
        }
      },
      {
        components: { content: Analytics },
        name: 'analytics',
        path: 'analytics',
        meta: {
          anyScope: [SCOPES.ADMIN_ANALYTICS]
        }
      },
      {
        components: { content: AdminCustomData },
        name: 'admin-custom-data',
        path: 'custom-data',
        meta: {
          anyScope: [SCOPES.ADMIN_FIELDS]
        }
      }
    ].map(r => {
      return _.assign({}, r, {
        beforeEnter: scopedRouteGuard
      })
    })
  },

  {
    component: AdminInsights,
    meta: { anyScope: [SCOPES.EDIT_KEYWORDS] },
    name: 'insights',
    path: '/insights'
  },

  {
    component: ExtractorsNew,
    name: 'extractors',
    path: '/extractor-profiles',
    redirect: { name: 'extractor-secrets' },
    meta: {
      anyScope: [SCOPES.ADMIN_EXTRACTORS]
    },
    children: [
      {
        name: 'extractor-secrets',
        path: 'service-config/:provider?',
        components: {
          extractorProfileContents: SecreteExtractors
        }
      },
      {
        name: 'create-extractor-profile',
        path: 'create-profile',
        components: {
          extractorProfileContents: ProfileForm
        }
      },
      {
        name: 'extractor-profile',
        path: 'profile/:id',
        components: {
          extractorProfileContents: ExtractorProfile
        }
      }
    ]
  },

  { path: '/admin/reindex', name: 'reindex', component: Reindex, meta: { anyScope: [SCOPES.REINDEX, SCOPES.ADMIN_CACHE] } },
  { path: '/admin/download', name: 'download', component: Download }
]
