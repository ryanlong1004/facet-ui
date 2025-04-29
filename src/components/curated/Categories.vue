<template>
  <div class="categories" v-loading="status">
    <lists-and-items
      :items="selectedCategory.items"
      :emptyStateName="CONSTANTS.EMPTY_STATES.CATEGORIES"
      :lists="categories"
      :routeName="CONSTANTS.ROUTES.CURATED.CATEGORIES.CATEGORY.NAME"
    >
      <template slot="list" slot-scope="slotProps">
        <category :listName="slotProps.listName" :listCount="slotProps.listCount"></category>
      </template>
      <template slot="items" slot-scope="slotProps">
        <item-tile
          :itemId="slotProps.itemId"
          :itemName="slotProps.itemName"
          :itemThumbnail="slotProps.itemThumbnail"
          :itemCategories="slotProps.itemCategories"
          :itemLastHarvestedDate="slotProps.itemLastHarvestedDate"
          :itemItemType="slotProps.itemItemType"
          :itemGMItemType="slotProps.itemGMItemType"
        >
        </item-tile>

      </template>
      <template slot="itemsFooter">
        <mugen-scroll
          class="infinite-scroller"
          :handler="loadNextCategoryItems"
          :should-handle="hasNextPageToken"
          :handle-on-mount="false"
          :threshold="0.1"
          scroll-container="list-of-items">
          <div v-loading="hasNextPageToken"></div>
        </mugen-scroll>
      </template>
    </lists-and-items>
  </div>
</template>

<script>
  import _ from 'lodash'
  import api from 'src/api'
  import {
    mapActions,
    mapGetters,
    mapMutations
  } from 'vuex'
  import {
    GET_CATEGORY_RESULTS,
    GET_CATEGORIES,
    GET_CATEGORIES_LOADING,
    GET_SELECTED_CATEGORY,
    LOAD_CATEGORIES,
    LOAD_CATEGORY_ITEMS,
    SET_SELECTED_CATEGORY
  } from 'src/store/modules/item/categories/categories'
  import { CATEGORIES } from 'src/store/storeModules'
  import Category from 'src/components/curated/Category.vue'
  import ItemTile from 'src/components/search/ItemTile.vue'
  import ListsAndItems from 'src/components/curated/ListsAndItems.vue'
  import MugenScroll from 'vue-mugen-scroll'

  export default {
    name: 'categories',

    components: {
      Category,
      ItemTile,
      ListsAndItems,
      MugenScroll
    },

    async mounted () {
      await this.loadCategories()

      if (!this.$route.params.slug) {
        const firstCategory = this.categories[0]
        if (firstCategory) {
          this.$router.replace({
            name: this.CONSTANTS.ROUTES.CURATED.CATEGORIES.CATEGORY.NAME,
            params: { slug: firstCategory.name }
          })
        }
      }

      this.$watch('$route.params.slug', (to, from) => {
        if (to) {
          this.setSelectedCategory(to)
          this.loadCategoryItems(to)
        }
      }, { immediate: true })
    },

    computed: {
      ...mapGetters(CATEGORIES, {
        categories: GET_CATEGORIES,
        selectedCategory: GET_SELECTED_CATEGORY,
        status: GET_CATEGORIES_LOADING
      }),

      hasNextPageToken () {
        return this.selectedCategory.next_page_token !== ''
      },

      slug () {
        return this.$route.params.slug || ''
      }
    },

    methods: {
      ...mapActions(CATEGORIES, {
        loadAllCategories: LOAD_CATEGORIES,
        loadCategoryItems: LOAD_CATEGORY_ITEMS
      }),

      ...mapMutations(CATEGORIES, {
        setSelectedCategory: SET_SELECTED_CATEGORY
      }),

      displaySelectedCategory () {
        if (this.slug) {
          this.setSelectedCategory(this.findCategory(this.slug))
          // send user to categories landing if category does not exist
          if (this.selectedCategory === undefined) {
            this.$router.push({ name: this.CONSTANTS.ROUTES.CURATED.CATEGORIES.CATEGORY.NAME })
          }
        } else if (_.get(this.categories, 'length', 0) > 0) {
          this.setSelectedCategory(this.categories[0])
          this.$router.push({
            name: this.CONSTANTS.ROUTES.CURATED.CATEGORIES.CATEGORY.NAME,
            params: { slug: this.categories[0].name }
          })
        }
      },

      findCategory (slug) {
        return _.find(this.categories, { 'category': slug })
      },

      async loadCategories () {
        await this.loadAllCategories()
        this.displaySelectedCategory()
      },

      loadNextCategoryItems () {
        this.loadCategoryItems(this.selectedCategory.name)
      }
    }
  }
</script>

<style lang="less" scoped>
  .categories {
    .infinite-scroller {
      height: 10px;
      margin: 10px 0;
    }
  }
</style>
