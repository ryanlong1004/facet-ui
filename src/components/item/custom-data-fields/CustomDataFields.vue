<template>
  <section>
    <h4>Custom Fields</h4>
    <div class="field-list" v-loading="busy">
      <table v-if="itemCustomData.length > 0">
        <tbody>
          <tr v-for="field in itemCustomData" :key="field.id">
            <td>
              <div class="cell">
                <span>{{ field.name }}</span>
                <el-tooltip
                  v-if="field.description"
                  :content="field.description"
                  class="item"
                  effect="dark"
                  placement="top"
                  :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
                >
                  <i class="fal fa-question-circle"></i>
                </el-tooltip>
              </div>
            </td>
            <td>
              <div class="cell">
                <custom-data-field
                  :fieldId="field.id"
                  :fieldType="field.type"
                  :fieldValue="field.value"
                  @update-custom-fields="saveValue($event)"
                ></custom-data-field>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="no-results">No custom data fields found.</p>
    </div>
  </section>
</template>

<script>
import {
  mapActions,
  mapGetters,
  mapMutations
} from 'vuex'
import { RESET_ITEM_STORE } from 'src/store/store-helpers'
import { SCOPES } from 'src/plugins/ScopeEnforcer'
import { CUSTOM_DATA, EDIT_MODE } from 'src/store/storeModules'
import { FETCH_ITEM_CUSTOM_DATA, UPSERT_ITEM_CUSTOM_DATA } from 'src/store/modules/item/custom-data-fields/actions'
import {
  GET_CUSTOM_DATA_ERROR,
  GET_ITEM_CUSTOM_DATA,
  GET_ITEM_CUSTOM_DATA_BUSY
} from 'src/store/modules/item/custom-data-fields/getters'
import { SET_EDIT_MODE } from 'src/store/modules/item/edit-mode'

import CustomDataField from './CustomDataField'

export default {
  name: 'custom-data-fields',

  components: {
    CustomDataField
  },

  computed: {
    ...mapGetters(CUSTOM_DATA, {
      busy: GET_ITEM_CUSTOM_DATA_BUSY,
      itemCustomData: GET_ITEM_CUSTOM_DATA,
      error: GET_CUSTOM_DATA_ERROR
    })
  },

  beforeDestroy () {
    this.$store.commit(`${CUSTOM_DATA}/${RESET_ITEM_STORE}`)
  },

  methods: {
    ...mapActions(CUSTOM_DATA, {
      upsertItemCustomData: UPSERT_ITEM_CUSTOM_DATA
    }),

    ...mapMutations(EDIT_MODE, {
      setEditMode: SET_EDIT_MODE
    }),

    async saveValue ($event) {
      try {
        await this.upsertItemCustomData($event.fields)
        $event.fields.map(field => this.setEditMode({ id: field.field_id, editMode: false }))
      } catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: this.error,
          showClose: true,
          type: 'error'
        })
      }
    }
  }
}
</script>

<style lang="less">
.el-tooltip__popper.is-dark {
  z-index: 10001 !important;
}
</style>

<style lang="less" scoped>
  @import '~src/styles/field-list-table';

  section {
    h4 {
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 0.8px;
      line-height: 1.1;
      margin: 0 0 11px;
      text-transform: uppercase;
      padding-left: 10px;
      padding-top: 10px;
    }

    .field-list {
      height: 100%;
      overflow-y: auto;
      padding-left: 10px;
      padding-right: 10px;
      padding-bottom: 50px;

      table {
        tr {
          td {
            border: 1px solid @box-border-grey;
            font-size: 11px;
            width: 65%;

            &:first-child {
              width: 35%;
            }

            .cell {
              .flex-box();
              .align-items-center();
              .justify-content-start();
              min-height: 20px;

              i {
                display: inline-block;
                margin-left: 5px;
                margin-top: -4px;
              }
            }

            .field-value {
              width: 100%;

              .value {
                .flex-container-between();

                i {
                  margin-left: 15px;
                  margin-top: 0;
                }
              }
            }
          }
        }
      }
    }
  }
</style>
