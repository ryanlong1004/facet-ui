<template>
  <div v-loading="isBusy">
    <div v-if="customDataFields.length === 0" class="no-content">
      <h2>Opps, it appears you haven't setup any custom data fields yet.</h2>
      <p>Navigate to "Admin > Custom Data" to begin adding fields, then return to apply values to multiple items.</p>
      <el-button size="mini" type="primary" @click="goToCustomFieldsPage">Add Custom Fields</el-button>
    </div>
    <div v-else>
      <h2>Apply a custom field value to the {{ selectedItemCountHumanized }}</h2>
      <section class="fields-wrapper">
        <div>
          <el-select
            :disabled="isBusy"
            placeholder="Select Field"
            v-model="selectedDataFieldId"
            @change="resetValue">
            <el-option
              v-for="field in customDataFields"
              :key="field.id"
              :label="field.name"
              :value="field.id">
            </el-option>
          </el-select>
        </div>
        <div class="value-input">
          <div class="value" v-if="selectedFieldType === CONSTANTS.CUSTOM_DATA.VALUES.BOOLEAN">
            <el-radio-group
              v-model="newValue"
              ref="edit-value-input"
            >
              <el-radio :label="true">{{ CONSTANTS.BOOLEAN.TRUE }}</el-radio>
              <el-radio :label="false">{{ CONSTANTS.BOOLEAN.FALSE }}</el-radio>
            </el-radio-group>
          </div>

          <div class="value" v-else-if="selectedFieldType === CONSTANTS.CUSTOM_DATA.VALUES.DATE">
            <el-date-picker
              ref="edit-value-input"
              v-model="newValue"
              type="date"
              :clearable="false"
              prefix-icon=""
              placeholder="yyyy-mm-dd"
              :default-value="newValue"
              format="yyyy-MM-dd"
              value-format="yyyy-MM-dd"
              popper-class="custom-data-datepicker"
            ></el-date-picker>
          </div>

          <div class="value" v-else-if="selectedFieldType === CONSTANTS.CUSTOM_DATA.VALUES.NUMBER">
            <el-input
              ref="edit-value-input"
              size="medium"
              type="number"
              v-model="newValue"
            ></el-input>
          </div>

          <div class="value" v-else>
            <el-input
              ref="edit-value-input"
              v-model="newValue"
            ></el-input>
          </div>
        </div>
      </section>
      <el-button size="mini" type="primary" @click="saveCustomField" :disabled="isButtonDisabled"><i class="fas fa-check"></i> Apply field value</el-button>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { pluralize } from 'humanize-plus'

import { BULK_ACTIONS, CUSTOM_DATA_ADMIN } from 'src/store/storeModules'
import {
  //getters
  IS_BUSY,
  GET_SELECTED_ITEMS,
  // actions
  APPLY_CUSTOM_FIELD_VALUE
} from 'src/store/modules/bulk-actions'
import {
  FETCH_CUSTOM_DATA_FIELDS
} from 'src/store/modules/admin/custom-data/actions'
import {
  GET_CUSTOM_DATA_BUSY,
  GET_CUSTOM_DATA_FIELDS,
  GET_CUSTOM_DATA_ERROR
} from 'src/store/modules/admin/custom-data/getters'

export default {
  name: 'bulk-custom-fields',
  async beforeMount () {
    try {
      await this.fetchCustomDataFields()
    } catch (err) {
      console.error('error loading custom data fields', err)
      this.showNoFieldsError = 'Error loading custom fields'
    }
  },
  data () {
    return {
      newValue: null,
      selectedDataFieldId: '',
      showNoFieldsError: false
    }
  },
  computed: {
    ...mapGetters(BULK_ACTIONS, {
      isBusy: IS_BUSY,
      selectedItems: GET_SELECTED_ITEMS
    }),
    ...mapGetters(CUSTOM_DATA_ADMIN, {
      customDataBusy: GET_CUSTOM_DATA_BUSY,
      customDataFields: GET_CUSTOM_DATA_FIELDS,
      getCustomDataError: GET_CUSTOM_DATA_ERROR
    }),
    isButtonDisabled () {
      return this.isBusy || !this.selectedDataFieldId.length || this.newValue === null
    },
    selectedFieldType () {
      const field = this.customDataFields.find(f => f.id === this.selectedDataFieldId)
      if (field) {
        return field.data_type
      }
      return null
    },
    selectedItemCount () {
      return this.selectedItems.length
    },
    selectedItemCountHumanized () {
      return `${this.selectedItemCount} selected ${pluralize(this.selectedItemCount, 'file', 'files')}`
    }
  },
  methods: {
    ...mapActions(BULK_ACTIONS, {
      applyCustomFieldsValue: APPLY_CUSTOM_FIELD_VALUE
    }),
    ...mapActions(CUSTOM_DATA_ADMIN, {
      fetchCustomDataFields: FETCH_CUSTOM_DATA_FIELDS
    }),
    goToCustomFieldsPage () {
      this.$router.push({
        name: 'admin-custom-data'
      })
    },
    resetValue () {
      this.newValue = null
    },
    async saveCustomField () {
      if (this.isButtonDisabled) {
        return
      }
      try {
        let fields = [{
          field_id: this.selectedDataFieldId,
          value: {}
        }]
        switch (this.selectedFieldType) {
          case this.CONSTANTS.CUSTOM_DATA.VALUES.STRING:
            fields[0].value.string_value = this.newValue
            break
          case this.CONSTANTS.CUSTOM_DATA.VALUES.NUMBER:
            fields[0].value.numeric_value = Number(this.newValue)
            break
          case this.CONSTANTS.CUSTOM_DATA.VALUES.BOOLEAN:
            fields[0].value.bool_value = this.newValue
            break
          case this.CONSTANTS.CUSTOM_DATA.VALUES.DATE:
            fields[0].value.date_value = this.newValue
            break
        }

        await this.applyCustomFieldsValue(fields)

        this.$notify({
          title: `Success`,
          message: `Custom field value successfully applied to selected files`,
          type: 'success'
        });
      } catch (err) {
        console.error('error saving field data', err)
        this.$notify({
          title: 'Error',
          message: 'Error applying custom field value, please try again',
          type: 'error'
        })
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.fields-wrapper {
  .flex-container();
  > div {
    margin-bottom: 20px;
    width: 50%;
    &:first-child {
      margin-right: 8px;
    }
    &:last-child {
      margin-left: 8px;
    }
  }
}
.el-select {
  width: 100%;
}
</style>

<style lang="less">
.fields-wrapper {
  .el-input.el-date-editor .el-input__inner {
    padding-left: 33px;
  }
  .el-input.el-date-editor .el-input__prefix .el-input__icon {
    line-height: 33px;
  }
}
</style>
