<template>
  <div class="field-list">
    <el-tabs v-if="title === PROPERTY_PATHS.AUDIO_TRACK_INFO.title || title === PROPERTY_PATHS.AUDIO_DATA.title" :value="activeTrack">
      <el-tab-pane v-for="(track, index) in data" :key="index" :label="'Track ' + trackNumber(index)" :name="trackNumber(index)">
        <table>
          <tr v-for="(field, key) in data[index]" :key="key">
            <td v-once>{{ niceField(key) }}</td>
            <td>
              <span :innerHTML.prop="field | highlightFilter" v-if="typeof field !== 'object'"></span>
              <table v-if="typeof field === 'object'">
                <tr v-for="(fieldNested, keyNested) in field" :key="keyNested">
                  <td v-once>{{ niceField(keyNested) }}</td>
                  <td class="value">
                    <span>{{fieldNested}}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </el-tab-pane>
    </el-tabs>
    <table v-else>
      <tr v-for="(field, key) in data[0]" :key="key">
        <td v-once>{{ niceField(key) }}</td>
        <td>
          <span :innerHTML.prop="field | highlightFilter" v-if="typeof field !== 'object'"></span>
          <table v-if="typeof field === 'object'">
            <tr v-for="(fieldNested, keyNested) in field" :key="keyNested">
              <td class="collapsing wrapped" v-once>{{ niceField(keyNested) }}</td>
              <td class="value">
                <span
                  v-if="fieldNested.value"
                  v-once
                  innerHTML.prop="fieldNested.value | highlightFilter">
                </span>
                <a :href="'http://www.google.com/maps/place/' + fieldNested.lat + ',' + fieldNested.lon" v-if="fieldNested.lat && fieldNested.lon" v-once>{{ fieldNested.lat }}, {{ fieldNested.lon }}</a>
                <span
                  v-if="!fieldNested.value && !(fieldNested.lat && fieldNested.lon)"
                  v-once
                  :innerHTML.prop="fieldNested | highlightFilter">
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
import { PROPERTY_PATHS } from 'src/property-paths'

export default {
  name: 'field-list',
  props: {
    data: {
      type: Array,
      default: () => []
    },
    title: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      activeTrack: '1',
      PROPERTY_PATHS
    }
  },
  methods: {
    niceField: function (v) {
      // return field as is instead of erroring out
      try {
        return v.split('_').join(' ')
      } catch (_) {
        return v
      }
    },
    trackNumber: function (index) {
      let track = index + 1
      return track.toString()
    }
  }
}
</script>

<style lang="less" scoped>
  @import '~src/styles/field-list-table';

  .field-list table {
    margin-bottom: 10px;
  }
</style>
