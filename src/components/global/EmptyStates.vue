<template>
  <div class="empty-state">
    <div v-if="page === CONSTANTS.EMPTY_STATES.AI_STUDIO.PEOPLE" class="content-wrapper"><!-- PEOPLE -->
      <div class="big-dot">
        <i class="far fa-user"></i>
      </div>
      <h2>Let’s create your first custom person recognition model</h2>
      <div class="detail">
        <div class="left">
          <p>Easily create your own custom machine learning models to recognize people across your content.</p>
          <p>Simply upload examples of the people you would like to be recognized.</p>
        </div>
        <div class="right">
          <h3>ADD VALUABLE CONTEXT TO YOUR CONTENT:</h3>
          <ul>
            <li><i class="far fa-check-circle"></i><span>Find who’s in your content and where</span></li>
            <li><i class="far fa-check-circle"></i><span>Match your content to who’s trending</span></li>
            <li><i class="far fa-check-circle"></i><span>Recognize people who aren’t celebrities</span></li>
          </ul>
        </div>
      </div>
      <help-recog-person></help-recog-person>
    </div>
    <div v-if="page === CONSTANTS.EMPTY_STATES.INSIGHTS" class="content-wrapper"><!-- INSIGHTS -->
      <div class="big-dot">
        <i class="far fa-list"></i>
      </div>
      <h2>Create insights to help find specific words</h2>
      <div class="detail">
        <div class="left">
          <p>Create your own list of terms – highlighting keywords and phrases within speech-to-text, captions, documents and visual text (OCR).</p>
          <p>Click <strong>ADD NEW</strong> to get started.</p>
        </div>
        <div class="right">
          <h3>SAVE VALUABLE TIME BY:</h3>
          <ul>
            <li><i class="far fa-check-circle"></i><span>Understanding what is said or written and where</span></li>
            <li><i class="far fa-check-circle"></i><span>Locating profanity for compliance and brand protection</span></li>
            <li><i class="far fa-check-circle"></i><span>Quickly identifying key terms in documents</span></li>
          </ul>
        </div>
      </div>
    </div>
    <div v-if="page === CONSTANTS.EMPTY_STATES.SAVED_SEARCHES" class="content-wrapper saved-searches"><!-- SAVED_SEARCHES -->
      <div class="big-dot">
        <i class="far fa-star"></i>
      </div>
      <h2>Search queries can be saved for later reference</h2>
      <div class="detail">
        <p>To save a search, complete a search and click <strong>SAVE SEARCH</strong> next to the search bar.</p>
      </div>
      <div class="action">
        <router-link :to="{ name: CONSTANTS.ROUTES.SEARCH.NAME }">Try a new search</router-link>
      </div>
    </div>
    <div v-if="page === CONSTANTS.EMPTY_STATES.CATEGORIES" class="content-wrapper categories"><!-- CATEGORIES -->
      <div class="big-dot">
        <i class="far fa-list-alt"></i>
      </div>
      <h2>Quickly find content with similar attributes</h2>
      <div class="detail">
        <p>Get started by tagging content with your specific category.</p>
        <p>Under the asset detail, simply add tags seperated by commas and that content will appear here sorted by the categories you have created.</p>
      </div>
      <div class="action">
        <router-link :to="{ name: CONSTANTS.ROUTES.SEARCH.NAME }">Find an asset to categorize</router-link>
      </div>
    </div>
    <div v-if="page === CONSTANTS.EMPTY_STATES.COLLECTIONS" class="content-wrapper collections"><!-- COLLECTIONS -->
      <div class="big-dot">
        <i class="icon-collections"></i>
      </div>
      <h2>Quickly share and collaborate with your team</h2>
      <div class="detail">
        <div class="left">
          <p>To start a collection, preform a search query and expand the <strong>COLLECTIONS</strong> pane on the right side of the search results.</p>
          <p>Drag and drop from your search results to a new collection.</p>
          <p>Or add to an existing collection from an asset by clicking the heart below the asset detail.</p>
        </div>
        <div class="right">
          <h3>COLLECTIONS HELP YOU</h3>
          <ul>
            <li><i class="far fa-check-circle"></i><span>Group content for review</span></li>
            <li><i class="far fa-check-circle"></i><span>Share collections to collaborate</span></li>
            <li><i class="far fa-check-circle"></i><span>Quickly access content you work with often</span></li>
          </ul>
          <div class="action">
            <router-link :to="{ name: CONSTANTS.ROUTES.SEARCH.NAME, query: { key: 'default' } }">Start a Collection</router-link>
          </div>
        </div>
      </div>
    </div>
    <div v-if="page === CONSTANTS.EMPTY_STATES.LOCATIONS" class="content-wrapper locations"><!-- LOCATIONS -->
      <div class="big-dot">
        <i class="far fa-cloud"></i>
      </div>
      <h2 style="margin: 20px 0;">Connect directly to popular cloud storage providers</h2>
      <div class="detail">
        <div class="left">
          <p>Connect Curio to your cloud storage accounts to have a single source of truth for all of your content.</p>
          <p>Select which folders you want us to analyze – we’ll scan the folders every hour for new content being added.</p>
          <p>Click ADD NEW to get started.</p>
        </div>
        <div class="right">
          <h3>SAVE VALUABLE TIME:</h3>
          <ul>
            <li><i class="far fa-check-circle"></i><span>Connecting directly to where your content lives</span></li>
            <li><i class="far fa-check-circle"></i><span>The quickest and easiest way to analyze content</span></li>
            <li><i class="far fa-check-circle"></i><span>Provide a single source of truth for your content</span></li>
          </ul>
          <div class="action">
            <router-link :to="{ name: 'admin-add-cloud-storage' }" v-if="$hasScope(SCOPES.STORAGE_MANAGE)">Connect to cloud storage</router-link>
          </div>
        </div>
      </div>
      <aside class="footnote">
        <p>Once you connect to cloud storage, you will be prompted to select which folders you want Curio to analyze. Curio will immediately begin analyzing all content inside those folders. We will also watch those folders for new content being added and analyze that content as well.</p>
        <p><strong><em>Please be aware:</em></strong> This may result in credit and video runtime overages for your plan depending on how much content is in those folders.</p>
      </aside>
    </div>
    <div v-if="page === CONSTANTS.EMPTY_STATES.GM_STORAGE" class="content-wrapper gm-storage"><!-- GRAYMETA STORAGE -->
      <div class="big-dot">
        <i class="far fa-folder-open"></i>
      </div>
      <h2 style="margin: 20px 0;">Storage designed to take teamwork to the next level</h2>
      <div class="detail">
        <div class="left">
          <p>Simplify your work, with a central place to access and share files.</p>
          <p>GrayMeta Storage helps your company grow without limits, while you maintain complete control over your content.</p>
        </div>
        <div class="right">
          <h3>GRAYMETA STORAGE GIVES YOU:</h3>
          <ul>
            <li><i class="far fa-check-circle"></i><span>Space for sharing and collaboration</span></li>
            <li><i class="far fa-check-circle"></i><span>As much space as your team needs</span></li>
            <li><i class="far fa-check-circle"></i><span>Granular sharing permissions</span></li>
          </ul>
        </div>
      </div>
    </div>
    <div v-if="page === CONSTANTS.EMPTY_STATES.AI_STUDIO.AWS_CUSTOM_TAGS" class="content-wrapper aws-custom-tags"><!-- AWS CUSTOM TAGS -->
      <div class="big-dot">
        <i class="far fa-user-tag"></i>
      </div>
      <h2>Custom Tags Project</h2>
      <div class="detail">
        <template v-if="projectImportEnabled">
          <h3>Import or create a new Custom Tags project</h3>
          <p>Custom Tags allows you to easily create machine learning models to identify objects and scenes in images and videos that are specific to your business needs. The first step is to create a project which is where you will manage all aspects of creating, updating, and managing your model.</p>
        </template>
        <template v-else>
          <h3>Get started creating a new Custom Tags project.</h3>
          <p>Custom Tags allows you to easily create machine learning models to identify objects and scenes in images and videos that are specific to your business needs. The first step is to create a project which is where you will manage all aspects of creating, updating, and managing your model.</p>
        </template>
      </div>
      <div class="action">
        <template v-if="isCustomTagsAdmin">
          <router-link v-if="projectImportEnabled" :to="{ name: CONSTANTS.ROUTES.AI_STUDIO.CUSTOM_TAGS.IMPORT_PROJECT.NAME }">Import or Create Project</router-link>
          <router-link v-else :to="{ name: CONSTANTS.ROUTES.AI_STUDIO.CUSTOM_TAGS.CREATE_PROJECT.NAME }">Create Project</router-link>
        </template>
        <p v-else class="no-results">Must have admin privileges to create/import projects.</p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { SCOPES } from 'src/plugins/ScopeEnforcer'
