<template>
  <div class="field-value">
    <div
      class="value"
      :class="{ 'is-boolean': isValidBoolean }"
      v-if="!editMode"
    >
      <span v-if="showNoValueMessage">{{ noValueMessage }}</span>
      <span v-else :innerHTML.prop="encodeValue.toString() | highlightFilter"></span>
      <pencil-edit-button
        v-if="canEdit"
        :edit-mode="editMode[fieldId]"
        @on-click="doToggleEditMode"
      ></pencil-edit-button>
    </div>

    <template v-else>
      <div class="value" v-if="fieldType === CONSTANTS.CUSTOM_DATA.VALUES.BOOLEAN">
        <el-radio-group
          v-model="newValue"
          ref="edit-value-input"
          @change="saveValue"
        >
          <el-radio :label="true">{{ CONSTANTS.BOOLEAN.TRUE }}</el-radio>
          <el-radio :label="false">{{ CONSTANTS.BOOLEAN.FALSE }}</el-radio>
        </el-radio-group>
        <i class="far fa-times" @click="cancelEditMode"></i>
      </div>

      <div class="value" v-else-if="fieldType === CONSTANTS.CUSTOM_DATA.VALUES.DATE">
        <el-date-picker
          ref="edit-value-input"
          v-model="newValue"
          type="date"
          placeholder="yyyy-mm-dd"
          :default-value="newValue"
          format="yyyy-MM-dd"
          value-format="yyyy-MM-dd"
          popper-class="custom-data-datepicker"
          @blur="cancelEditMode"
          @change="saveValue"
          @keydown.enter.native="saveValue"
        ></el-date-picker>
        <i class="far fa-times" @click="cancelEditMode"></i>
      </div>

      <div class="value" v-else-if="fieldType === CONSTANTS.CUSTOM_DATA.VALUES.NUMBER">
        <el-input
          ref="edit-value-input"
          size="medium"
          type="number"
          v-model="newValue"
          @blur="cancelOrSave"
          @keydown.enter.native="saveValue"
        ></el-input>
        <i class="far fa-times" @click="cancelEditMode"></i>
      </div>

      <div class="value" v-else>
        <el-input
          clearable
          ref="edit-value-input"
          v-model="newValue"
          @blur="cancelOrSave"
          @clear="saveValue"
          @keydown.enter.native="saveValue"
        ></el-input>
        <i class="far fa-times" @click="cancelEditMode"></i>
      </div>
    </template>
  </div>
</template>

<script>
import _ from 'lodash'
import momemt from 'moment'
import { AllHtmlEntities } from 'html-entities'
import {
  mapActions,
  mapGetters,
  mapMutations
} from 'vuex'

import { SCOPES } from 'src/plugins/ScopeEnforcer'
import { EDIT_MODE } from 'src/store/storeModules'
import {
  GET_EDIT_MODE,
  SET_EDIT_MODE,
  TOGGLE_EDIT_MODE
} from 'src/store/modules/item/edit-mode'

import PencilEditButton from 'src/components/global/PencilEditButton.vue'

export default {
  name: 'custom-data-field',

  components: {
    PencilEditButton
  },

  props: {
    fieldId: {
      type: String,
      required: true
    },

    fieldType: {
      type: String,
      required: true
    },

    fieldValue: {
      type: Number | Boolean | String,
      required: true
    },

    noValueMessage: {
      type: String,
      default: 'No value provided...'
    },

    showEdit: {
      type: Boolean,
      default: true
    }
  },

  data () {
    return {
      newValue: this.fieldValue
    }
  },

  computed: {
    ...mapGetters(EDIT_MODE, {
      rawEditMode: GET_EDIT_MODE
    }),

    canEdit () {
      return this.showEdit && this.$hasScope(SCOPES.EDIT_FIELDS)
    },

    editMode () {
      return this.rawEditMode[this.fieldId] || false
    },

    encodeValue () {
      return (this.fieldType === this.CONSTANTS.CUSTOM_DATA.VALUES.STRING) ? AllHtmlEntities.encode(this.newValue) : this.newValue
    },

    hasChanged () {
      return this.fieldValue !== this.newValue
    },

    isValidBoolean () {
      return ((this.fieldType === this.CONSTANTS.CUSTOM_DATA.VALUES.BOOLEAN) && this.newValue !== undefined)
    },

    showNoValueMessage () {
      return this.newValue === '' || this.newValue === undefined || this.newValue === null
    }
  },

  mounted () {
    this.$watch('editMode', newVal => {
      if (newVal && this.fieldType !== this.CONSTANTS.CUSTOM_DATA.VALUES.BOOLEAN) {
        this.$nextTick(() => {
          this.$refs['edit-value-input'].focus()
        })
      }
    })
  },

  methods: {
    ...mapMutations(EDIT_MODE, {
      setEditMode: SET_EDIT_MODE,
      toggleEditMode: TOGGLE_EDIT_MODE
    }),

    cancelOrSave () {
      this.hasChanged ? this.saveValue() : this.cancelEditMode()
    },

    cancelEditMode () {
      if (this.rawEditMode[this.fieldId]) {
        this.setEditMode({ id: this.fieldId, editMode: false })
      }
    },

    doToggleEditMode () {
      this.toggleEditMode({ id: this.fieldId })
    },

    saveValue (e) {
      const fields = []

      if (this.fieldType === this.CONSTANTS.CUSTOM_DATA.VALUES.STRING) {
        fields.push({
          'field_id': this.fieldId,
          'value': {
            'string_value': this.newValue
          }
        })
      }

      if (this.fieldType === this.CONSTANTS.CUSTOM_DATA.VALUES.NUMBER) {
        fields.push({
          'field_id': this.fieldId,
          'value': {
            'numeric_value': Number(this.newValue)
          }
        })
      }

      if (this.fieldType === this.CONSTANTS.CUSTOM_DATA.VALUES.BOOLEAN) {
        fields.push({
          'field_id': this.fieldId,
          'value': {
            'bool_value': this.newValue
          }
        })
      }

      if (this.fieldType === this.CONSTANTS.CUSTOM_DATA.VALUES.DATE) {
        fields.push({
          'field_id': this.fieldId,
          'value': {
            'date_value': this.newValue
          }
        })
      }

      this.$emit('update-custom-fields', { fields })
    }
  }
}
</script>

<style lang="less">
  @import (reference) '~src/styles/_mixins';
  @import '~src/styles/forms';

  .value {
    .el-input .el-input__inner {
      .size(100%, 20px);
      font-size: 11px;
      line-height: 1;
      padding-left: 10px;
    }

    .el-input__prefix,
    .el-input__suffix,
    .el-input__icon.el-icon-time,
    .el-input__icon.el-icon-date {
      display: none;
    }

    .el-radio__label {
      font-size: 11px;
    }
  }

  .custom-data-datepicker {
    z-index: 10000 !important; // need to match the z-index on the dialog
  }
</style>

<style lang="less" scoped>
  @import '~src/styles/field-list-table';

  .field-list {
    table {
      tr {
        td {
          .field-value {
            .value {
              .flex-container-between();

              &.is-boolean {
                text-transform: uppercase;
              }

              i {
                display: inline-block;
                margin-left: 15px;

                &:hover {
                  color: @color-accent;
                }
              }
            }
          }
        }
      }
    }
  }
</style>
