<template>
  <div v-loading="isBusy">
    <h2>You are about to remove multiple files</h2>
    <p>Deleting the selected files will ONLY remove them from the Wasabi AiR™ platform. You will need to
      manually remove them from your connected storage location/container.</p>
    <p>Additionally, depending on the size of your index and the number of files being deleted, it may
      take up to a few minutes for the files to be deleted from search results.</p>
    <h4>Are you sure you want to remove these files from Wasabi AiR™?</h4>
    <el-alert v-if="errorMessage.length > 0" :title="errorMessage" type="error" effect="dark"></el-alert>
    <el-button type="primary" size="mini" @click.stop="deleteSelectedItems" :disabled="isBusy">Yes, remove selected files</el-button>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

import { BULK_ACTIONS } from 'src/store/storeModules'
import {
  //getters
  IS_BUSY,
  // actions
  DELETE_SELECTED_ITEMS
} from 'src/store/modules/bulk-actions'


export default {
  name: 'bulk-delete',
  data () {
    return {
      errorMessage: ''
    }
  },
  computed: {
    ...mapGetters(BULK_ACTIONS, {
      isBusy: IS_BUSY
    })
  },
  methods: {
    ...mapActions(BULK_ACTIONS, {
      doDelete: DELETE_SELECTED_ITEMS
    }),
    async deleteSelectedItems () {
      this.errorMessage = ''
      try {
        await this.doDelete()
        this.$notify({
          title: `Files deleted`,
          message: `It may take a few minutes to be fully removed depending on the size of your search index.`,
          type: 'success'
        });
      } catch (err) {
        console.error(err)
        this.errorMessage = 'There was a problem deleting one or more items, please try again.'
      }
    }
  }
}
</script>
