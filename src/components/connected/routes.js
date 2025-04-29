import store from 'src/store/store'
import { LOCATIONS } from 'src/store/storeModules'
import { LOAD_LOCATIONS } from 'src/store/modules/locations/locations'
import { connectedCloudGuard } from 'src/route-guards'
import { SCOPES } from 'src/plugins/ScopeEnforcer'
import ConnectedDashboard from 'src/components/connected/ConnectedDashboard.vue'
import FileBrowser from 'src/components/connected/FileBrowser.vue'
import GMStorage from 'src/components/connected/GMStorage.vue'
import { CONSTANTS } from 'src/constants'

export const connectedRoutes = [
  {
    name: CONSTANTS.ROUTES.CONNECTED.NAME,
    component: ConnectedDashboard,
    path: CONSTANTS.ROUTES.CONNECTED.PATH,
    beforeEnter: connectedCloudGuard,
    children: [
      {
        name: CONSTANTS.ROUTES.CONNECTED.BOX.NAME,
        components: { content: FileBrowser },
        path: CONSTANTS.ROUTES.CONNECTED.BOX.PATH,
        async beforeEnter (to, from, next) {
          // if user goes to the direct link for Box or tries to refresh page, we need to check if they still have that location
          const clouds = await store.dispatch(`${LOCATIONS}/${LOAD_LOCATIONS}`)
          if (!clouds.some(location => location.kind === CONSTANTS.ROUTES.CONNECTED.BOX.NAME)) {
            return next('/404')
          }
          next()
        }
      },
      {
        name: CONSTANTS.ROUTES.CONNECTED.DROPBOX.NAME,
        components: { content: FileBrowser },
        path: CONSTANTS.ROUTES.CONNECTED.DROPBOX.PATH,
        async beforeEnter (to, from, next) {
          // if user goes to the direct link for Dropbox or tries to refresh page, we need to check if they still have that location
          const clouds = await store.dispatch(`${LOCATIONS}/${LOAD_LOCATIONS}`)
          if (!clouds.some(location => location.kind === CONSTANTS.ROUTES.CONNECTED.DROPBOX.NAME)) {
            return next('/404')
          }
          next()
        }
      },
      {
        name: CONSTANTS.ROUTES.CONNECTED.ONEDRIVE.NAME,
        components: { content: FileBrowser },
        path: CONSTANTS.ROUTES.CONNECTED.ONEDRIVE.PATH,
        async beforeEnter (to, from, next) {
          // if user goes to the direct link for OneDrive or tries to refresh page, we need to check if they still have that location
          const clouds = await store.dispatch(`${LOCATIONS}/${LOAD_LOCATIONS}`)
          if (!clouds.some(location => location.kind === CONSTANTS.ROUTES.CONNECTED.ONEDRIVE.NAME)) {
            return next('/404')
          }
          next()
        }
      },
      {
        name: CONSTANTS.ROUTES.CONNECTED.SHAREPOINT.NAME,
        components: { content: FileBrowser },
        path: CONSTANTS.ROUTES.CONNECTED.SHAREPOINT.PATH,
        async beforeEnter (to, from, next) {
          // if user goes to the direct link for SharePoint or tries to refresh page, we need to check if they still have that location
          const clouds = await store.dispatch(`${LOCATIONS}/${LOAD_LOCATIONS}`)
          if (!clouds.some(location => location.kind === CONSTANTS.ROUTES.CONNECTED.SHAREPOINT.NAME)) {
            return next('/404')
          }
          next()
        }
      },
      {
        name: CONSTANTS.ROUTES.CONNECTED.DROPBOXTEAMS.NAME,
        components: { content: FileBrowser },
        path: CONSTANTS.ROUTES.CONNECTED.DROPBOXTEAMS.PATH,
        async beforeEnter (to, from, next) {
          // if user goes to the direct link for Dropbox or tries to refresh page, we need to check if they still have that location
          const clouds = await store.dispatch(`${LOCATIONS}/${LOAD_LOCATIONS}`)
          if (!clouds.some(location => location.kind === CONSTANTS.ROUTES.CONNECTED.DROPBOXTEAMS.NAME)) {
            return next('/404')
          }
          next()
        }
      },
      {
        name: CONSTANTS.ROUTES.CONNECTED.GM_STORAGE.NAME,
        components: { content: GMStorage },
        path: CONSTANTS.ROUTES.CONNECTED.GM_STORAGE.PATH,
        async beforeEnter (to, from, next) {
          // if user goes to the direct link for GM storage or tries to refresh page, we need to check if they still have that location
          const clouds = await store.dispatch(`${LOCATIONS}/${LOAD_LOCATIONS}`)
          if (!clouds.some(location => location.kind === CONSTANTS.ROUTES.CONNECTED.GM_STORAGE.NAME)) {
            return next('/404')
          }
          next()
        },
        meta: {
          anyScope: [SCOPES.STORAGE_MANAGE]
        }
      }
    ]
  }
]
