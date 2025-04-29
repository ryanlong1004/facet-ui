<template>
  <p @click.stop="removeCategory(categoryName)" class="tag">
    <template v-if="showFullName">
      <span class="text" :innerHTML.prop="categoryName"></span>
    </template>
    <template v-else>
      <el-tooltip
        :content="categoryName"
        :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
        class="item"
        effect="light"
        placement="top-start"
      >
        <span
          class="text"
          :innerHTML.prop="categoryName"
          v-truncate-text.end="14"
        ></span>
      </el-tooltip>
    </template>
    <i class="far fa-times"></i>
  </p>
</template>

<script>
  import _ from 'lodash'
  import { mapActions, mapGetters } from 'vuex'
  import { DELETE_CATEGORY } from 'src/store/modules/item/categories/categories'
  import { CATEGORIES } from 'src/store/storeModules'

  import TruncateText from 'src/directives/truncate-text.directive'

  export default {
    name: 'category-tab',

    directives: {
      TruncateText
    },

    props: {
      categoryName: {
        type: String,
        required: true
      },

      showFullName: {
        type: Boolean,
        default: false
      }
    },

    methods: {
      ...mapActions(CATEGORIES, {
        deleteCategory: DELETE_CATEGORY
      }),

      async removeCategory (categoryName) {
        categoryName = encodeURIComponent(categoryName)
        const success = await this.deleteCategory({ categoryName })

        if (!success) {
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: `${categoryName} not deleted. Please try again.`,
            showClose: true,
            type: 'error'
          })
        }
      }
    }
  }
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.tag {
  i {
    font-size: 11px;
    margin-left: 6px;
    position: relative;
    top: -1px;
  }
}
</style>
