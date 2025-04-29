<template>
  <div class="content content-custom-data">
    <section ref="top" class="header">
      <h2>Custom Data</h2>
    </section>
    <section ref="preamble">
      <p>Create Custom Fields for your data:</p>
      <p>Your Custom Fields will be displayed in the Custom Data tab within the Technical Metadata popup.</p>
      <ol>
        <li>Click "+ Add New Field"</li>
        <li>Provide a label for your field - the label is what users will see in Wasabi AiR™.</li>
        <li>Select a data type for your field. Note: Data types cannot be changed once set.</li>
        <li>All fields will be searchable.</li>
        <li>Only 2 fields max can be set to display in search results at a given time.</li>
        <li>Fields can be re-ordered to display in a specific order on item detail and search results pages.</li>
      </ol>
    </section>
    <section ref="actions">
      <el-button type="primary"
        class="add-new-field"
        size="mini"
        @click="stageNewCustomDataField()">
        <i class="far fa-plus"></i>
        Add New Field
      </el-button>
    </section>
    <section ref="fields" v-loading="busy">
      <div class="custom-data-fields" v-if="customDataFields.length">
        <div class="field-row field-headers">
          <div class="field-name">Field Name</div>
          <div class="field-type">Type</div>
          <div class="field-description">Description</div>
          <div class="field-display-in-results">In search results?</div>
          <div class="field-actions"></div>
        </div>
        <draggable v-model="fieldsList" handle=".drag-handle">
          <div class="field-row" v-for="field in fieldsList" :key="field.id">
            <!-- field name -->
            <div class="field-name">
              <el-input
                v-if="field.isEditing"
                v-model="field.name"
                placeholder="Enter label"
                :ref="`edit-label-input-${field.id}`"
                @keyup.enter.native="saveField(field)"
                @keyup.esc.native="cancelEdit(field.id)"
              ></el-input>
              <div v-else>{{ field.name }}</div>
            </div>

            <!-- field type -->
            <div class="field-type">
              <el-select v-if="field.isNew" v-model="field.data_type">
                <el-option
                  v-for="option in fieldTypeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                ></el-option>
              </el-select>
              <div v-else>{{ field.data_type }}</div>
            </div>

            <!-- description -->
            <div class="field-description">
              <el-input
                v-if="field.isEditing"
                v-model="field.description"
                placeholder="Enter description"
                :ref="`edit-description-input-${field.id}`"
                @keyup.enter.native="saveField(field)"
                @keyup.esc.native="cancelEdit(field.id)"
              ></el-input>
              <div v-else>{{ field.description }}</div>
            </div>

            <!-- display in results -->
            <div class="field-display-in-results">
              <p v-if="field.isNew || field.isEditing">--</p>
              <el-checkbox
                v-else
                :disabled="field.display_in_search_results === false && searchResultsFieldsLimited"
                :checked="field.display_in_search_results === true"
                @change="handleToggleDisplaySearchResults(field.id, !field.display_in_search_results)">
              </el-checkbox>
            </div>

            <!-- buttons -->
            <div class="field-actions">
              <el-tooltip
                v-if="!isEditing"
                content="Re-order fields"
                effect="dark"
                :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
                placement="top">
                <i class="drag-handle fas fa-grip-lines"></i>
              </el-tooltip>
              <el-tooltip
                v-if="!field.isEditing"
                content="Edit Custom Field"
                effect="dark"
                :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
                placement="top">
                <i class="far fa-pencil admin-table-row-buttons__icon"
                  @click="editCustomDataField(field.id)"></i>
              </el-tooltip>
              <el-tooltip
                v-if="field.id.length && !field.isEditing"
                content="Delete Custom Field"
                effect="dark"
                :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
                placement="top">
                <i class="far fa-trash admin-table-row-buttons__icon"
                  @click="deleteField(field.id)"></i>
              </el-tooltip>
              <el-tooltip
                v-if="field.isEditing"
                content="Cancel"
                effect="dark"
                :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
                placement="top">
                <i class="far fa-times admin-table-row-buttons__icon"
                  @click="cancelEdit(field.id)"></i>
              </el-tooltip>
            </div>

          </div>
        </draggable>
      </div>
      <div v-else class="fields-empty">
        <p>No custom data fields created.</p>
      </div>
    </section>
  </div>
