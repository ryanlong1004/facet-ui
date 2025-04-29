<template>
  <div class="filter-input">
    <div class="people-filter-wrapper el-input el-input-suffix">
      <input
        class="el-input__inner"
        type="text"
        :placeholder="placeholder"
        :value="filterStr"
        @input="textTyped"
        @keydown.esc="resetFilter">
      <span class="el-input__suffix">
        <span class="el-input__suffix-inner">
          <i v-if="filterStr.length" class="el-input__icon far fa-times clear-people-search-icon" @click.stop="resetFilter"></i>
          <i v-else class="el-input__icon far fa-search clear-people-search-icon"></i>
        </span>
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'list-filter',
  props: {
    placeholder: {
      type: String
    },
    value: {
      type: String
    }
  },
  data () {
    return {
      filterStr: ''
    }
  },
  methods: {
    textTyped (text) {
      this.filterStr = text.target.value
      this.$emit('input', this.filterStr)
    },
    resetFilter () {
      this.filterStr = ''
      this.$emit('input', this.filterStr)
    }
  }
}
</script>
