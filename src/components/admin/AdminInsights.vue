<template>
  <div class="admin-page">
    <div class="content">
      <div class="admin-page content-insights" v-if="!loadingInitData">
        <div class="header">
          <h2>Insights</h2>
          <el-button
            :disabled="addingInsight || editingInsight !== null"
            type="text"
            @click="addNewInsight"
            v-if="$hasScope(SCOPES.EDIT_KEYWORDS)"
          >
            <i class="far fa-plus"></i>
            Add New
          </el-button>
        </div>

        <empty-states v-if="!hasInsights" :page="CONSTANTS.EMPTY_STATES.INSIGHTS"></empty-states>

        <table v-else>
          <tbody>
            <tr v-if="addingInsight">
              <td colspan="2" class="alternate-view">
                <el-form
                  :model="formInsight"
                  :rules="validationRules"
                  ref="formNewInsight"
                  status-icon
                  validate-on-rule-change
                >
                  <div class="info">
                    <div class="icon color">
                      <el-color-picker v-model="formInsight.color"></el-color-picker>
                    </div>
                    <div class="contact">
                      <div class="el-form-item el-form-item--feedback is-required">
                        <div class="el-form-item__content">
                          <div class="el-input">
                            <input
                              @keyup.enter="submitInsight"
                              @keyup.esc="abortInsight"
                              autofocus
                              class="el-input__inner"
                              placeholder="Add title"
                              ref="insightName"
                              type="text"
                              v-model="formInsight.name"
                            >
                            <span class="el-input__suffix">
                              <span class="el-input__suffix-inner"></span>
                              <i class="el-input__icon el-input__validateIcon"></i>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div class="el-form-item el-form-item--feedback is-required">
                        <div class="el-form-item__content">
                          <div class="el-input">
                            <input
                              @keyup.enter="submitInsight"
                              @keyup.esc="abortInsight"
                              class="el-input__inner"
                              placeholder="Add new terms seperated by commas"
                              type="text"
                              
                              v-model="formInsight.words"
                            >
                            <span class="el-input__suffix">
                              <span class="el-input__suffix-inner"></span>
                              <i class="el-input__icon el-input__validateIcon"></i>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-form>
              </td>
            </tr>
            <tr v-for="insight in insights" :key="insight.insight_group_id">
              <template v-if="editingInsight === insight">
                <td colspan="2" class="alternate-view">
                  <div class="info">
                    <div class="icon color">
                      <el-color-picker
                        @change="updateInsightColor(insight.insight_group_id, insight.name, insight.color)"
                        v-model="insight.color"
                      ></el-color-picker>
                    </div>
                    <div class="contact">
                      <el-form
                        :model="formInsight"
                        :rules="validationRules"
                        ref="formInsight"
                        status-icon
                        validate-on-rule-change
                      >
                        <div class="el-form-item el-form-item--feedback is-required">
                          <div class="el-form-item__content">
                            <div class="el-input">
                              <input
                                @keyup.enter="updateInsight(insight.insight_group_id, formInsight.name, insight.color, formInsight.words)"
                                @keyup.esc="abortInsight"
                                autofocus
                                class="el-input__inner"
                                ref="insightName"
                                type="text"
                                v-model="formInsight.name"
                              >
                              <span class="el-input__suffix">
                                <span class="el-input__suffix-inner"></span>
                                <i class="el-input__icon el-input__validateIcon"></i>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div class="el-form-item el-form-item--feedback is-required has-keywords">
                          <div class="el-form-item__content">
                            <div class="el-input">
                              <input
                                @keyup.enter="updateInsight(insight.insight_group_id, formInsight.name, insight.color, formInsight.words)"
                                @keyup.esc="abortInsight"
                                class="el-input__inner"
                                type="textarea"
                                autosize
                                v-model="formInsight.words"
                              >
                              <span class="el-input__suffix">
                                <span class="el-input__suffix-inner"></span>
                                <i class="el-input__icon el-input__validateIcon"></i>
                              </span>
                            </div>
                          </div>
                        </div>
                        <input type="hidden" v-model="formInsight.id" />
                      </el-form>
                    </div>
                  </div>
                </td>
              </template>
              <template v-else>
                <td>
                  <div class="info">
                    <div class="icon color">
                      <el-color-picker
                        @change="updateInsightColor(insight.insight_group_id, insight.name, insight.color)"
                        @keyup.esc="abortInsight"
                        v-model="insight.color"
                      ></el-color-picker>
                    </div>
                    <div class="contact">
                      <h3 class="insight-group-name">
                        {{ insight.name }}
                      </h3>
                      <p v-if="insight.words.length >= 1" class="list insight-group-words">
                        <span v-for="(word, index) in insight.words" :key="index">{{ word }}</span>
                      </p>
                    </div>
                  </div>
                </td>
                <td class="edit-options-cell">
                  <div class="admin-table-row-buttons" v-if="$hasScope(SCOPES.EDIT_KEYWORDS)">
                    <el-select
                      v-model="insight.access_groups"
                      class="insight-group-access-groups-select"
                      placeholder="User access groups..."
                      multiple
                      collapse-tags
                      @visible-change="doEditAccessGroups($event, insight.insight_group_id, insight.access_groups)"
                      @remove-tag="deleteEditAccessGroup($event, insight.insight_group_id)"
                      >
                      <el-option
                        v-for="group in allUserGroups"
                        :key="group.id"
                        :label="group.name"
                        :value="group.id">
                      </el-option>
                    </el-select>
                    <el-tooltip
                      class="item"
                      content="Edit Insight"
                      effect="dark"
                      placement="top"
                      :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY">
                      <i class="far fa-pencil admin-table-row-buttons__icon" @click="editInsight(insight)"></i>
                    </el-tooltip>
                    <el-tooltip
                      class="item"
                      content="Delete Insight"
                      effect="dark"
                      placement="top"
                      :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY">
                      <i class="far fa-trash admin-table-row-buttons__icon" @click="deleteInsight(insight.name, insight.insight_group_id)"></i>
                    </el-tooltip>
                  </div>
                </td>
              </template>
            </tr>
          </tbody>
        </table>

      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapGetters, mapActions } from 'vuex'
