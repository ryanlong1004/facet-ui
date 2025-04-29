<template>
  <div class="duplicates" v-loading="downloading">
    <div class="duplicates-header">
      <h2>Duplicate Files</h2> 
      <div class="total-footprint">
        <span><strong>Total Count of duplicates:</strong> {{ footprint.count }}</span>
        <span><strong>Total Number of duplicates:</strong> {{ footprint.number }}</span>
        <span><strong>Total Size of duplicates:</strong> {{ footprint.footprintSizeHumanized }}</span>
      </div>
    </div>
    <div v-if="duplicates.length" class="duplicates-wrapper">
      <div v-for="duplicate in duplicates" :key="duplicate.hash" class="duplicate">
        <div class="duplicate-overview">
          <div v-loading="duplicate.isLoadingThumb" class="duplicate-thumbnail">
            <thumbnail-image
              v-if="!duplicate.isLoadingThumb"
              :id="duplicatesHashMap[duplicate.hash].itemId"
              :thumb="duplicatesHashMap[duplicate.hash].thumbnail"
            ></thumbnail-image>
          </div>
          <div class="duplicate-summary">
            <div class="top">
              <div class="duplicate-summary-stats">
                <h2 class="title">Count: {{ duplicate.count }}</h2>
                <h3 class="footprint">File Size: {{ duplicate.fileSizeHumanized }}</h3>
                <h3 class="footprint">Duplicates Size: {{ duplicate.footprintSizeHumanized }}</h3>
              </div>
              <div class="actions">
                <span v-if="duplicate.count <= 1000" class="action" @click="download(duplicate)">Download Duplicate Report (CSV Format)<i class="far fa-download"></i></span>
                <span v-else class="action no-hover">Too many duplicates to download report</span>
                <div class="download-button" :ref="duplicate.hash">
                  <download-csv
                    :data="duplicate.allItems"
                    delimiter="|"
                    name="dupes.csv"
                  >
                    <el-button type="primary" class="hidden">Download File List</el-button>
                  </download-csv>
                </div>
              </div>
            </div>
            <div class="bottom" @click="showHideFiles(duplicate.hash)"><span class="action show-hide"><i class="far fa-list"></i>{{ duplicate.isShowingFiles ? 'Hide' : 'Show' }} Duplicate Files</span></div>
          </div>
        </div>
        <duplicate-files
          v-if="duplicate.isShowingFiles"
          :hash="duplicate.hash"
          :items="duplicate.items"
        ></duplicate-files>
      </div>

      <div v-if="hasMoreDuplicates" class="load-more action" @click="loadDuplicates">
        <div>Load More Duplicates</div>
        <div><span><i class="far fa-chevron-down"></i></span></div>
      </div>
    </div>
    <div v-else-if="!isBusy" class="duplicates-wrapper">
      <p>You don't seem to have any duplicate files.</p>
    </div>
    <div v-if="isBusy" v-loading="isBusy" class="duplicates-wrapper loading-duplicates">loading duplicates</div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import DownloadCsv from 'vue-json-csv'
import { DUPLICATES } from 'src/store/storeModules'
import {
  GET_DUPLICATES,
  IS_BUSY,
  HAS_MORE_DUPLICATES,
  GET_DUPLICATES_HASH_MAP,
  GET_FOOTPRINT
} from 'src/store/modules/duplicates/getters'
import { FETCH_DUPLICATES, SHOW_HIDE_FILES, FETCH_FOOTPRINT } from 'src/store/modules/duplicates/actions'
import DuplicateFiles from 'src/components/duplicates/DuplicateFiles.vue'
import ThumbnailImage from 'src/components/thumbnail/ThumbnailImage.vue'
import api from 'src/api'
import {getName} from 'src/item-helper'

