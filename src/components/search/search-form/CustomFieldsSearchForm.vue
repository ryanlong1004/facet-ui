<template>
  <div class="custom-fields-search-form">
    <p class="no-data" v-if="!customFields.length">No custom data fields found -- please set them up in the administration panel before searching for them</p>
    <div v-else>
      <table class="current-values" v-if="searchCustomFields.length">
        <thead>
          <tr>
            <th>Field Name</th>
            <th>Value</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="value in searchCustomFields" :key="value.id">
            <td class="name">{{ getFieldName(value.id) }}</td>
            <td class="value" v-if="value.range">{{ value.value[0] }} to {{ value.value[1] }}</td>
            <td class="value" v-else>{{ value.value }}</td>
            <td class="options"><i class="far fa-times remove-field-button" @click="handleRemoveValue(value.id)"></i></td>
          </tr>
        </tbody>
      </table>
      <div class="new-field-row" v-if="availableFields.length > 0">
        <div class="selector">
          <label>{{ selectFieldLabel }}</label>
          <el-select
            v-model="customFieldToAdd"
            @change="handleFieldTypeChanged"
            @keydown.shift.tab.native.exact.stop.prevent="handleShiftTab"
            @keydown.tab.native.exact.stop.prevent="handleLastTab"
            placeholder="Choose a custom field...">
            <el-option v-for="field in availableFields" :key="field.id" :label="field.name" :value="field.id"></el-option>
          </el-select>
        </div>
        <div class="value">
          <label v-if="customFieldToAdd !== null">{{ enterValueLabel }}</label>
          <div v-if="typeOfFieldToAdd === CONSTANTS.CUSTOM_DATA.VALUES.BOOLEAN">
            <el-radio-group v-model="newValue">
              <el-radio :label="true">{{ CONSTANTS.BOOLEAN.TRUE }}</el-radio>
              <el-radio :label="false">{{ CONSTANTS.BOOLEAN.FALSE }}</el-radio>
            </el-radio-group>
          </div>

          <div v-else-if="typeOfFieldToAdd === CONSTANTS.CUSTOM_DATA.VALUES.DATE">
            <el-date-picker
              v-if="newValueType === 'single'"
              v-model="newValue"
              type="date"
              placeholder="yyyy-mm-dd"
              :default-value="newValue"
              format="yyyy-MM-dd"
              value-format="yyyy-MM-dd"
              popper-class="custom-data-datepicker"
            ></el-date-picker>
            <el-date-picker
              v-else
              type="daterange"
              range-separator="to"
              start-placeholder="Start date"
              end-placeholder="End date"
              v-model="newValue"
              :default-value="newValue"
              format="yyyy-MM-dd"
              value-format="yyyy-MM-dd"
              popper-class="custom-data-datepicker"
            ></el-date-picker>
          </div>

          <div v-else-if="typeOfFieldToAdd === CONSTANTS.CUSTOM_DATA.VALUES.NUMBER">
            <el-input
              v-if="newValueType === 'single'"
              size="medium"
              type="number"
              v-model="newValue"
              @keyup.enter.native.stop="handleAddNewField"
            ></el-input>
            <div v-else class="number-range-wrapper">
              <el-input
                size="medium"
                type="number"
                v-model="newValue"
              ></el-input>
              <span>to</span>
              <el-input
                size="medium"
                type="number"
                v-model="newValue2"
                @keyup.enter.native.stop="handleAddNewField"
              ></el-input>
            </div>
          </div>

          <div v-else-if="typeOfFieldToAdd !== null">
            <el-input v-model="newValue" @keyup.enter.native.stop="handleAddNewField"></el-input>
          </div>
        </div> <!-- .value -->

      </div>
      <div class="submit-options-row" v-if="availableFields.length > 0">
        <div>
          <el-button type="primary" size="mini" :disabled="submitDisabled" @click="handleAddNewField">Add to Search</el-button>
        </div>
        <div>
          <el-radio-group v-model="newValueType" v-if="showValueTypeSelector">
            <el-radio label="single">Single value</el-radio>
            <el-radio label="range">Range values</el-radio>
          </el-radio-group>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex'
import {
  CUSTOM_DATA_ADMIN,
  SEARCH
} from 'src/store/storeModules'
import {
  GET_CUSTOM_DATA_FIELDS
} from 'src/store/modules/admin/custom-data/getters'
import {
  FETCH_CUSTOM_DATA_FIELDS
} from 'src/store/modules/admin/custom-data/actions'
import {
  GET_CUSTOM_FIELDS
} from 'src/store/modules/search/getters'
import {
  ADD_CUSTOM_FIELD,
  DELETE_CUSTOM_FIELD
} from 'src/store/modules/search/mutations'

