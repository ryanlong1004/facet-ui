<template>
  <div class="search-result">
    <div class="search-result__preview">
      <router-link
        :to="{ name: 'itemDetails', params: {id: file.gm_item_id } }"
        name="itemDetails"
        v-if="file.gm_item_id"
      >
        <div class="thumbnail">
          <thumbnail-image
            ref="thumbnail"
            :id="file.gm_item_id"
            :thumb="file.thumbnail"
          ></thumbnail-image>
        </div>
      </router-link>
      <div v-else class="thumbnail">
        <div class="thumbnail-container single">
          <img class="single" src="/static/img/thumbnail/default.svg">
        </div>
      </div>
    </div>
    <div class="search-result__details">
      <router-link
        v-if="file.gm_item_id"
        :to="{ name: 'itemDetails', params: {id: file.gm_item_id } }"
        name="itemDetails"
      >
        <h3>{{ file.name}}</h3>
      </router-link>
      <h3 v-else>{{ file.name }}</h3>
      <p class="file-stats">
        {{ formatDate(file.last_harvested) }} &middot;
        {{file.size | fileSize }}
      </p>
    </div>
    <div class="actions">
      <template v-if="file.gm_item_id">
        <el-checkbox :checked="file.selected" @change="$emit('toggleCheckbox')"></el-checkbox>
        <el-dropdown
          placement="bottom-start"
          trigger="click"
          @command="command"
        >
          <el-button>
            <i class="fal fa-ellipsis-h"></i>
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item :command="{ type: 'download', item: file }">
              <i class="far fa-download"></i>
              Download
            </el-dropdown-item>
            <el-dropdown-item :command="{ type: 'delete', item: file }">
              <i class="far fa-trash-alt"></i>
              Delete
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </template>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import ThumbnailImage from 'src/components/thumbnail/ThumbnailImage.vue'

import fileSize from 'src/filters/file-size.filter'
import { getPrettyLastHarvestedDate } from 'src/date-helper'

export default {
  name: 'storage-file-item-tile',

  components: { ThumbnailImage },

  props: {
    command: {
      type: Function,
      required: true
    },

    file: {
      type: Object,
      required: true
    }
  },

  filters: {
    fileSize
  },

  methods: {
    formatDate (date) {
      return getPrettyLastHarvestedDate(date)
    }
  }
}
</script>

<style lang="less" scoped>
@import '../../styles/file-browser.less';

.el-dropdown-menu {
  .el-dropdown-menu__item {
    font-size: 10px !important;
    font-weight: 900;
    letter-spacing: 0.8px;
    line-height: 1.33;
    margin-bottom: 13px;
    padding: 0 8px;
    text-transform: uppercase;

    &:last-of-type {
      margin-bottom: 0;
    }

    i {
      display: inline-block;
      font-size: 14px;
      margin-right: 4px;
      text-align: center;
      width: 24px;
    }
  }
}

.thumbnail {
  height: 100%;
  overflow: hidden;
}
</style>
