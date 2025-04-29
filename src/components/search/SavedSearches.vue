<template>
  <div class="saved-search">
    <h2>Saved Searches</h2>
    <div class="saved-search__wrapper">
      <div v-loading="loadingSearches" class="saved-searches-items__wrapper">
        <empty-states v-if="savedSearches.length === 0 && loadingSearches == false" :page="CONSTANTS.EMPTY_STATES.SAVED_SEARCHES"></empty-states>
        <div v-for="(search, $index) in savedSearches" :key="search.name" class="search-item">
          <div class="name" @click="goToSearch(search, $index)">{{unescapeHTML(search.name)}}</div>
          <div class="actions">
            <div class="edit" @click="edit(search, $index)"><i class="far fa-pencil" aria-hidden="true"></i></div>
            <div class="remove" @click="remove(search, $index)"><i class="far fa-trash-alt" aria-hidden="true"></i></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import api from 'src/api'
  import _ from 'lodash'
  import { getSearchQueryFromStore, putSearchQueryInStore } from './search-helper'
  import EmptyStates from 'src/components/global/EmptyStates'

  import { CONSTANTS } from 'src/constants'

  export default {
    name: 'search-saved',
    components: {
      EmptyStates
    },
    data () {
      return {
        CONSTANTS,
        savedSearches: [],
        loadingSearches: true
      }
    },

    beforeMount () {
      api.getSavedSearches()
      .then(response => {
        this.savedSearches = _.cloneDeep(response.saved_searches)
      })
      .finally(() => {
        this.loadingSearches = false
      })
    },

    methods: {
      goToSearch (search, index) {
        let searchBody = JSON.parse(decodeURIComponent(this.unescapeHTML(search.params)))
        let key = putSearchQueryInStore(searchBody)
        this.$router.push({ name: this.CONSTANTS.ROUTES.SEARCH.NAME, query: { key: key } })
      },

      edit (search, index) {
        let searchBody = JSON.parse(decodeURIComponent(this.unescapeHTML(search.params)))
        let key = putSearchQueryInStore(searchBody)
        this.$router.push({ name: this.CONSTANTS.ROUTES.SEARCH.NAME, query: { key: key } })
      },

      remove (search, index) {
        this.$confirm('Are you sure you want to remove this saved search?', `Remove: ${this.unescapeHTML(search.name)}`, {
          cancelButtonText: 'Cancel',
          confirmButtonText: 'Continue',
          type: 'warning'
        }).then(() => {
          api.deleteSavedSearch(search.saved_search_id)
            .then(result => {
              this.savedSearches.splice(index, 1)
            })
            .catch(err => {
              this.$message({
                duration: this.CONSTANTS.MESSAGE_DURATION,
                message: 'Error deleting saved search, please try again',
                showClose: true,
                type: 'error'
              })
            })
        })
      },

      escapeHTML (html) {
        let escapeEl = document.createElement('textarea')
        escapeEl.textContent = html
        return escapeEl.innerHTML
      },

      unescapeHTML (html) {
        let escapeEl = document.createElement('textarea')
        escapeEl.innerHTML = html
        return escapeEl.textContent
      }
    }
  }
</script>

<style lang="less" scoped>
  @import (reference) '~src/styles/_variables.less';
  @import (reference) '~src/styles/_mixins.less';

  .saved-search {
    padding: 20px;
    width: 100%;
    height: 100%;
    h2 {
      color: @color-primary;
      font-family: @default-font-family-black;
      font-size: 14px;
      text-transform: uppercase;
    }
    .saved-search__wrapper {
      position: relative;

      .save-text__wrapper {
        padding: 15px;
        display: flex;
        flex-direction: row;
        align-items: center;

        background-color: @header-color;

        > button {
          padding: 13px;
          background: @heavy-button-color;
          border: none;

          &:hover {
            background: lighten(@heavy-button-color, 10%);
          }

          &:active {
            background: lighten(@heavy-button-color, 30%);
          }
        }
      }

      .saved-searches-items__wrapper {
        .flex-container-column();
        color: @text-dark;
        font-size: 15px;
        font-weight: bold;
        height: calc(~'100% - 50px');
        min-height: 45px;
        overflow-y: auto;

        .search-item {
          border-bottom: 1px solid @box-border-grey;
          height: 45px;
          padding: 15px 0 15px 15px;

          display: flex;
          flex-direction: row;
          width: 100%;

          .name {
            &:hover {
              cursor: pointer;
              color: @color-accent;
            }
          }

          .actions {
            display: flex;
            flex-direction: row;
            margin-left: auto;

            i {
              &:hover {
                cursor: pointer;
                color: @color-accent;
              }

              &:active {
                color: darken(white, 30%);
              }
            }

            .edit, .remove {
              padding: 3px 5px;

              &:hover {
                > i {
                  color: @color-accent;
                }
              }
            }

            .remove {
              margin-right: 4px;
              padding: 3px 6px;
            }
          }
        }
      }

      button {
        background: @heavy-button-color;
        color: @color-base;
      }
    }
  }
</style>

<style lang="less">
  @import '../../styles/_variables.less';

  .saved-search__wrapper {
    height: 100%;

    .overlay {
      width: 75vw;

      .save-text__wrapper {
        .save-name {
          &.error {
            .el-input__inner {
              border: solid 1px @color-alert;
              background: @color-alert;
            }
          }
        }
      }

      .saved-searches-items__wrapper {
        border-right: solid 1px @header-color;
        border-left: solid 1px @header-color;
      }
    }
  }
  .button {
    &:hover {
      background-color: transparent;
    }

    &:active {
      background-color: transparent;
    }
  }
</style>