</template>

<script>
import _ from 'lodash'
import draggable from 'vuedraggable'
import { mapActions, mapGetters } from 'vuex'

import {
  CANCEL_CUSTOM_DATA_FIELD,
  CANCEL_EDIT,
  CREATE_CUSTOM_DATA_FIELD,
  DELETE_CUSTOM_DATA_FIELD,
  EDIT_CUSTOM_DATA_FIELD,
  FETCH_CUSTOM_DATA_FIELDS,
  SAVE_CUSTOM_DATA_FIELD,
  STAGE_NEW_CUSTOM_DATA_FIELD,
  UPDATE_CUSTOM_DATA_FIELD,
  SET_DISPLAY_IN_SEARCH_RESULTS,
  SET_DISPLAY_ORDER
} from 'src/store/modules/admin/custom-data/actions'
import {
  GET_CUSTOM_DATA_BUSY,
  GET_CUSTOM_DATA_FIELDS,
  GET_CUSTOM_DATA_ERROR,
  GET_LATEST_EDIT_FIELD_ID
} from 'src/store/modules/admin/custom-data/getters'
import { CUSTOM_DATA_ADMIN } from 'src/store/storeModules'
import {
  REMOVE_NEW_CUSTOM_DATA_FIELD,
  SET_CUSTOM_DATA_FIELD_IS_EDITING
} from 'src/store/modules/admin/custom-data/mutations'

const FIELD_TYPE_OPTIONS = [
  { value: 'bool', label: 'Boolean (Yes or No)' },
  { value: 'date', label: 'Date' },
  { value: 'number', label: 'Number' },
  { value: 'string', label: 'String' }
]

