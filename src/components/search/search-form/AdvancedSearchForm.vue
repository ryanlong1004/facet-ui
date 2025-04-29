<template>
  <div class="advanced-search-form">
    <div class="layout-row">
      <div class="layout-col">
        <label>Storage Location(s)</label>
        <el-select
          ref="first-form-element"
          v-model="selectedStorageLocations"
          multiple
          collapse-tags
          filterable
          placeholder=""
          popper-class="selector"
          :popper-append-to-body="false"
          size="mini"
          @keydown.native.shift.tab.stop.prevent="handleShiftTab">
          <el-option
            v-for="location in availableStorageLocations"
            :key="location.id"
            :label="location.name"
            :value="location.name">
          </el-option>
        </el-select>
      </div>
      <div class="layout-col">
        <label>File Type(s)</label>
        <el-select
          v-model="selectedItemTypes"
          multiple
          collapse-tags
          placeholder=""
          popper-class="selector"
          size="mini">
          <el-option
            v-for="type in itemTypes"
            :key="type.value"
            :label="type.label"
            :value="type.value">
          </el-option>
        </el-select>
      </div>
    </div>
    <div class="layout-row">
      <div class="layout-col">
        <label>Date Analyzed</label>
        <el-date-picker
          v-model="selectedDateRange"
          type="daterange"
          range-separator="To"
          start-placeholder="Start date"
          end-placeholder="End date"
          size="mini">
        </el-date-picker>
      </div>
      <div class="layout-col">
        <label>File Extension(s)</label>
        <el-select
          v-model="selectedFileExtensions"
          multiple
          collapse-tags
          filterable
          placeholder=""
          popper-class="selector"
          size="mini">
          <el-option
            v-for="ext in availableFileExtensions"
            :key="ext"
            :label="ext"
            :value="ext">
          </el-option>
        </el-select>
      </div>
    </div>
    <div class="layout-row">
      <div class="layout-col">
        <label>File Size</label>
        <div class="layout-row layout-row--fill">
          <el-select v-model="selectedFileSizeComparator" size="mini" popper-class="selector">
            <el-option
              v-for="option in fileSizeComparators"
              :key="option"
              :label="option"
              :value="option">
            </el-option>
          </el-select>
          <el-input class="file-size-data" type="number" min="0" v-model="selectedFileSizeValue" size="mini"></el-input>
          <el-select
            v-model="selectedFileSizeScale"
            class="file-size-scale"
            placeholder="Select a scale..."
            popper-class="selector"
            size="mini"
            @keydown.tab.native.stop.prevent="handleLastTab">
            <el-option
              v-for="option in fileSizeScales"
              :key="option"
              :label="option"
              :value="option">
            </el-option>
          </el-select>
        </div>
      </div>
      <div class="layout-col">
        <label>Adult Content</label>
        <div class="layout-row adult-radios">
          <el-radio v-model="selectedAdultContent" :label="null">ANY</el-radio>
          <el-radio v-model="selectedAdultContent" :label="'true'">YES, required</el-radio>
          <el-radio v-model="selectedAdultContent" :label="'false'">NO adult content</el-radio>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import { mapGetters, mapMutations, mapActions } from 'vuex'

import { SEARCH_CONSTANTS } from 'src/constants-search'

import { LOCATIONS, SEARCH } from 'src/store/storeModules'
import { GET_LOCATIONS, LOAD_LOCATIONS } from 'src/store/modules/locations/locations'
import { FETCH_AVAILABLE_FILE_EXTENSIONS } from 'src/store/modules/search/actions'
import {
  GET_AVAILABLE_FILE_EXTENSIONS,
  GET_DATE_ANALYZED_FROM,
  GET_DATE_ANALYZED_TO,
  GET_FILE_EXTENSIONS,
  GET_FILE_SIZE_COMPARATOR,
  GET_FILE_SIZE_VALUE,
  GET_FILE_SIZE_SCALE,
  GET_FILE_TYPES,
  GET_STORAGE_LOCATIONS,
  GET_IS_ADULT_CONTENT
} from 'src/store/modules/search/getters'