export default {
  name: 'custom-fields-search-form',
  async beforeMount () {
    await this.fetchCustomDataFields()
  },
  data () {
    return {
      customFieldToAdd: null,
      newValue: null,
      newValue2: null,
      newValueType: 'single'
    }
  },
  computed: {
    ...mapGetters(CUSTOM_DATA_ADMIN, {
      customFields: GET_CUSTOM_DATA_FIELDS
    }),
    ...mapGetters(SEARCH, {
      searchCustomFields: GET_CUSTOM_FIELDS
    }),
    availableFields () {
      const usedIds = this.searchCustomFields.map(f => f.id)
      let available = []
      this.customFields.forEach(f => {
        if (usedIds.indexOf(f.id) < 0) {
          available.push(f)
        }
      })
      return available
    },
    enterValueLabel () {
      if (this.typeOfFieldToAdd === this.CONSTANTS.CUSTOM_DATA.VALUES.BOOLEAN) {
        return 'Select a value'
      } else if (this.typeOfFieldToAdd === this.CONSTANTS.CUSTOM_DATA.VALUES.DATE) {
        if (this.newValueType === 'range') {
          return 'Select a date range'
        }
        return 'Select a date'
      } else if (this.typeOfFieldToAdd === this.CONSTANTS.CUSTOM_DATA.VALUES.NUMBER) {
        if (this.newValueType === 'range') {
          return 'Enter a number range'
        }
        return 'Enter a number'
      }
      return 'Enter a value'
    },
    isNumberRangeMode () {
      return this.typeOfFieldToAdd === this.CONSTANTS.CUSTOM_DATA.VALUES.NUMBER && this.newValueType === 'range'
    },
    selectFieldLabel () {
      return 'Add a custom field filter'
    },
    selectedField () {
      return this.customFields.find(f => f.id === this.customFieldToAdd)
    },
    showValueTypeSelector () {
      return this.typeOfFieldToAdd === this.CONSTANTS.CUSTOM_DATA.VALUES.DATE || this.typeOfFieldToAdd === this.CONSTANTS.CUSTOM_DATA.VALUES.NUMBER
    },
    submitDisabled () {
      if (this.isNumberRangeMode) {
        return this.customFieldToAdd === null || this.newValue === null || this.newValue2 === null || this.newValue === this.newValue2
      }
      return this.customFieldToAdd === null || this.newValue === null
    },
    typeOfFieldToAdd () {
      if (this.selectedField) {
        return this.selectedField.data_type
      }
      return null
    }
  },
  methods: {
    ...mapActions(CUSTOM_DATA_ADMIN, {
      fetchCustomDataFields: FETCH_CUSTOM_DATA_FIELDS
    }),
    ...mapMutations(SEARCH, {
      doAddCustomField: ADD_CUSTOM_FIELD,
      doDeleteCustomField: DELETE_CUSTOM_FIELD
    }),
    getFieldName (fieldId) {
      const f = this.customFields.find(f => f.id === fieldId)
      if (f) {
        return f.name
      }
      return ''
    },
    handleAddNewField () {
      if (this.submitDisabled) {
        return false
      }
      if (this.isNumberRangeMode) {
        this.newValue = [Math.min(this.newValue, this.newValue2), Math.max(this.newValue, this.newValue2)]
      }
      console.log('add custom field', this.selectedField)
      this.doAddCustomField({
        id: this.selectedField.id,
        type: this.selectedField.data_type,
        value: this.newValue,
        range: this.newValueType === 'range'
      })
      this.resetForm()
    },
    handleFieldTypeChanged () {
      this.newValue = null
    },
    handleLastTab (e) {
      this.$emit('tab-forward')
    },
    handleShiftTab (e) {
      this.$emit('tab-back')
    },
    handleRemoveValue (fieldId) {
      this.doDeleteCustomField(fieldId)
    },
    resetForm () {
      this.customFieldToAdd = null
      this.newValue = null
      this.newValue2 = null
      this.newValueType = 'single'
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables.less';
@import (reference) '~src/styles/_mixins.less';

.custom-fields-search-form {
  .no-data {
    color: @text-medium;
    font-size: 11px;
    font-style: italic;
  }
  .new-field-row,
  .submit-options-row {
    .flex-container();
    justify-content: flex-start;
    > div:first-child {
      flex: 0 0 275px;
      margin-right: 10px;
    }
    > div:last-child {
      flex: 1 1 auto;
    }
  }
  .new-field-row {
    margin-bottom: 10px;
    .el-select {
      width: 100%;
    }
    .el-input {
      width: 100%;
      .el-input__inner {
        background-color: @color-base;
        height: 33px;
      }
    }
  }
  .el-radio .el-radio__label {
    font-family: @default-font-family-medium;
  }
  .el-date-editor,
  .el-date-editor--daterange.el-input__inner {
    border-radius: 0;
    width: 100%;
  }
  .el-input input,
  .el-select .el-input input.el-input__inner,
  .el-date-editor .el-range-input,
  .el-date-editor .el-range-separator {
    color: @color-primary;
    font-size: 11px;
    font-weight: 300;
  }
  .el-date-editor .el-range-separator {
    line-height: 26px;
    width: 30px;
  }
  .el-date-editor .el-range-input {
    width: 33%;
  }
  .el-date-editor--date {
    .el-input__prefix {
      top: -3px;
    }
    .el-input__inner {
      padding-left: 30px;
    }
  }

  .number-range-wrapper {
    .flex-container();
    justify-content: flex-start;
    span {
      color: @text-medium;
      display: block;
      font-size: 11px;
      margin: 0 10px;
    }
    .el-input {
      width: 130px;
    }
  }

  label {
    color: @color-tone-darkest;
    display: block;
    font-family: @default-font-family-black;
    font-size: 10px;
    font-weight: 200;
    margin-bottom: 5px;
    text-transform: uppercase;
  }
  .current-values {
    width: 100%;
    margin-bottom: 20px;
    thead {
      th {
        border-bottom: 1px dotted @box-border-grey;
        color: @color-tone-darkest;
        font-family: @default-font-family-black;
        font-size: 10px;
        font-weight: 200;
        padding: 0 10px 10px 0;
        text-align: left;
        text-transform: uppercase;
      }
    }
    tbody {
      tr {
        td {
          border-bottom: 1px dotted @box-border-grey;
          color: @color-primary;
          font-size: 12px;
          padding: 8px 10px 8px 0;
          text-align: left;
          vertical-align: top;
          &.name {
            width: 285px;
          }
          &.options {
            text-align: right;
            width: 20px;
          }
          .remove-field-button {
            cursor: pointer;
            &:hover {
              color: @color-accent;
            }
          }
        }
      }      
    }
  } // .current-values table
}
</style>
