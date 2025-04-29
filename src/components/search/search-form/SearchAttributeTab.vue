<template>
  <div
    ref="tab"
    class="search-attribute-tab"
    :class="{ active: isActive }"
    @click="tabClicked"
    @mouseover="handleMouseOver"
    @mouseout="handleMouseOut">
    <div class="icon-wrapper">
      <i :class="iconClass"></i>
    </div>
    <div class="label-wrapper">
      <div class="label-text">{{ label }}</div>
    </div>
    <span v-if="numberHint > 0" class="number-hint">{{ numberHint }}</span>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import { SEARCH_CONSTANTS } from 'src/constants-search'
import { SEARCH } from 'src/store/storeModules'
import {
  GET_ACTIVE_ATTRIBUTE_TYPE
} from 'src/store/modules/search/getters'
import {
  SET_ACTIVE_ATTRIBUTE_TYPE,
  CLEAR_ACTIVE_ATTRIBUTE_TYPE
} from 'src/store/modules/search/mutations'

export default {
  name: 'SearchAttributeTab',
  props: {
    attributeType: {
      required: true,
      type: String
    },
    iconClass: {
      required: true,
      type: String
    },
    label: {
      required: true,
      type: String
    },
    numberHint: {
      type: Number,
      default: 0
    }
  },
  data () {
    return {
      labelWrapperEl: null,
      textWidth: 0
    }
  },
  mounted () {
    // calculate the width of the text label for future animations
    const el = this.$refs['tab']
    this.labelWrapperEl = el.querySelector('.label-wrapper')
    const lt = el.querySelector('.label-text')
    this.textWidth = lt.offsetWidth
    this.labelWrapperEl.style.width = '0px'

    this.$watch('currentAttributeType', (newVal, oldVal) => {
      if (newVal !== this.attributeType && oldVal === this.attributeType) {
        this.handleMouseOut()
      } else if (newVal === this.attributeType) {
        this.handleMouseOver()
      }
    })
  },
  computed: {
    ...mapGetters(SEARCH, {
      currentAttributeType: GET_ACTIVE_ATTRIBUTE_TYPE
    }),
    isActive () {
      return this.currentAttributeType === this.attributeType
    }
  },
  methods: {
    ...mapMutations(SEARCH, {
      setActiveAttribute: SET_ACTIVE_ATTRIBUTE_TYPE,
      clearActiveAttributeType: CLEAR_ACTIVE_ATTRIBUTE_TYPE
    }),
    tabClicked () {
      if (this.isActive) {
        this.clearActiveAttributeType()
      } else {
        this.setActiveAttribute(this.attributeType)
      }
    },
    handleMouseOver () {
      this.labelWrapperEl.style.width = `${this.textWidth}px`
    },
    handleMouseOut () {
      if (!this.isActive) {
        this.labelWrapperEl.style.width = '0px'
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables.less';
@import (reference) '~src/styles/_mixins.less';

.search-attribute-tab {
  .flex-container();
  .flex-wrap(nowrap);
  align-items: center;
  color: @color-tone-darkest;
  cursor: pointer;
  padding-right: 10px;
  .icon-wrapper {
    .flex-container-center();
    height: 36px;
    width: 26px;
    > i {
      font-size: 14px;
    }
  }
  .label-wrapper {
    overflow: hidden;
    text-transform: uppercase;
    transition: width 100ms ease-out;
    white-space: nowrap;
    width: auto;
    .label-text {
      font-family: @default-font-family-black;
      font-size: 10px;
      white-space: nowrap;
    }
  }
  .number-hint {
    .flex-container-center();
    background-color: @color-tone-lighter;
    border-radius: 50%;
    color: @color-tone-darker;
    font-family: @default-font-family-medium;
    font-size: 10px;
    font-weight: 800;
    line-height: 10px;
    margin: -6px 0 0 0px;
    height: 12px;
    width: 12px;
  }
  &:hover {
    color: @color-primary;
    .number-hint {
      background-color: @color-tone-lightest;
      color: @color-primary;
    }
  }
  &.active {
    color: @color-base;
    background-color: @color-accent;
    .number-hint {
      background-color: @color-base;
      color: @color-accent;
    }
  }
  &:hover, &.active {
    .number-hint {
      margin-left: 6px;
    }
  }
}
</style>
