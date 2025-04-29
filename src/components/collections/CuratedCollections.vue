<template>
  <div class="curated-collections">
    <div v-loading="collectionsBusy" class="collections">
      <template v-if="!collectionsBusy">
        <collections-collection v-if="collections.length"></collections-collection>
        <empty-states v-else :page="CONSTANTS.EMPTY_STATES.COLLECTIONS"></empty-states>
      </template>
    </div>
  </div>
</template>

<script>
import {
  mapActions,
  mapGetters,
  mapMutations
} from 'vuex'
import { COLLECTIONS, RIGHT_PANEL } from 'src/store/storeModules'
import { COLLECTIONS_OPEN } from 'src/store/modules/rightPanel/getterTypes'
import { CLOSE } from 'src/store/modules/rightPanel/mutationTypes'
import { LOAD_COLLECTION, LOAD_COLLECTIONS } from 'src/store/modules/collections/actions'
import { GET_COLLECTIONS, GET_COLLECTIONS_BUSY } from 'src/store/modules/collections/getters'

import CollectionsCollection from 'src/components/collections/Collections'
import CollectionsButton from 'src/components/collections/CollectionsButton'
import EmptyStates from 'src/components/global/EmptyStates'
import ToolsHeader from 'src/components/global/ToolsHeader'

export default {
  name: 'curated-collections',

  components: {
    CollectionsCollection,
    CollectionsButton,
    EmptyStates,
    ToolsHeader
  },

  computed: {
    ...mapGetters(COLLECTIONS, {
      collectionsBusy: GET_COLLECTIONS_BUSY,
      collections: GET_COLLECTIONS
    }),

    ...mapGetters(RIGHT_PANEL, {
      collectionsOpen: COLLECTIONS_OPEN
    })
  },

  beforeMount () {
    // close right panel if it is open
    if (this.collectionsOpen) {
      this.closePanel()
    }
  },

  async mounted () {
    await this.loadCollections()
    await this.handleRouteChange()

    this.$watch('$route', (to, from) => {
      this.handleRouteChange()
    })
  },

  methods: {
    ...mapActions(COLLECTIONS, {
      doLoadCollection: LOAD_COLLECTION,
      doLoadCollections: LOAD_COLLECTIONS
    }),

    ...mapMutations(RIGHT_PANEL, {
      closePanel: CLOSE
    }),

    async handleRouteChange () {
      if (this.collections.length === 0) {
        await this.$router.push({
          name: this.CONSTANTS.ROUTES.CURATED.COLLECTIONS.NAME
        }).catch(err => {})
      } else if (_.isEmpty(this.$route.params) || this.$route.params.id === undefined) {
        // send user to first collection
        await this.$router.push({
          name: this.CONSTANTS.ROUTES.CURATED.COLLECTIONS.COLLECTION.NAME,
          params: { id: this.collections[0].id }
        }).catch(err => {}) // preventing duplicated navigation bug
        this.doLoadCollection({ collectionId: this.collections[0].id })
      } else {
        await this.$router.push({
          name: this.CONSTANTS.ROUTES.CURATED.COLLECTIONS.COLLECTION.NAME,
          params: { id: this.$route.params.id }
        }).catch(err => {})
        this.doLoadCollection({ collectionId: this.$route.params.id })
      }
    },

    async loadCollections () {
      try {
        await this.doLoadCollections({
          limit: this.CONSTANTS.LIMIT.COLLECTIONS,
          limitItems: this.CONSTANTS.LIMIT.COLLECTION_ITEMS
        })

        this.handleRouteChange()
      } catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: 'Unable to load collections',
          showClose: true,
          type: 'error'
        })
      }
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';

.el-loading-mask {
  height: 100vh;
  top: 40%;
}
</style>

<style lang="less" scoped>
  .curated-collections {
    min-height: calc(~'100vh - 60px');
  }
</style>
