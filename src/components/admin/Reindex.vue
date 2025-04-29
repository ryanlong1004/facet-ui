<template>
  <div class="">
    <div class="wrapper">
      <el-select
        class="collection-selection-box"
        v-model="selectedIndex"
        placeholder="Choose index..."
      >
        <el-option
          v-for="index in indexes"
          :key="index"
          :label="index"
          :value="index">
        </el-option>
      </el-select>
      <el-button
        class="delete-recently-walked"
        type="primary"
        @click="reindexAll(selectedIndex)"
        :disabled="saving || !selectedIndex"
      >Reindex</el-button>

      <el-select
        class="collection-selection-box"
        v-model="selectedCache"
        placeholder="Choose cache..."
      >
        <el-option
          v-for="item in caches"
          :key="item"
          :label="item"
          :value="item">
        </el-option>
      </el-select>
      <el-button
        class="delete-recently-walked"
        type="primary"
        @click="deleteCache(selectedCache)"
        :disabled="saving || !selectedCache"
      >Delete cache</el-button>

      <el-input
        class="item-id-reindex"
        v-model="itemIdReindex"
        placeholder="Item ID"
      ></el-input>
      <el-button
        class="reindex-item-button"
        type="primary"
        @click="reindexItem(itemIdReindex)"
        :disabled="saving || itemIdReindex === ''"
      >Re-index</el-button>

      <el-input
        class="item-id-reharvest"
        v-model="itemIdReharvest"
        placeholder="Item ID"
      ></el-input>
      <el-button
        class="reharvest-item-button"
        type="primary"
        @click="reharvestItem(itemIdReharvest)"
        :disabled="saving || itemIdReharvest === ''"
      >Force Re-harvest</el-button>
    </div>
    <pre>
      {{ systemStats }}
    </pre>
  </div>
</template>

<script>
  import api from 'src/api'
  import {getAPIErrorMsg} from 'src/apiHelpers'

  export default {
    name: 'reindex',

    data () {
      return {
        indexes: [],
        selectedIndex: null,
        caches: [],
        selectedCache: null,
        saving: false,
        itemIdReindex: '',
        itemIdReharvest: '',
        systemStats: {}
      }
    },

    beforeMount () {
      this.getQueueDepths()
      this.getCaches()
      this.getIndices()
    },

    methods: {
      async getCaches () {
        try {
          this.caches = await api.getCaches()
        } catch (err) {
          console.error(err)
        }
      },

      async getQueueDepths () {
        try {
          this.systemStats = await api.getQueueDepths()
        } catch (err) {
          console.error(err)
        }
      },

      async deleteCache (cache) {
        this.saving = true
        try {
          await api.deleteCache(cache)
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            showClose: true,
            message: 'Cache cleared.',
            type: 'success'
          })
        } catch (err) {
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: getAPIErrorMsg(err),
            showClose: true,
            type: 'error'
          })
        } finally {
          this.saving = false
        }
      },

      async reindexItem (itemId) {
        this.saving = true

        try {
          await api.reindexItem(itemId)
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            showClose: true,
            message: 'Reindexing file now.',
            type: 'success'
          })
        } catch (err) {
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: 'There was an error reindexing.',
            showClose: true,
            type: 'error'
          })
        } finally {
          this.saving = false
        }
      },

      async reharvestItem (itemId) {
        this.saving = true
        try {
          await api.reharvestItem(itemId)
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            showClose: true,
            message: 'Reharvesting this file now.',
            type: 'success'
          })
        } catch (err) {
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: 'There was an error reharvesting.',
            showClose: true,
            type: 'error'
          })
        } finally {
          this.saving = false
        }
      },

      async getIndices () {
        let indices
        try {
          const response = await api.getIndexes()
          indices = response.indexes
        } catch (err) {
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: getAPIErrorMsg(err),
            showClose: true,
            type: 'error'
          })
        }
        if (indices) {
          this.indexes = ['all'].concat(indices)
        }
      },

      async reindexAll (selectedIndex) {
        if (!selectedIndex) {
          return
        }

        let indexes = [selectedIndex]
        if (selectedIndex === 'all') {
          indexes = this.indexes.filter(index => index !== 'all')
        }

        this.saving = true
        try {
          await api.reindex(indexes)
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            showClose: true,
            message: 'Re-index started',
            type: 'success'
          })
        } catch (err) {
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: getAPIErrorMsg(err),
            showClose: true,
            type: 'error'
          })
        } finally {
          this.saving = false
        }
      }
    }
  }
</script>

<style lang="less">
@import '~src/styles/selection-box.less';
</style>

<style lang="less" scoped>
  .wrapper {
    display: grid;
    grid-template-columns: 300px 300px;
    grid-gap: 5px;
    padding:  50px;

    .complete-span {
      text-align: center;
    }

    .buffer {
      height: 35px;
    }
  }
</style>