import Validator from 'async-validator'
import randomColor from 'randomcolor'

import api from 'src/api'
import { getAPIErrorMsg } from 'src/apiHelpers'
import { CONSTANTS } from 'src/constants'
import EmptyStates from 'src/components/global/EmptyStates'
import AlphanumericcommaInput from 'src/directives/alphanumericcomma-input.directive'
import { commaSeparatedNonWesternCharsListToArray } from 'src/string-helper'

import { GROUPS } from 'src/store/storeModules'
import { GET_GROUPS, FETCH_GROUPS } from 'src/store/modules/admin/groups'

const validateKeyword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('Keywords are required.'))
    return
  }
  const words = commaSeparatedNonWesternCharsListToArray(value)
  if (words.some(word => word.length < 2)) {
    callback(new Error('Please provide a keyword with at least 2 alphanumeric characters.'))
  } else {
    callback()
  }
}

const getCleanInsightForm = () => {
  return {
    color: randomColor(),
    id: null,
    name: '',
    words: ''
  }
}

const validationRules = {
  name: [
    {
      message: 'Insight name is required.',
      required: true,
      trigger: 'blur'
    },
    {
      message: 'Please provide an insight name with at least 3 characters.',
      min: 3,
      trigger: 'blur'
    }
  ],
  words: [
    {
      required: true,
      trigger: 'blur',
      validator: validateKeyword
    }
  ]
}

const validator = new Validator(validationRules)

