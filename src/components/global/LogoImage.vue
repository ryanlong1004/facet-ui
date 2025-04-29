<template>
  <span v-loading="fileBusy" v-if="!fileBusy" class="app-logo">
    <img
        v-if="brandingFile"
        :src="logoPaths[type]"
        :alt="brandingFile.name"
      />
    <img
      v-else
      src="../../assets/curio/AiR-logo-curio.svg"
      alt="Wasabi AiR"
    />
  </span>
</template>

<script>
import { mapGetters } from 'vuex'
import { BRANDING } from 'src/store/storeModules'
import { CONSTANTS } from 'src/constants'
import {
  GET_BRANDING_ERROR,
  GET_BRANDING_FILE,
  GET_BRANDING_FILE_BUSY,
  GET_PATHS
} from 'src/store/modules/admin/branding/getters'

export default {
  name: 'logo-image',
  props: {
    type: {
      type: String,
      default: CONSTANTS.LOGOS.APP_LOGO
    }
  },

  computed: {
    ...mapGetters(BRANDING, {
      error: GET_BRANDING_ERROR,
      fileBusy: GET_BRANDING_FILE_BUSY,
      brandingFile: GET_BRANDING_FILE,
      logoPaths: GET_PATHS
    }),
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_mixins';

  .app-logo {
   display: inline-block;
   height: 32px;

    img {
      height: 100%;
      max-width: 100%;
      width: auto;
    }
  }
</style>
