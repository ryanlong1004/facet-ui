<template>
  <div class="content content-branding">
    <h2>Branding</h2>

    <template v-if="brandingFiles">
      <div
        :key="file.name"
        v-for="file in brandingFiles"
        v-loading="busy"
      >
        <upload-branding-image :fileType="file.name"></upload-branding-image>
      </div>
    </template>
    <p v-else class="no-results">There are no branding files for this site.</p>
  </div>
</template>

<script>
import {
  mapActions,
  mapGetters,
  mapMutations
} from 'vuex'
import { BRANDING } from 'src/store/storeModules'
import {
  GET_BRANDING_BUSY,
  GET_BRANDING_ERROR,
  GET_BRANDING_FILES
} from 'src/store/modules/admin/branding/getters'
import { FETCH_BRANDING_FILES } from 'src/store/modules/admin/branding/actions'
import UploadBrandingImage from 'src/components/admin/UploadBrandingImage.vue'

export default {
  name: 'admin-branding',

  components: {
    UploadBrandingImage
  },

  computed: {
    ...mapGetters(BRANDING, {
      brandingFiles: GET_BRANDING_FILES,
      busy: GET_BRANDING_BUSY,
      error: GET_BRANDING_ERROR
    })
  },

  async mounted () {
    await this.getFiles()
  },

  methods: {
    ...mapActions(BRANDING, {
      loadBrandingFiles: FETCH_BRANDING_FILES
    }),

    async getFiles () {
      try {
        await this.loadBrandingFiles()
      } catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: this.error,
          showClose: true,
          type: 'error'
        })
        console.error(err)
        throw err
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.admin-page {
  .content {
    &.content-branding {
      max-width: 900px;

      h2 {
        margin: 10px 0 20px;
      }
    }
  }
}
</style>