export default {
  name: 'admin-custom-data',

  components: {
    draggable
  },

  data () {
    return {
      fieldTypeOptions: FIELD_TYPE_OPTIONS
    }
  },

  computed: {
    ...mapGetters(CUSTOM_DATA_ADMIN, {
      busy: GET_CUSTOM_DATA_BUSY,
      customDataFields: GET_CUSTOM_DATA_FIELDS,
      getCustomDataError: GET_CUSTOM_DATA_ERROR,
      getLatestEditFieldId: GET_LATEST_EDIT_FIELD_ID
    }),
    fieldsList: {
      get () {
        return this.customDataFields
      },
      async set (updatedList) {
        let order = 0
        const ordered = updatedList.map(f => {
          return {
            id: f.id,
            order: ++order
          }
        })
        await this.doSetDisplayOrder(ordered)
      }
    },
    isEditing () {
      let editing = false
      this.customDataFields.forEach(f => {
        if (f.isEditing) {
          editing = true
        }
      })
      return editing
    },
    numDisplayInResults () {
      return this.customDataFields.filter(f => f.display_in_search_results === true).length
    },
    searchResultsFieldsLimited () {
      return this.numDisplayInResults >= 2
    }
  },

  async mounted () {
    await this.loadCustomDataFields()
  },

  updated () {
    if (this.getLatestEditFieldId) {
      if (this.$refs['edit-label-input-' + this.getLatestEditFieldId] && this.$refs['edit-label-input-' + this.getLatestEditFieldId].length > 0 && this.$refs['edit-label-input-' + this.getLatestEditFieldId][0]) {
        if (document.activeElement !== this.$refs['edit-label-input-' + this.getLatestEditFieldId][0].$refs.input && document.activeElement !== this.$refs['edit-description-input-' + this.getLatestEditFieldId][0].$refs.input) {
          this.$refs['edit-label-input-' + this.getLatestEditFieldId][0].focus()
        }
      }
    }
  },

  methods: {
    ...mapActions(CUSTOM_DATA_ADMIN, {
      stageNewCustomDataField: STAGE_NEW_CUSTOM_DATA_FIELD,
      cancelEdit: CANCEL_EDIT,
      createCustomDataField: CREATE_CUSTOM_DATA_FIELD,
      editCustomDataField: EDIT_CUSTOM_DATA_FIELD,
      deleteCustomDataField: DELETE_CUSTOM_DATA_FIELD,
      loadCustomDataFields: FETCH_CUSTOM_DATA_FIELDS,
      saveCustomDataField: SAVE_CUSTOM_DATA_FIELD,
      updateCustomDataField: UPDATE_CUSTOM_DATA_FIELD,
      doSetDisplayInSearchResults: SET_DISPLAY_IN_SEARCH_RESULTS,
      doSetDisplayOrder: SET_DISPLAY_ORDER
    }),

    async deleteField (fieldId) {
      try {
        await this.$confirm('Are you sure you want to delete this field? If you continue, all data stored in this field will be lost.', 'Delete Confirmation', {
          cancelButtonText: 'Cancel',
          confirmButtonText: 'Delete Custom Field',
          type: 'warning'
        })
        this.doDeleteCustomDataField(fieldId)
      } catch (err) {
        // This catches the user's choice to cancel the field deletion, no further action needed.
      }
    },

    async doDeleteCustomDataField (fieldId) {
      try {
        await this.deleteCustomDataField(fieldId)
      } catch (err) {
        this.$message({
          duration: CONSTANTS.MESSAGE_DURATION,
          message: `Error deleting field: ${this.getCustomDataError}`,
          showClose: true,
          type: 'error'
        })
      }
    },

    async handleToggleDisplaySearchResults (fieldId, display = false) {
      if (this.searchResultsFieldsLimited && display) {
        return
      }
      try {
        await this.doSetDisplayInSearchResults({ fieldId, display })
      } catch (err) {
        this.$notify({
          type: 'error',
          title: 'Error',
          message: 'Unable to toggle search results display, please try again'
        })
      }
    },

    async saveField (field) {
      try {
        await this.saveCustomDataField(field)
      } catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: `Error saving field: ${this.getCustomDataError}`,
          showClose: true,
          type: 'error'
        })
      }
    },

    sortByNewThenName (a, b) {
      // keep new field rows sorted at the top of table while editing
      return !(a.isNew)
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.content-custom-data {
  font-size: 13px;
  letter-spacing: normal;
  max-width: 900px;

  .header {
    margin-top: 10px;
  }

  ol {
    padding-left: 0;
    list-style-position: inside;

    li {
      font-size: 12px;
      margin-bottom: 3px;
    }
  }

  .add-new-field {
    font-family: 'Roboto Black';
  }

  .custom-data-fields {
    width: 100%;
    .field-row {
      border-bottom: 1px solid @box-border-grey;
      padding: 10px 0;
      width: 100%;
      &.field-headers {
        color: @text-light;
        font-family: @default-font-family-medium;
        font-size: 10px;
        text-transform: uppercase;
      }
      > div {
        margin-right: 10px;
        &:last-child {
          margin-right: 0;
        }
      }
      .el-input {
        margin-bottom: 0;
      }
      .flex-container-between();
      width: 100%;
      .field-name {
        flex: 0 0 200px;
      }
      .field-type {
        flex: 0 0 160px;
        .el-select .el-input .el-input__inner {
          width: 160px;
        }
      }
      .field-description {
        flex: 1 1 auto;
      }
      .field-display-in-results {
        flex: 0 0 80px;
        text-align: center;
        > label {
          width: auto;
        }
      }
      .field-actions {
        flex: 0 0 50px;
        text-align: right;
        i {
          color: @text-dark;
          cursor: pointer;
          font-size: 12px;
          margin-right: 4px;
          &:hover {
            color: @color-accent;
          }
          &:last-child {
            margin-right: 0;
          }
          &.drag-handle {
            cursor: move;
          }
        }
      }
    }
  }
}
</style>
