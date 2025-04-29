import _ from 'lodash'
import { mapActions, mapGetters } from 'vuex'
import { CONSTANTS } from 'src/constants'
import { LOCATIONS, SESSION } from 'src/store/storeModules'
import { GET_LOCATIONS } from 'src/store/modules/locations/locations'
import { GET_IS_SAAS, GET_IS_LOADNSTORE } from 'src/store/modules/session/session'

export default {
  computed: {
    ...mapGetters(LOCATIONS, {
      locations: GET_LOCATIONS
    }),

    hasBox () {
      return this.locations.some(location => location.kind === CONSTANTS.ROUTES.CONNECTED.BOX.NAME)
    },

    hasBoxDropboxGMStorage () {
      return this.locations.some(location => (location.kind === CONSTANTS.ROUTES.CONNECTED.BOX.NAME) || (location.kind === CONSTANTS.ROUTES.CONNECTED.DROPBOX.NAME) || (location.kind === CONSTANTS.ROUTES.CONNECTED.GM_STORAGE.NAME))
    },

    hasDropbox () {
      return this.locations.some(location => location.kind === CONSTANTS.ROUTES.CONNECTED.DROPBOX.NAME)
    },

    hasOneDrive () {
      return this.locations.some(location => location.kind === CONSTANTS.ROUTES.CONNECTED.ONEDRIVE.NAME)
    },

    hasSharePoint () {
      return this.locations.some(location => location.kind === CONSTANTS.ROUTES.CONNECTED.SHAREPOINT.NAME)
    },

    hasDropboxTeams () {
      return this.locations.some(location => location.kind === CONSTANTS.ROUTES.CONNECTED.DROPBOXTEAMS.NAME)
    },

    hasLoadNStore () {
      return this.locations.some(location => location.kind === CONSTANTS.ROUTES.CONNECTED.GM_STORAGE.NAME)
    },

    isSaasPlatform () {
      return this.$store.getters[`${SESSION}/${GET_IS_SAAS}`] === true
    },

    isEnterpriseLoadstore () {
      return this.$store.getters[`${SESSION}/${GET_IS_LOADNSTORE}`] === true
    }
  }
}
