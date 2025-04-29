<template>
  <div class="content">
    <div class="content-storage">
      <h2>Add new&hellip;</h2>

      <div v-if="cloudKinds.length">
        <h3>Connect to cloud storage&hellip;</h3>
        <div class="connect-cloud">
          <div v-for="kind in cloudKinds" :key="kind.id" class="cloud" @click="connectTo(kind.id)">
            <div class="image">
              <img :src="kind.imageUrl" :alt="kind.name" />
            </div>
            <p>{{kind.name}}</p>
          </div>
        </div>
      </div>

      <div v-if="enterpriseKinds.length">
        <h3>Connect to enterprise storage&hellip;</h3>
        <div class="connect-cloud">
          <div v-for="kind in enterpriseKinds" :key="kind.id" class="cloud" @click="connectTo(kind.id)">
            <div class="image">
              <img :src="kind.imageUrl" :alt="kind.name" />
            </div>
            <p>{{kind.name}}</p>
          </div>
        </div>
      </div>

      <div v-if="otherKinds.length">
        <h3>Connect to other storage types&hellip;</h3>
        <div class="connect-cloud">
          <div v-for="kind in otherKinds" :key="kind.id" class="cloud" @click="connectTo(kind.id)">
            <div class="image">
              <img :src="kind.imageUrl" :alt="kind.name" />
            </div>
            <p>{{kind.name}}</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import api from 'src/api'
import { CONSTANTS, LOCATION_CATEGORIES } from 'src/constants'
import { getAPIErrorMsg } from 'src/apiHelpers'
import { SESSION } from 'src/store/storeModules'
import { GET_AUTH_TOKEN } from 'src/store/modules/session/session'

const getImageUrl = kind => {
  return require(`../../assets/curio/cloud-${kind}.png`)
}

const getReactiveLocationKind = kind => {
  return _.assign({}, kind, {
    category: _.get(_.find(CONSTANTS.LOCATION_KIND, { id: kind.id }), 'category', ''),
    imageUrl: getImageUrl(kind.id)
  })
}

export default {
  name: 'admin-add-cloud-storage',

  data () {
    return {
      busy: false,
      kinds: []
    }
  },

  beforeMount () {
    api.getLocationKinds()
      .then(kinds => {
        this.kinds = kinds.map(kind => {
          return getReactiveLocationKind(kind)
        })
      })
      .catch((err) => {
        this.$message({
          duration: CONSTANTS.MESSAGE_DURATION,
          message: getAPIErrorMsg(err),
          showClose: true,
          type: 'error'
        })
      })
  },

  computed: {
    authToken () {
      return this.$store.getters[`${SESSION}/${GET_AUTH_TOKEN}`]
    },
    otherKinds () {
      return _.filter(this.kinds, { category: LOCATION_CATEGORIES.OTHER })
    },
    cloudKinds () {
      return _.filter(this.kinds, { category: LOCATION_CATEGORIES.CLOUD })
    },
    enterpriseKinds () {
      return _.filter(this.kinds, { category: LOCATION_CATEGORIES.ENTERPRISE })
    }
  },

  methods: {
    connectTo (type) {
      if (type === CONSTANTS.LOCATION_KIND.BOX.id) {
        window.location.href = `/api/data/storage/connect/box?access_token=${this.authToken}`
      } else if (type === CONSTANTS.LOCATION_KIND.DROPBOX.id) {
        window.location.href = `/api/data/storage/connect/dropbox?access_token=${this.authToken}`
      } else if (type === CONSTANTS.LOCATION_KIND.DROPBOXTEAMS.id) {
        window.location.href = `/api/data/storage/connect/dropboxteams?access_token=${this.authToken}`
      } else if (type === CONSTANTS.LOCATION_KIND.GOOGLEDRIVE.id) {
        window.location.href = `/api/data/storage/connect/googledrive?access_token=${this.authToken}`
      } else if (type === CONSTANTS.LOCATION_KIND.ONEDRIVE.id) {
        window.location.href = `/api/data/storage/connect/onedrive?access_token=${this.authToken}`
      } else if (type === CONSTANTS.LOCATION_KIND.SHAREPOINT.id) {
        window.location.href = `/api/data/storage/connect/sharepoint?access_token=${this.authToken}`
      } else if (type === CONSTANTS.LOCATION_KIND.SLACK.id) {
        window.location.href = `/api/data/storage/connect/slack?access_token=${this.authToken}`
      } else {
        this.$router.push({ name: 'admin-add-location', params: { type } })
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.account,
.admin-page {
  .content {
    .content-storage {
      .connect-cloud {
        .flex-box();
        .flex-wrap(wrap);
        .justify-content-start();
        margin: 4px 0 17px;

        .cloud {
          .align-items-center();
          .flex-box();
          .flex-direction(column);
          .justify-content-space-between();
          .size(171.6px, 171.6px);
          background-color: @color-tone-light;
          cursor: pointer;
          margin-bottom: 11.1px;
          margin-right: 11.1px;
          text-align: center;

          &:last-of-type {
            margin-right: 0;
          }

          .image {
            .align-items-center();
            .flex-box();
            .justify-content-center();
            height: 147px;

            img {
              max-width: 80%;
            }
          }

          p {
            .base-font-uppercase();
            background: @color-tone-lighter;
            font-size: 8px;
            font-weight: 900;
            letter-spacing: 0.6px;
            margin: 0;
            padding: 6px 6px 5px;
            width: 100%;
          }
        }
      }
    }
  }
}
</style>
