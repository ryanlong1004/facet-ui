<template>
  <div class="admin admin-page">
    <div class="app-fluid-container page-content documentation">
      <div class="app-fluid-container__section--left">
        <div class="documentation-menu" ref="documentation-menu">
          <vue-markdown :source="menu" :postrender="postMenuRender" @rendered="menuRendered"></vue-markdown>
        </div>
      </div>
      <div class="app-fluid-container__section--middle">
        <div class="documentation-content">
          <vue-markdown :source="markdown" :postrender="postDocRender"></vue-markdown>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import VueMarkdown from 'vue-markdown'
import session from 'src/session'

const DOC_PATH = '/docs'
const DEFAULT_DOC_PATH = DOC_PATH + '/README.md'
const HREF_PREFIX = 'href="/#/documentation?doc='

export default {
  name: 'documentation',
  components: {
    VueMarkdown
  },
  data () {
    return {
      session: session,
      markdown: '',
      menu: '',
      folderName: '',
      loading: false,
      menuLinks: []
    }
  },
  watch: {
    '$route.query.doc' (newVal, oldVal) {
      if (newVal) {
        const splitPath = newVal.split('/')
        if (splitPath.length > 1) {
          this.folderName = splitPath[0]
        } else {
          this.folderName = ''
        }
        this.loadDoc(DOC_PATH + '/' + newVal)
        this.highlightActivePage(newVal, oldVal)
      } else {
        this.loadDoc(DEFAULT_DOC_PATH)
      }
    }
  },
  mounted () {
    this.loadMenu(DOC_PATH + '/menu.md')
    if (this.$route.query.doc) {
      this.loadDoc(DOC_PATH + '/' + this.$route.query.doc)
    } else {
      this.loadDoc(DEFAULT_DOC_PATH)
    }
  },
  methods: {
    highlightActivePage (current, old = null) {
      if (old) {
        this.$refs['documentation-menu'].querySelector('a[' + HREF_PREFIX + old + '"]').className = ''
      }
      this.$refs['documentation-menu'].querySelector('a[' + HREF_PREFIX + current + '"]').className = 'active'
    },
    loadMenu (path) {
      this.$http.get(path).then(response => {
        this.menu = response.body
      })
    },
    menuRendered (e) {
      if (e && e.length) {
        this.$nextTick(() => {
          this.menuLinks = this.$refs['documentation-menu'].querySelectorAll('a')
          this.highlightActivePage(this.$route.query.doc || 'README.md')
        })
      }
    },
    loadDoc (path) {
      document.querySelector('div.main-content').scrollTop = 0
      this.session.loading = true
      this.$http.get(path).then(response => {
        this.markdown = response.body
      })
      .finally(() => {
        this.session.loading = false
      })
    },
    postMenuRender (htmlData) {
      return htmlData.replace(/href="/ig, 'href="/#/documentation?doc=')
    },
    postDocRender (htmlData) {
      return htmlData.replace(/href="(.*?)"/g, (a, b, match) => {
        if (b.substr(0, 1) === '#') { // anchor links - kill them
          return ''
        } else if (b.substr(0, 4) === 'http') { // outside links
          return a
        } else if (b.split('/').length === 1) { // relative links in same folder
          return HREF_PREFIX + this.folderName + '/' + b.split('/').pop() + '"'
        } else if (b.substr(0, 3) === '../') { // parent links
          return HREF_PREFIX + b.replace('../', '') + '"'
        }
        return HREF_PREFIX + b + '"'
      })
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.admin-page {
  .app-fluid-container.page-content {
    &.documentation {
      padding: 0;

      .app-fluid-container__section--left {
        .flex(0, 0, 240px);

        .documentation-menu {
          .flex-container-column();
          .align-items-center();
          background-color: @background-dark;
          height: calc(~'100vh - 40px');
          overflow-y: auto;
          padding: 15px 0 0;
          width: 240px;

          h3 {
            font-size: 12px;
            margin: 0;
            text-transform: uppercase;
          }

          ul {
            list-style: none;
            list-style-position: inside;
            margin: 0 0 5px;
            padding: 0 0 10px 15px;
            width: 100%;

            li {
              padding: 0;
            }
          }

          a {
            .flex-container();
            color: @color-tone-darkest;
            font: 500 12px @default-font-family-medium;
            padding: 5px 18px;
            width: 100%;

            &:hover {
              color: @color-accent;
              cursor: pointer;
              text-decoration: none;
            }

            &.active {
              background: @background-darker;
              color: @color-accent;

              + nav {
                background: @background-darker;

                a {
                  background: @background-darker;
                }
              }
            }

            &.inactive {
              color: @color-tone-medium;
              cursor: not-allowed;
              pointer: none;
            }

            i,
            span {
              display: inline-block;
            }

            i {
              font-size: 13px;
            }

            span {
              font-size: 12px;
              margin-left: 10px;
              text-transform: uppercase;
            }
          }
        }
      }

      .app-fluid-container__section--middle {
        .documentation-content {
          background-color: @color-base;
          height: calc(~'100vh - 40px');
          max-width: 880px;
          overflow-y: auto;
          padding: 20px;
          width: calc(~'100% - 200px');

          h1, h2, h3 {
            font-size: 18px;
            font-weight: 500;
            line-height: 1;
            margin: 0 0 20px;
          }

          h2 {
            font-size: 16px;
          }

          h3 {
            font-size: 15px;
          }

          ul, p, td {
            font-size: 13px;
            line-height: 1.67;
            margin: 0 0 20px;
          }

          th {
            text-align: left;
          }

          a[href] { // only highlight a's with an href attr
            color: @color-anchor;
            text-decoration: underline;

            &:hover {
              color: @color-accent;
            }
          }

          sub {
            color: @color-alert;
            font-size: 10px;
          }

          code, pre {
            background-color: @color-tone-light;
            overflow: scroll;
          }

          pre {
            padding: 15px;
          }
        }
      }
    }
  }
}
</style>
