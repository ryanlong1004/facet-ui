<template>
  <div class="category-tab-header">
    <p class="title">Categories</p>
    <div class="content">
      <div class="content-autocomplete-tags">
        <template v-for="category in displayedCategories">
          <category-tab :categoryName="category" :key="category"></category-tab>
        </template>
        <p
          v-if="numAdditionalCategories > 0"
          class="more"
          @click="toggleAllCategories"
        >
          +{{ numAdditionalCategories }}
        </p>
        <div class="container">
          <i class="far fa-spinner fa-spin" v-if="status"></i>
          <el-autocomplete
            :disabled="status"
            :fetch-suggestions="queryCategories"
            :select-when-unmatched="true"
            :trigger-on-focus="true"
            @select="addNewCategory"
            class="autocomplete-parent"
            placeholder="Type a new category and press ENTER"
            popper-class="categories-typeahead"
            v-model="categoryName"
          >
          </el-autocomplete>
        </div>
        <div class="display-all-categories" v-if="showAllCategories">
          <div class="all-categories-header">
            <p class="title">Categories</p>
            <i class="far fa-times close-button" @click="toggleAllCategories"></i>
          </div>
          <div class="tags">
            <template v-for="category in categoriesByItem">
              <category-tab :categoryName="category" :showFullName="true" :key="category"></category-tab>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'
  import { mapActions, mapGetters } from 'vuex'
  import {
    ADD_CATEGORIES,
    GET_CATEGORIES_LOADING,
    GET_CATEGORIES,
    GET_CATEGORIES_BY_ITEM,
    LOAD_CATEGORIES,
    LOAD_CATEGORIES_BY_ITEM
  } from 'src/store/modules/item/categories/categories'
  import { CATEGORIES } from 'src/store/storeModules'
  import VuexItemMixin from 'src/mixins/VuexItemMixin'

  import CategoryTab from './CategoryTab'

  const NUM_SUMMARY_CATEGORIES = 2

  export default {
    name: 'categories-tab-header',

    components: {
      CategoryTab
    },

    mixins: [
      VuexItemMixin
    ],

    data () {
      return {
        categoryName: '',
        showAllCategories: false
      }
    },

    mounted () {
      this.loadAllCategories()
      this.loadCategoriesByItem()
    },

    computed: {
      ...mapGetters(CATEGORIES, {
        categories: GET_CATEGORIES,
        categoriesByItem: GET_CATEGORIES_BY_ITEM,
        status: GET_CATEGORIES_LOADING
      }),

      displayedCategories () {
        return this.categoriesByItem.slice(0, NUM_SUMMARY_CATEGORIES)
      },

      hasCategory () {
        return this.categoriesByItem.includes(this.categoryName)
      },

      numAdditionalCategories () {
        return this.categoriesByItem.length - this.displayedCategories.length
      }
    },

    methods: {
      ...mapActions(CATEGORIES, {
        addCategories: ADD_CATEGORIES,
        loadAllCategories: LOAD_CATEGORIES,
        loadCategoriesByItem: LOAD_CATEGORIES_BY_ITEM
      }),

      async addNewCategory () {
        const hasSlash = this.categoryName.includes('/')
        if (!this.hasCategory && !hasSlash && this.categoryName.length >= 2) {
          const newCategories = this.categoryName
            .split(',')
            .map(cat => cat.trim())
            .filter(cat => cat.length > 0)

          const success = await this.addCategories({
            categories: [...this.categoriesByItem, ...newCategories]
          })

          if (success) {
            this.categoryName = ''
          } else {
            this.$message({
              duration: this.CONSTANTS.MESSAGE_DURATION,
              message: `${this.categoryName} not added. Please try again.`,
              showClose: true,
              type: 'error'
            })
          }
        } else {
          if (this.categoryName.length <= 1) {
            this.$message({
              duration: this.CONSTANTS.MESSAGE_DURATION,
              message: 'Category name must be 2 or more characters.',
              showClose: true,
              type: 'error'
            })
          } else if (hasSlash) {
              this.$message({
                  duration: this.CONSTANTS.MESSAGE_DURATION,
                  message: 'Cannot include / symbol in the Category name',
                  showClose: true,
                  type: 'error'
              })
          } else {
            this.$message({
              duration: this.CONSTANTS.MESSAGE_DURATION,
              message: `${this.categoryName} already exists.`,
              showClose: true,
              type: 'error'
            })
          }
        }
      },

      createFilter (query) {
        return (category) => {
          return category.value.toLowerCase().includes(query.toLowerCase())
        }
      },

      queryCategories (query, callback) {
        if (this.categories.length > 0) {
          const categories = this.categories.map(category => {
            return {
              value: category.name
            }
          })
          const filteredCategories = query ? categories.filter(this.createFilter(query)) : categories
          callback(filteredCategories)
        } else {
          callback([])
        }
      },

      toggleAllCategories () {
        this.showAllCategories = !this.showAllCategories
      }
    }
  }
</script>

<style lang="less">
  @import (reference) '~src/styles/_variables';

  .category-tab-header {
    .el-autocomplete {
      width: 210px;

      .el-input {
        .el-input__inner {
          background: @color-base;
          border-color: @color-tone-lighter;
          color: @color-primary;
          font-size: 10px;
          font-weight: 500;
          height: 19px;
          padding: 4px 21px 4px 5px;

          &::placeholder {
            font-size: 10px;
            font-weight: 500;
          }

          &:focus {
            border-color: @color-tone;
          }
        }
      }
    }
  }
</style>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.category-tab-header {
  .flex-container-column();
  padding: 0 12px 0 9px;
  width: 100%;

  .title {
    color: @color-tone-lightest;
    display: block;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.01px;
    line-height: 1.11;
    margin: 0 0 3px;
    text-transform: uppercase;

    + .content {
      .flex-box();
      position: relative;

      .content-autocomplete-tags {
        .flex-container();
        .align-items-center();
        .flex-wrap(wrap);
        position: relative;

        .container {
          position: relative;

          .el-autocomplete {
            display: inline-flex;
            margin-bottom: 1px;
            margin-right: 5px;
          }

          i {
            .abs-pos(4px, 10px, auto, auto);
            z-index: 2;
          }
        }
      }
    }
  }

  .more,
  .tag {
    .flex-container-center();
    .align-items-center();
    background: @color-tone-darkest;
    color: @color-base;
    display: inline-flex;
    font-size: 9px;
    font-weight: 900;
    height: 19px;
    line-height: 1.13;
    margin: 0 2.9px 0 0;
    padding: 0 5px;
    text-transform: uppercase;

    &:hover {
      background-color: darken(@color-tone-darkest, 5%);
      cursor: pointer;
    }
  }

  .more {
    font-size: 10px;
  }

  .display-all-categories {
    .abs-pos(-18px, auto, auto, -9px);
    background-color: @color-primary;
    box-shadow: 3px 3px 2px 1px rgba(0,0,0,0.16);
    padding: 0 9px 9px;
    width: 110%;
    z-index: 10;

    .all-categories-header {
      .flex-container-between();

      .close-button {
        color: @color-tone-lightest;
        margin: 5px;

        &:hover {
          color: darken(@color-tone-lightest, 5%);
          cursor: pointer;
        }
      }

      .title {
        margin-bottom: 0;
      }

      .tags {
        margin-right: 5px;
      }
    }

    .tags {
      margin-right: 5px;

      .tag {
        margin-bottom: 8px;
        margin-right: 5px;
      }
    }
  }
}
</style>
