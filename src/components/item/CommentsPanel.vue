<template>
  <div>
    <div class="comments" :class="{ 'open': open === true }">
      <div class="title">File Comments</div>
      <template v-if="response">
        <form class="submit-form">
          <el-input type="textarea" resize="none" v-model="usersComments" placeholder="Write a comment..." @keyup.native.enter.prevent.stop="onSubmit($event)"></el-input>
        </form>
        <div class="comments-list">
          <template v-for="item in response.comments">
            <div class='comment'>
              <div class='comment-header'>
                <i class="comment-header-icon far fa-user" aria-hidden="true"></i>
                <h4 class="comment-header-author">{{ item.author.email }}</h4>
                <h6 class="comment-header-date">{{ item.fromNow }}</h6>
              </div>
              <div class="comment-body">{{ fixCopy(item.body) }}</div>
            </div>
          </template>
        </div>
      </template>
      <h1 v-else>Loading...</h1>
    </div>
  </div>
</template>

<script>
import api from '../../api'
import moment from 'moment'
import _ from 'lodash'
import { pluralize } from 'humanize-plus'

export default {
  name: 'comments-panel',
  props: {
    open: {
      type: Boolean,
      default: false
    }
  },
  data: function () {
    return {
      id: '',
      loading: null,
      loadingOverlay: null,
      response: null,
      usersComments: '',
      pageNumber: 0,
      loadedCommentCount: 'loading',
      showToolTip: false
    }
  },
  watch: {
    'open': function () {
      // load new comments if
      // 1. we are showing
      // 2. we have no previous response
      // 3 if we do make sure its not the same response
      if (this.open && (!this.response || this.response._id !== this.id)) {
        this.loadComments()
      }
    },
    '$route.path' (newVal, oldVal) {
      this.loadComments()
    }
  },
  computed: {
    getCommentsLengthString: function () {
      if (!this.response || !this.response.comments) {
        return false
      }
      if (this.response.comments.length === 1) {
        return 'comment'
      } else {
        return 'comments'
      }
    },
    commentCount: function () {
      return this.loadedCommentCount + ' ' + pluralize(this.loadedCommentCount, 'comment')
    }
  },
  mounted: function () {
    this._readId()
  },
  methods: {
    _readId () {
      if (this.$route.path.indexOf('item') > -1) {
        this.id = this.$route.params.id
      }
    },

    loadComments: function () {
      this._readId()
      this.loading = true
      api.getComments('item', this.id, this.pageNumber)
      .then((response) => {
        this.loading = false
        // API will return null when there are no comments
        if (response.comments === null) {
          response.comments = []
        }
        _.each(response.comments, (comment) => {
          comment.fromNow = moment.min(moment(), moment(comment.ctime)).fromNow()
        })
        response.comments.reverse()
        this.loadedCommentCount = response.comments.length
        this.response = response
      })
      .catch((err) => {
        console.error(err)
        this.loading = false
      })
      .finally(() => {
        this.loading = false
      })
    },
    fixCopy: function (str) {
      var element = document.createElement('div')
      if (str && typeof str === 'string') {
        str = escape(str).replace(/%26/g, '&').replace(/%23/g, '#').replace(/%3B/g, ';')
        element.innerHTML = str
        if (element.innerText) {
          str = element.innerText
          element.innerText = ''
        } else {
          str = element.textContent
          element.textContent = ''
        }
      }
      return unescape(str)
    },
    onSubmit: function ($event) {
      if (this.usersComments.trim().length === 0) {
        return false
      }
      this.loading = true
      api.putComments('item', this.id, this.usersComments.trim())
      .then((response) => {
        this.usersComments = ''
        this.loadComments()
        this.showToolTip = true
      })
      return false
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
  .comments {
    /*margin: 15px;*/
    color: @color-base;

    h1 {
      margin: 15px;
    }

    .title {
      padding-bottom: 10px;
      margin-top: 15px;
      margin-left: 15px;
      margin-right: 15px;
      border-bottom: solid 1px gray;
    }

    .submit-form {
      background-color: @color-primary;
      padding: 15px;
    }

    .comments-list {
      // comments header is 64px, footer is 84px, app header is 60px
      height: ~'calc(100vh - 188px)';
      overflow-y: auto;
      padding-right: 15px;
      padding-left: 15px;

      .comment {
        border-bottom: 1px dashed @box-border-grey;
        padding-bottom: 15px;
        margin-bottom: 15px;

        .comment-header > * {
          display: inline-block;
        }

        .comment-header {
          .comment-header-icon {
            color: darkgray;
            margin-right: 5px;
          }

          .comment-header-author {
            color: darkgray;
            margin-top: 10px;
            margin-bottom: 10px;
            margin-right: 10px;
          }

          .comment-header-date {
            color: lightgray;
            margin-top: 10px;
            margin-bottom: 10px;
          }
        }
      }

    }

  }

</style>