import { SESSION } from 'src/store/storeModules'
import { GET_AWS_CUSTOM_TAGS_IMPORT_ENABLED } from 'src/store/modules/session/session'
import HelpRecogPerson from 'src/components/model-training/HelpRecogPerson'

export default {
  name: 'empty-states',
  components: {HelpRecogPerson},
  computed: {
    ...mapGetters(SESSION, {
      projectImportEnabled: GET_AWS_CUSTOM_TAGS_IMPORT_ENABLED
    }),
    isCustomTagsAdmin () {
      return this.$hasAnyScope(SCOPES.AWS_CUSTOM_TAGS_ADMIN)
    }
  },
  props: {
    page: String
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

// overrides for admin pages with empty states
.admin-page .content {
  h2 {
    margin: 20px 0;
  }

  p {
    font-size: 13px;
    line-height: 1.25;
  }
}

.empty-state {
  color: @color-primary;
  font-size: 12px;
  margin: 20px 0;
  width: 100%;

  h2 {
    font-size: 18px;
    font-weight: 500;
    margin: 20px 0;
  }
  h3 {
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 1px;
  }
  .content-wrapper {
    .flex-container-column();
    .align-items-center();
    margin: 10px 0 0;
    a {
      font-weight: 900;
    }
    p {
      text-align: center;
      margin: 0;
      font-size: 13px;
      line-height: 1.25;
    }
    h2 {
      margin-bottom: 15px;
    }
    &.saved-searches { // saved searches specific styles
      p {
        width: 335px;
      }
    }
    &.aws-custom-tags,
    &.categories {
      .detail {
        flex-direction: column;

        h3 {
          margin-bottom: 10px;
          text-align: center;
        }
        p {
          width: 435px;
        }
      }
    }

    &.gm-storage {
      h3 {
        margin-top: 0;
      }

      p {
        margin-bottom: 13px;
        text-align: left;

        &:last-of-type {
          margin-bottom: 0;
        }
      }
    }
    .big-dot {
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 50px;
      background-color: @color-accent-calm;
      height: 142px;
      width: 142px;
      border-radius: 71px;
      i {
        color: @color-accent-calm-text;
      }
    }
    .detail {
      display: flex;
      font-weight: 300;
      > div {
        padding: 0 20px;
      }
      i.fa-check-circle {
        color: @color-accent;
        font-size: 17px;
        margin-right: 5px
      }
      ul {
        list-style-type: none;
        padding-inline-start: 0;
        li {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }
      }
      .left {
        max-width: 250px;
      }
      .right {
        border-left: 1px solid @color-tone;
        font-size: 14px;
        .action {
          margin-left: 0;
        }
      }
    }
    .action {
      margin: 25px;
      a {
        color: @color-base;
        background: @color-accent-calm;
        line-height: 1.36;
        letter-spacing: 1.1px;
        text-transform: uppercase;
        padding: 8px 15px;
        &:hover {
          text-decoration: none;
        }
      }
    }
    .footnote {
      display: flex;
      flex-direction: column;
      padding-top: 15px;
      max-width: 400px;
      text-align: center;
      > p {
        color: @text-medium;
        font-size: 10px;
      }
    }
  }
}
</style>
