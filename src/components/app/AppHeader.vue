<template>
  <div>
    <trial-banner></trial-banner>
    <header v-if="showHeader" class="app-header">
      <div class="app-fluid-container">
        <nav class="app-fluid-container__section--left">
          <router-link v-if="!isDocumentation" :to="{ name: CONSTANTS.ROUTES.SEARCH.NAME }" class="navLink" id="app-logo">
            <logo-image></logo-image>
          </router-link>
          <logo-image v-else></logo-image>
        </nav>

        <nav class="app-fluid-container__section--right">
          <span v-if="!isDocumentation" class="el-dropdopwn-link image" id="settings">
            <router-link :to="{ name: 'admin-profile' }" class="avatar-link">
              <img
                :src="avatarUrl"
                class="user-avatar"
                v-if="avatarUrl"
              />
              <avatar
                :username="getUsersName"
                :backgroundColor="backgroundColor"
                :size="26"
                v-else
              >
              </avatar>
            </router-link>
          </span>
          <span v-else-if="isDocumentation" class="close" @click="closeWindow()">close</span>
        </nav>
      </div> <!-- .app-fluid-container -->
    </header>
  </div>
</template>

<script>
  import _ from 'lodash'
  import Avatar from 'vue-avatar'
  import { CONSTANTS } from 'src/constants'

  import {
    HIGHLIGHTS,
    RIGHT_PANEL,
    SESSION
  } from 'src/store/storeModules'
  import { ADD_GLOBAL_HIGHLIGHT_TERM, ADD_HIGHLIGHT_TERM } from 'src/store/modules/highlights/highlights'
  import {
    IS_LOGGED_IN,
    GET_AVATAR,
    GET_CURRENT_USER
  } from 'src/store/modules/session/session'

  import * as rightPanelMutators from 'src/store/modules/rightPanel/mutationTypes'
  import LogoImage from 'src/components/global/LogoImage'
  import SearchQuery from 'src/components/search/SearchQuery'
  import TrialBanner from 'src/components/global/TrialBanner'
  import {RESET_ITEM_STORE} from 'src/store/store-helpers'

  export default {
    name: 'app-header',

    components: {
      Avatar,
      LogoImage,
      TrialBanner
    },

    props: {
      isDocumentation: {
        type: Boolean,
        default: false
      }
    },

    data () {
      return {
        backgroundColor: CONSTANTS.DEFAULT_BACKGROUND_COLOR,
        showSearch: true,
        userId: null
      }
    },

    computed: {
      avatarUrl () {
        return this.$store.getters[`${SESSION}/${GET_AVATAR}`]
      },
      getUsersName () {
        const currentUser = this.$store.getters[`${SESSION}/${GET_CURRENT_USER}`]
        return currentUser.first_name + ' ' + currentUser.last_name
      },
      ready () {
        return this.$store.getters[`${SESSION}/${IS_LOGGED_IN}`]
      },
      showHeader () {
        return !this.$route.path.includes('curio')
      }
    },

    mounted () {
      this.showHideSearchInput(this.$route.path)

      this.$watch('$route.path', (newVal, oldVal) => {
        this.showHideSearchInput(newVal)
        this.hideCommentsPanel(newVal)
      }, {immediate: true})

      this.$watch('$route.query.key', (newVal, oldVal) => {
        this.$store.commit(`${HIGHLIGHTS}/${RESET_ITEM_STORE}`)
      }, {immediate: true})
    },

    methods: {
      closeWindow () {
        window.close()
      },

      hideCommentsPanel (path) {
        let show = false

        if (path.indexOf('item') > -1) {
          show = true
        }

        if (!show) {
          this.$store.commit(`${RIGHT_PANEL}/${rightPanelMutators.CLOSE_COMMENTS}`)
        }
      },

      showHideSearchInput (path) {
        this.showSearch = (path === '/' || path === '/summary') ? false : true
      }
    }
  }
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

@import '~src/styles/main.less';
  .avatar-link,
  .avatar-link:hover {
    cursor: pointer;
    text-decoration: none;
  }
  header.app-header {
    .align-items-center();
    background-color: @color-primary;
    height: 40px;
    max-height: 40px;
    position: relative;

    .app-fluid-container {
      height: 40px;
      max-height: 40px;
      padding: 7px 17px 0;

      nav {
        .align-items-center();
        .flex-box();
        .flex(0, 0, 150px);

        &.app-fluid-container__section--left {
          a {
            color: @color-base;
            font-size: 14px;
            margin-right: 30px;
            text-decoration: none;

            &:last-child {
              margin-right: 0;
            }

            &:hover {
              color: @section-hover;
            }

            &.my-profile-menu {
              padding-top: 8px;
            }
          }
        }

        &.app-fluid-container__section--right {
          .flex-container-end();

          .close {
            color: @color-base;
            cursor: pointer;
            display: block;
            font-size: 14px;
            font-weight: 900;
            text-transform: uppercase;

            &:hover {
              color: @color-accent;
            }
          }

          button {
            .size(30px, 30px);
            background-color: transparent;
            border-radius: 50%;
            border: 0 none;
            color: @color-base;
            cursor: pointer;
            line-height: 30px;
            margin-left: 5px;
            text-align: center;
            transition: all 0.25s ease-in-out;

            i {
              font-size: 1.15rem;
              line-height: 22px;
            }

            &:hover {
              color: @header-color;
              background-color: @color-base;
            }

            &:focus {
              outline: none;
            }
          }
        }
      }
    }
  }

  .el-dropdown-menu {
    background-color: darken(@header-color, 10%);
    border: 0 none;
    line-height: 1;
    margin-top: 7px;
    padding: 0;
    text-transform: uppercase;

    > li {
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 1.3px;
      padding: 0;
      line-height: 25px;

      &:first-child {
        padding-top: 8px;
      }

      &.terms-item {
        text-transform: none;
        font-weight: 100;
        font-size: 10px;
        letter-spacing: 1px;
      }

      .up-arrow {
        .abs-pos(-7px, 12px, auto, auto);
        border-bottom: 7px solid darken(@header-color, 10%);;
        border-left: 7px solid transparent;
        border-right: 7px solid transparent;
      }

      a {
        color: @color-base;
        display: block;
        padding: 0 10px;
        text-decoration: none;

        i {
          font-size: 11px;
          color: @color-base;
          margin-right: 10px;
        }
      }

      &:hover {
        background-color: rgba(255,255,255,.1);
      }

      &.el-dropdown-menu__item--divided {
        border-top: 1px solid rgba(255,255,255,.25);
        margin-top: 0;

        &:before {
          display: none;
        }
      }
    }
  }

  .image {
    .size(26px, 26px);

    &:focus {
      outline: none;
    }

    .user-avatar {
      .size(26px, 26px);
      border-radius: 50%;
      cursor: pointer;
    }
  }
</style>

<!-- avtar upload styling must not be scoped -->
<style lang="less">
  header.app-header {
    height: 40px;
    max-height: 40px;
  }

  // main menu has it's own arrow
  .dropdown-menu {
    &.el-popper {
      .popper__arrow {
        display: none;
      }
    }
  }
</style>
