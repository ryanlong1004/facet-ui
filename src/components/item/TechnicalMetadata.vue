<template>
  <div class="technical-metadata">
    <el-menu :default-active="Object.keys(technicalData)[0]" class="menu">
      <el-menu-item @click="categorySelected(key)" :index="key" v-for="(data, key) in technicalData" :key="key">{{ key
        }}</el-menu-item>
    </el-menu>
    <div class="details">
      <field-list :title="selectedCategoryData.title" :data="getDetails"
        v-if="!selectedCategoryData.empty"></field-list>
      <h4 v-if="selectedCategoryData.empty">
        <i class="far fa-times-circle" style="color: goldenrod;" aria-hidden="true"></i>
        &nbsp; No {{ selectedCategoryData.empty }} Data Available
      </h4>
    </div>
  </div>
</template>

<script>
import FieldList from './FieldList.vue'
import { PROPERTY_PATHS } from 'src/property-paths'
import VuexItemMixin from 'src/mixins/VuexItemMixin'
import { ITEM } from 'src/store/storeModules'
import {
  AUDIO_DATA,
  AUDIO_TRACK_INFO,
  DOCUMENT_METADATA,
  EXIV2,
  EXTERNAL_METADATA,
  GENERAL_METADATA,
  IMAGE_DATA,
  ITEM_INFO,
  LOUDNESS_DATA,
  STOW_METADATA,
  VIDEO_DATA
} from 'src/store/modules/item/getterTypes'
import { mapGetters } from 'vuex'

export default {
  name: 'technical-metadata',
  mixins: [
    VuexItemMixin
  ],
  components: {
    FieldList
  },
  directives: {
  },
  props: [],
  data() {
    return {
      selectedCategory: this.CONSTANTS.TECH_INFO.ITEM_INFO
    }
  },
  mounted() {

  },
  methods: {
    categorySelected: function (name = '') {
      this.selectedCategory = name
    }
  },
  computed: {
    ...mapGetters(ITEM, {
      imageData: IMAGE_DATA,
      videoData: VIDEO_DATA,
      audioTrackInfo: AUDIO_TRACK_INFO,
      loudnessData: LOUDNESS_DATA,
      stowMetadata: STOW_METADATA,
      externalMetadata: EXTERNAL_METADATA,
      audioData: AUDIO_DATA,
      generalMetadata: GENERAL_METADATA,
      exiv2: EXIV2,
      documentMetadata: DOCUMENT_METADATA,
      itemInfo: ITEM_INFO
    }),
    parsedExternalMetadata: function () {

      // Initialize an empty object to hold the processed data
      let data = {};

      // Check if externalMetadata is defined and non-empty, return empty data if not
      if (!this.externalMetadata || !this.externalMetadata.details || Object.keys(this.externalMetadata.details).length === 0) {
        return data;
      }

      // Construct the initial details object within data
      data = {
        details: {
          ...this.externalMetadata.details.format,
          ...this.externalMetadata.details.format.tags
        }
      };

      // Remove tags and streams properties from the format object
      delete data.details.tags;
      delete data.details.streams;

      // Build each stream json for UI
      this.externalMetadata.details.streams.forEach((stream) => {
        // Construct a key for the current stream using its index
        const streamKey = `stream ${stream.index + 1}`;

        // Add the current stream's data to the details object, spreading its tags and disposition
        data.details[streamKey] = {
          ...stream,
          ...stream.tags,
          ...stream.disposition
        };

        // Remove the tags and disposition properties from the ouput
        delete data.details[streamKey].tags;
        delete data.details[streamKey].disposition;
      });

      // Return the processed data object
      return data;

    },
    technicalData: function () {
      let data = {}

      if (this.isVideo) {
        data[this.CONSTANTS.TECH_INFO.ITEM_INFO] = this.itemInfo
        data[this.CONSTANTS.TECH_INFO.VIDEO] = this.videoData
        data[this.CONSTANTS.TECH_INFO.AUDIO] = this.audioData
        data[PROPERTY_PATHS.AUDIO_TRACK_INFO.title] = this.audioTrackInfo
        data['General Metadata'] = this.generalMetadata
        data['External Data'] = this.parsedExternalMetadata
      } else if (this.isImage) {
        data[this.CONSTANTS.TECH_INFO.ITEM_INFO] = this.itemInfo
        data[this.CONSTANTS.TECH_INFO.IMAGE] = this.imageData
      } else if (this.isAudio) {
        data[this.CONSTANTS.TECH_INFO.ITEM_INFO] = this.itemInfo
        data[this.CONSTANTS.TECH_INFO.AUDIO] = this.audioData
        data['General Metadata'] = this.generalMetadata
        data['External Data'] = this.parsedExternalMetadata
      } else if (this.isDocument) {
        data[this.CONSTANTS.TECH_INFO.ITEM_INFO] = this.itemInfo
        data[this.CONSTANTS.TECH_INFO.DOCUMENT] = this.documentMetadata
      } else {
        data[this.CONSTANTS.TECH_INFO.ITEM_INFO] = this.itemInfo
        data['External Data'] = this.parsedExternalMetadata
      }

      if (this.exiv2) {
        data['Exiv2'] = this.exiv2
      }

      if (this.loudnessData) {
        data['Loudness Data'] = this.loudnessData
      }

      data['Stow Metadata'] = this.stowMetadata
      return data
    },
    selectedCategoryData: function () {
      const data = this.technicalData[this.selectedCategory]

      if (data && data.title === this.CONSTANTS.TECH_INFO.IMAGE) {
        return data.details ? data : { empty: this.selectedCategory }
      }
      return data ? data : { empty: this.selectedCategory }
    },

    getDetails() {
      return Array.isArray(this.selectedCategoryData.details)
        ? this.selectedCategoryData.details : [this.selectedCategoryData.details]
    },
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';

.technical-metadata {
  display: flex;
  justify-content: space-between;
  height: 100%;
}

.category-title {
  margin-top: 0;
}

.menu {
  width: 10%;
  min-width: 120px;
  margin-right: 15px;
  background-color: transparent;
}

.details {
  width: calc(100% - 120px - 15px - 10px);
  overflow-y: auto;
  margin-top: 10px;
  padding-right: 15px;
}

.el-menu-item.is-active {
  color: @color-base;
  background-color: @color-tone-darkest;
}
</style>

<style lang="less">
.technical-metadata .el-tabs.el-tabs--top .el-tabs__header .el-tabs__nav-wrap .el-tabs__nav-scroll .el-tabs__nav .el-tabs__item {
  padding: 0 12px;

  &:nth-child(2) {
    padding: 0 12px;
  }
}
</style>