export default {
  name: 'admin-insights',
  components: {EmptyStates},
  watch: {
    formInsight: {
      handler (newValue, oldValue) {
        validator.validate(newValue, (errors, fields) => {
          if (errors) {
            this.errorMessage = errors[0].message
          } else {
            this.errorMessage = null
          }
        })
      },
      deep: true
    }
  },

  directives: {
    AlphanumericcommaInput
  },

  computed: {
    ...mapGetters(GROUPS, {
      allUserGroups: GET_GROUPS
    }),
    hasInsights () {
      return this.insights.length > 0 || this.addingInsight
    },

    isValidForm () {
      return !this.errorMessage
    },

    usedColors () {
      return this.insights.map(g => g.color)
    }
  },

  data () {
    return {
      CONSTANTS,
      addingInsight: false,
      enabled: false,
      editingInsight: null,
      errorMessage: null,
      formInsight: getCleanInsightForm(),
      inputVisible: false,
      insights: [],
      loadingInitData: false,
      userGroupsMap: {},
      validationRules
    }
  },

  async beforeMount () {
    this.loadingInitData = true
    await this.fetchUserGroups()
    await this.loadInsights()
    this.loadingInitData = false
  },

  methods: {
    ...mapActions(GROUPS, {
      fetchUserGroups: FETCH_GROUPS
    }),
    abortInsight () {
      this.addingInsight = false
      this.editingInsight = null
      this.clearFields()
    },

    addNewInsight () {
      this.addingInsight = true
      this.editingInsight = null
      this.formInsight = getCleanInsightForm()
      this.$nextTick(() => this.$refs['insightName'].focus())
    },

    clearFields () {
      this.formInsight = getCleanInsightForm()
    },

    async deleteInsight (name, insightId) {
      try {
        await this.$confirm('Are you sure you want to delete ' + name + '?', 'Warning', {
          cancelButtonText: 'Cancel',
          confirmButtonText: 'OK',
          type: 'warning'
        })

        try {
          await api.deleteKeywordGroup(insightId)
          const insightIndex = this.insights.findIndex(insight => insight.insight_group_id === insightId)
          this.insights.splice(insightIndex, 1)

          this.$message({
            duration: CONSTANTS.MESSAGE_DURATION,
            message: name + ' deleted.',
            showClose: true,
            type: 'success'
          })
          this.loadInsights()
        } catch (err) {
          this.$message({
            duration: CONSTANTS.MESSAGE_DURATION,
            message: getAPIErrorMsg(err),
            showClose: true,
            type: 'error'
          })
        }
      } catch (e) {
        // User canceled
      }
    },

    deleteKeywords (groupId, words) {
      return words.map(word => api.deleteKeyword(groupId, word))
    },

    editInsight (insight) {
      this.addingInsight = false
      this.editingInsight = insight
      this.formInsight = {
        id: insight.insight_group_id,
        name: insight.name,
        words: insight.words.join(', ')
      }
    },

    async loadInsights () {
      try {
        const insightGroups = await api.getKeywords()
        this.insights = insightGroups
        insightGroups.forEach(g => {
          this.userGroupsMap[g.insight_group_id] = g.access_groups || []
        })
      } catch (err) {
        this.$message({
          duration: CONSTANTS.MESSAGE_DURATION,
          message: getAPIErrorMsg(err),
          showClose: true,
          type: 'error'
        })
      }
    },

    showNewKeywordsInput () {
      this.inputVisible = true
    },

    async submitInsight () {
      if (this.usedColors.includes(this.formInsight.color)) {
        this.$message({
          duration: CONSTANTS.MESSAGE_DURATION,
          message: 'A keyword group with that color already exists.',
          showClose: true,
          type: 'error'
        })

        return false
      }

      if (this.isValidForm) {
        const newInsight = {
          color: this.formInsight.color,
          id: this.formInsight.id,
          name: this.formInsight.name,
          words: commaSeparatedNonWesternCharsListToArray(this.formInsight.words)
        }

        try {
          const insight = await api.addKeywordGroup(newInsight.name, newInsight.color, newInsight.words)
          this.insights.unshift(insight)

          this.$message({
            duration: CONSTANTS.MESSAGE_DURATION,
            message: 'New insight created.',
            showClose: true,
            type: 'success'
          })
          this.editingInsight = null
          this.addingInsight = false
          this.clearFields()
        } catch (err) {
          this.$message({
            duration: CONSTANTS.MESSAGE_DURATION,
            message: getAPIErrorMsg(err),
            showClose: true,
            type: 'error'
          })
        }
      } else {
        this.$message({
          duration: CONSTANTS.MESSAGE_DURATION,
          message: this.errorMessage,
          showClose: true,
          type: 'error'
        })
        return false
      }
    },

    async updateInsight (groupId, name, color, wordList) {
      const insight = this.insights.find(insight => insight.insight_group_id === groupId)

      const desiredWords = commaSeparatedNonWesternCharsListToArray(wordList)
      const oldWords = insight.words
      const newWords = _.difference(desiredWords, oldWords)
      const wordsToRemove = _.difference(oldWords, desiredWords)

      if (this.isValidForm) {
        try {
          await Promise.all([
            ...this.deleteKeywords(groupId, wordsToRemove),
            api.addKeyword(groupId, desiredWords),
            api.updateKeywordGroup(groupId, name, color)
          ])

          insight.color = color
          insight.name = name
          insight.words = newWords

          this.$message({
            duration: CONSTANTS.MESSAGE_DURATION,
            message: 'Insight updated.',
            showClose: true,
            type: 'success'
          })

          this.editingInsight = null
          this.clearFields()
          this.loadInsights()
        } catch (err) {
          this.$message({
            duration: CONSTANTS.MESSAGE_DURATION,
            message: getAPIErrorMsg(err),
            showClose: true,
            type: 'error'
          })
        }
      } else {
        this.$message({
          duration: CONSTANTS.MESSAGE_DURATION,
          message: this.errorMessage,
          showClose: true,
          type: 'error'
        })
        return false
      }
    },

    async updateInsightColor (groupId, name, color) {
      try {
        await api.updateKeywordGroup(groupId, name, color)

        this.$message({
          duration: CONSTANTS.MESSAGE_DURATION,
          message: 'Insight color updated.',
          showClose: true,
          type: 'success'
        })
      } catch (err) {
        this.$message({
          duration: CONSTANTS.MESSAGE_DURATION,
          message: getAPIErrorMsg(err),
          showClose: true,
          type: 'error'
        })
      }
    },

    async doEditAccessGroups ($event, insightGroupId, accessGroups = []) {
      if ($event === false) {
        await api.setInsightGroupAccessGroups(insightGroupId, accessGroups)
      }
    },

    async deleteEditAccessGroup (accessGroupId, insightGroupId) {
      await api.deleteInsightGroupAccessGroup(insightGroupId, accessGroupId)
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.admin-page {
  height: 100%;
  overflow-y: auto;
}
.content-insights {
  padding-top: 20px;

  .header {
    display: flex;
    .flex-container-between();
    .align-items-start();

    button {
      padding: 0;
    }
  }

  h3.insight-group-name {
    font-size: 13px;
    margin: 5px 0;
  }

  p.list {
    color: @text-dark;
    font-size: 10px;

    span {
      + span:before {
        content: ", ";
      }
    }
  }

  .edit-options-cell {
    vertical-align: top;
  }

  .admin-table-row-buttons {
    .flex-container();
  }
  .insight-group-access-groups-select {
    margin: 10px 0 0 0;
  }

  i.admin-table-row-buttons__icon {
    font-size: 13px;
    margin-left: 10px;
  }

  .container {
    .flex-box();

    .inner-container {
      flex: 1;
    }
  }

  .el-form-item {
    &.has-tags {
      height: auto;

      .el-tag {
        display: inline-block;
        margin-right: 5px;
      }
    }
  }
}
.admin-page .content .content-insights table {
  margin-bottom: 10px;
  > tbody {
    > tr {
      > td {
        padding: 10px 0;
      }
    }
  }
}
.admin-page .content .info p span {
  color: @text-dark;
}
</style>
