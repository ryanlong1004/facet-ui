<template>
  <div class="lists-and-items">
    <div v-if="lists.length > 0 || isLoadingLists" v-loading="isLoadingLists" class="lists-wrapper">
      <div class="list-of-lists">
        <div class="scroll-container">
        <div v-for="list in lists" :key="list.id" class="list-individual-wrapper">
          <router-link
            :to="{
              name: routeName,
              params: { slug: list.name }
            }"
            tag="div"
            class="list-individual"
          >
            <slot name="list"
              :listName="list.name"
              :listCount="list.count">
            </slot>
          </router-link>
        </div>
        </div>
      </div>
      <div v-loading="isLoadingItems" ref="list-of-items" class="list-of-items">
        <div v-for="item in items" :key="item.itemId" class="item-wrapper">
          <slot name="items"
            :itemId="item.itemId"
            :itemName="item.itemName"
            :itemThumbnail="item.itemThumbnail"
            :itemCategories="item.itemCategories"
            :itemLastHarvestedDate="item.itemLastHarvestedDate"
            :itemItemType="item.itemItemType"
            :itemGMItemType="item.itemGMItemType"
          >
          </slot>
        </div>
        <slot name="itemsFooter"></slot>
      </div>
    </div>
    <empty-states v-else :page="emptyStateName"></empty-states>
  </div>
</template>

<script>
  import { mapGetters } from 'vuex'
  import EmptyStates from 'src/components/global/EmptyStates.vue'
  import { LOADNSTORE } from 'src/store/storeModules'
  import { GET_GM_STORAGE_FILES } from 'src/store/modules/loadnstore/loadnstore'

  export default {
    name: 'lists-and-items',
    components: {
      EmptyStates
    },
    props: {
      items: {
        type: Array,
        defaut: []
      },
      emptyStateName: {
        type: String,
        defaut: ''
      },
      lists: {
        type: Array,
        default: []
      },
      isLoadingItems: {
        type: Boolean,
        defaut: true
      },
      isLoadingLists: {
        type: Boolean,
        defaut: true
      },
      routeName: {
        type: String
      }
    },
    computed: {
      ...mapGetters(LOADNSTORE, {
        gmStorageFiles: GET_GM_STORAGE_FILES
      })
    }
  }
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

  .lists-and-items {
    .lists-wrapper {
      .list-of-lists {
        .list-individual {
          border-bottom: 1px solid transparent;
          border-top: 1px solid transparent;
          color: @color-primary;
          padding: 12px 15px;
          width: 100%;

          &:hover,
          &.active {
            .list {
              color: @color-accent;
            }
          }

          &.active {
            background-color: @color-base;
            border-bottom-color: @color-tone-lighter;
            border-top-color: @color-tone-lighter;
          }
        }
      }

      .list-of-items {
        padding: 20px;

        a.item {
          background: @color-tone-light;
          color: @color-primary;
          cursor: pointer;
          display: flex;
          margin-bottom: 10px;
          max-height: 115px;

          &:hover {
            text-decoration: none;
          }

          &:visited {
            color: @color-primary;
          }

          .thumbnail {
            background-color: @color-tone-lighter;
            flex: 0 200px;
            max-width: 200px;
            min-width: 200px;
            overflow: hidden;
            padding: 0;
          }

          .item-info-action-wrapper {
            display: flex;
            padding: 10px 15px;
            width: 100%;

            .item-info {
              display: flex;
              flex-direction: column;
              height: 100%;
              width: 97%;

              .item-name {
                font-size: 14px;
                font-weight: normal;
                line-height: 1.2;
                margin-bottom: 3px;
              }

              .item-categories {
                font-size: 12px;
                font-weight: 300;
                line-height: 1.2;
              }

              .time {
                font-size: 12px;
                font-weight: normal;
                font-style: normal;
                font-stretch: normal;
                line-height: 1.33;
                letter-spacing: normal;
                margin-top: auto;
              }
            }

            .item-actions-wrapper {
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              margin-left: auto;
              text-align: center;
            }
          }
        }
      }
    }
  }
</style>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

  .lists-and-items {
    background-color: @color-base;
    color: @color-primary;
    line-height: 1.38;
    letter-spacing: normal;

    .search-dash-header {
      background: @color-tone-light;
      border-bottom: 1px solid @color-tone-lighter;
      height: 44px;
    }

    .lists-wrapper {
      .flex-box();

      .list-of-lists,
      .list-of-items {
        height: calc(~'100vh - 40px');
        overflow-y: auto;
      }

      .list-of-lists {
        background-color: @color-tone-light;
        border-right: 1px solid @color-tone-lighter;
        font-family: @default-font-family-medium;
        font-size: 12px;
        max-width: 260px;
        min-width: 260px;
        overflow: visible;
        width: 100%;

        .scroll-container {
          height: 99%;
          overflow-x: visible;
          overflow-y: auto;
          width: 101%;
        }
      }

      .list-of-items {
        max-width: 960px;
        width: 100%;
      }
    }
  }
</style>