import {
  SET_DATE_ANALYZED_FROM,
  SET_DATE_ANALYZED_TO,
  SET_FILE_EXTENSIONS,
  SET_FILE_SIZE_COMPARATOR,
  SET_FILE_SIZE_VALUE,
  SET_FILE_SIZE_SCALE,
  SET_FILE_TYPES,
  SET_STORAGE_LOCATIONS,
  SET_IS_ADULT_CONTENT
} from 'src/store/modules/search/mutations'

export default {
  name: 'advanced-search-form',
  beforeMount () {
    this.fetchLocations()
    this.fetchFileExtensions()
  },
  computed: {
    ...mapGetters(LOCATIONS, {
      availableStorageLocations: GET_LOCATIONS
    }),
    ...mapGetters(SEARCH, {
      availableFileExtensions: GET_AVAILABLE_FILE_EXTENSIONS
    }),
    selectedAdultContent: {
      get () {
        return this.$store.getters[`${SEARCH}/${GET_IS_ADULT_CONTENT}`]
      },
      set (val = false) {
        this.$store.commit(`${SEARCH}/${SET_IS_ADULT_CONTENT}`, val)
      }
    },
    selectedDateRange: {
      get () {
        const from = this.$store.getters[`${SEARCH}/${GET_DATE_ANALYZED_FROM}`]
        const to = this.$store.getters[`${SEARCH}/${GET_DATE_ANALYZED_TO}`]
        return [from, to]
      },
      set (dateRange) {
        if (dateRange === null) {
          this.$store.commit(`${SEARCH}/${SET_DATE_ANALYZED_FROM}`, '')
          this.$store.commit(`${SEARCH}/${SET_DATE_ANALYZED_TO}`, '')
        } else {
          this.$store.commit(`${SEARCH}/${SET_DATE_ANALYZED_FROM}`, moment.utc(dateRange[0]).startOf('day').format())
          this.$store.commit(`${SEARCH}/${SET_DATE_ANALYZED_TO}`, moment.utc(dateRange[1]).endOf('day').format())
        }
      }
    },
    selectedFileExtensions: {
      get () {
        return this.$store.getters[`${SEARCH}/${GET_FILE_EXTENSIONS}`]
      },
      set (exts = []) {
        this.$store.commit(`${SEARCH}/${SET_FILE_EXTENSIONS}`, exts)
      }
    },
    selectedFileSizeComparator: {
      get () {
        return this.$store.getters[`${SEARCH}/${GET_FILE_SIZE_COMPARATOR}`]
      },
      set (val) {
        this.$store.commit(`${SEARCH}/${SET_FILE_SIZE_COMPARATOR}`, val)
      }
    },
    selectedFileSizeScale: {
      get () {
        return this.$store.getters[`${SEARCH}/${GET_FILE_SIZE_SCALE}`]
      },
      set (val) {
        this.$store.commit(`${SEARCH}/${SET_FILE_SIZE_SCALE}`, val)
      }
    },
    selectedFileSizeValue: {
      get () {
        return this.$store.getters[`${SEARCH}/${GET_FILE_SIZE_VALUE}`]
      },
      set (val) {
        this.$store.commit(`${SEARCH}/${SET_FILE_SIZE_VALUE}`, val)
      }
    },
    selectedItemTypes: {
      get () {
        return this.$store.getters[`${SEARCH}/${GET_FILE_TYPES}`]
      },
      set (types = []) {
        this.$store.commit(`${SEARCH}/${SET_FILE_TYPES}`, types)
      }
    },
    selectedStorageLocations: {
      get () {
        return this.$store.getters[`${SEARCH}/${GET_STORAGE_LOCATIONS}`]
      },
      set (locs = []) {
        this.$store.commit(`${SEARCH}/${SET_STORAGE_LOCATIONS}`, locs)
      }
    },

    fileSizeComparators () {
      return SEARCH_CONSTANTS.FILE_SIZE_COMPARATORS
    },
    fileSizeScales () {
      return SEARCH_CONSTANTS.FILE_SIZE_SCALES
    },
    itemTypes () {
      return SEARCH_CONSTANTS.GM_ITEM_TYPES
    }
  },
  methods: {
    ...mapActions(LOCATIONS, {
      fetchLocations: LOAD_LOCATIONS
    }),
    ...mapActions(SEARCH, {
      fetchFileExtensions: FETCH_AVAILABLE_FILE_EXTENSIONS
    }),
    handleLastTab (e) {
      this.$emit('tab-forward')
    },
    handleShiftTab (e) {
      this.$emit('tab-back')
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables.less';
@import (reference) '~src/styles/_mixins.less';

.advanced-search-form {
  .flex-container-column();
  background-color: @color-base;
  border: 4px solid @color-accent;
  padding: 10px;
  width: 100%;
  .layout-row {
    .flex-container-between();
    margin-bottom: 20px;
    width: 100%;
    &.align-left {
      .justify-content-start();
    }
    &.full-width {
      .flex-container-column();
      margin-bottom: 8px;
    }
    &:last-child {
      margin-bottom: 0;
    }
    .layout-col {
      .flex-container-column();
      width: 48%;
    }
  }

  .adult-radios {
    .flex-container();
    padding-top: 6px;
    .el-radio {
      .flex-container-center();
      .el-radio__input .el-radio__inner {
        background-color: @color-base;
        border-color: @color-tone-lightest;
        height: 12px;
        width: 12px;
        &:after {
          height: 6px;
          width: 6px;
        }
      }
      .el-radio__label {
        color: @color-tone-darkest;
        font-size: 11px;
        font-style: normal;
        padding-bottom: 2px;
        padding-left: 5px;
      }
      &.is-checked {
        .el-radio__input .el-radio__inner {
          background-color: @color-base;
          border-color: @color-tone-lightest;
          &:after {
            background-color: @color-accent;
          }
        }
      }
    }
  }

  label {
    color: @color-tone-darkest;
    font-family: @default-font-family-black;
    font-size: 10px;
    font-weight: 200;
    margin-bottom: 5px;
    text-transform: uppercase;
  }

  .is-active,
  .el-select .el-input__inner:focus,
  .el-select .el-input.is-focus .el-input__inner,
  .el-range-editor.is-active, .el-range-editor.is-active:hover {
    border-color: @color-tone;
  }

  // override global element styles...
  .el-radio__label {
    color: @color-tone-darkest;
    font-family: @default-font-family-medium;
    font-style: italic;
    font-size: 10px;
    text-transform: none;
  }
  .el-date-editor,
  .el-date-editor--daterange.el-input__inner {
    border-radius: 0;
    width: 100%;
  }
  .el-input input,
  .el-select .el-input input.el-input__inner,
  .el-date-editor .el-range-input,
  .el-date-editor .el-range-separator {
    color: @color-primary;
    font-size: 11px;
    font-weight: 300;
  }
  .el-date-editor .el-range-separator {
    line-height: 26px;
    width: 30px;
  }
  .el-date-editor .el-range-input {
    width: 33%;
  }
  .el-select {
    width: 100%;
    &.file-size-scale {
      width: 120px;
    }

    .el-tag {
      background-color: @color-accent;
      border-radius: 0px;
      color: @color-base;
      font-size: 12px;
      font-weight: 500;
    }
  }
  .file-size-data {
    margin: 0 10px;
    width: 150px;
    .el-input__inner {
      background-color: @color-base;
    }
  }
}
.el-select-dropdown.selector .el-scrollbar .el-scrollbar__wrap .el-scrollbar__view.el-select-dropdown__list .el-select-dropdown__item,
.el-select-dropdown.selector.is-multiple .el-scrollbar .el-scrollbar__wrap .el-scrollbar__view.el-select-dropdown__list .el-select-dropdown__item,
.el-popper.selector .el-scrollbar .el-scrollbar__wrap .el-scrollbar__view.el-select-dropdown__list .el-select-dropdown__item,
.el-popper[x-placement^=bottom].selector .el-scrollbar .el-scrollbar__wrap .el-scrollbar__view.el-select-dropdown__list .el-select-dropdown__item,
.el-select-dropdown.el-popper.selector .el-scrollbar .el-scrollbar__wrap .el-scrollbar__view.el-select-dropdown__list .el-select-dropdown__item
{
  color: @color-primary;
  font-size: 11px;
  font-weight: 300;
  height: 28px;
  line-height: 13px;
  text-transform: none;
  &:hover {
    color: @color-accent;
  }

  &.selected {
    color: @color-base;
  }
}
.el-select-dropdown.el-popper.selector[x-placement^=bottom] {
  margin-top: 0;
}
</style>