export default {
  name: 'duplicates',

  components: {
    DuplicateFiles,
    ThumbnailImage,
    DownloadCsv
  },

  computed: {
    ...mapGetters(DUPLICATES, {
      duplicates: GET_DUPLICATES,
      duplicatesHashMap: GET_DUPLICATES_HASH_MAP,
      hasMoreDuplicates: HAS_MORE_DUPLICATES,
      isBusy: IS_BUSY,
      footprint: GET_FOOTPRINT
    })
  },

  async beforeMount () {
    await this.loadFootprint()
    await this.loadDuplicates()
  },

  data () {
    return {
      downloading: false
    }
  },

  methods: {
    ...mapActions(DUPLICATES, {
      loadDuplicates: FETCH_DUPLICATES,
      showHideFiles: SHOW_HIDE_FILES,
      loadFootprint: FETCH_FOOTPRINT
    }),

    async download (duplicate) {
      this.downloading = true
      try {
        const response = await api.getDuplicate(duplicate.hash, '', 1000)
        for (let i = 0; i < response.items.length; i++) {
          const itemResponse = await api.getItem(response.items[i])
          if (itemResponse) {
            const name = getName(itemResponse.item.name || itemResponse.item.stow_url)
            let stowName = _.get(itemResponse, 'item.stow_name', 'N/A' || 'N/A')
            if (stowName !== 'N/A') {
              stowName = getName(stowName)
            }
            duplicate.allItems.push({ 
              name, 
              object_name: stowName,
              gm_asset_title: _.get(itemResponse, 'item.gm_asset_title', 'N/A') || 'N/A',
              stow_url: itemResponse.item.stow_url,
              id: response.items[i]
            })
          }
        }
        this.$refs[duplicate.hash][0].querySelector('[id^="export"]').click()
      }
      catch (err) {
        console.error(err)
      }
      finally {
        this.downloading = false
      }

    }
  },

  beforeRouteLeave (to, from, next) {
    if (!this.downloading) {
      next()
    } else {
      next(false)
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins.less';

.duplicates {
  color: @color-primary;
  height: calc(~'100% - 40px'); // adjust for page headers

  .duplicates-header {
    background-color: @color-tone-light;
    border-bottom: 1px solid @background-light-gray;

    h2 {
      font-size: 12px;
      font-weight: 900;
      line-height: 1.17;
      margin-top: 15px;
      margin: 0;
      padding: 15px 20px;
      text-transform: uppercase;
    }

    .total-footprint {
      .flex-container-between();
      font-size: 11px;
      padding: 0 20px 10px 20px;
      text-transform: uppercase;
      strong {
        font-family: @default-font-family-medium;
      }
    }
  }

  .duplicates-wrapper {
    background-color: @color-base;
    height: 100%;
    max-width: 1200px;
    padding: 25px 20px;
    overflow: auto;

    .duplicate {
      margin-bottom: 15px;
      background-color: @color-tone-light;
      min-width: 580px;

      .duplicate-overview {
        .flex-box();

        .duplicate-thumbnail,
        .thumbnail-container {
          height: 113px;
          width: 200px;
        }

        .duplicate-summary {
          padding: 10px 15px;
          width: 100%;
          .flex-box();
          .flex-direction(column);

          span > i {
            font-size: 14px;
            line-height: 1.21;
            text-align: center;
          }

          .duplicate-summary-stats {
            h2 {
              font-size: 14px;
              margin: 0 0 4px 0;
            }
            h3 {
              font-size: 12px;
              margin: 0 0 4px 0;
            }
          }

          .top {
            .flex-box();

            .title {
              font-size: 14px;
            }

            .actions {
              .flex-box();
              .align-items-center();
              margin-left: auto;

              i {
                margin-left: 9px;
              }

              .download-button .hidden {
                display: none;
              }
            }
          }

          .bottom {
            margin-top: auto;

            .action {
              .flex-box();
              .align-items-center();
              i {
                margin-right: 9px;
              }
            }
          }
        }
      }
    }
  }

  .loading-duplicates {
    min-height: 46px;
  }
}
</style>

<style lang="less">
@import (reference) '~src/styles/_mixins.less';

.duplicates {

  .action {
    text-transform: uppercase;
    font-size: 10px;
    line-height: 1.1;

    &:hover,
    i:hover {
      color: @color-accent;
      cursor: pointer;
    }

    &.disabled i:hover,
    &.no-hover:hover {
      color: unset;
      cursor: unset;
    }
  }

  .load-more {
    .flex-container-center();
    .flex-direction(column);
    color: @color-tone-darkest;
    font-weight: 900;

    &.action {
      font-weight: 900;
      i {
        line-height: 1.2;
      }
    }
  }
}
</style>
