<template>
  <ul class="people-filtering-sorting">
    <li class="filter">
      <div :class="{ active: personType === CONSTANTS.PEOPLE_TYPES.KNOWN }" @click="changePersonType(CONSTANTS.PEOPLE_TYPES.KNOWN)"><i class="fa-circle" :class="{ 'fas': personType === CONSTANTS.PEOPLE_TYPES.KNOWN, 'far': personType !== CONSTANTS.PEOPLE_TYPES.KNOWN }"></i>Known</div>
      <div :class="{ active: personType === CONSTANTS.PEOPLE_TYPES.UNKNOWN }" @click="changePersonType(CONSTANTS.PEOPLE_TYPES.UNKNOWN)"><i class="fa-circle" :class="{ 'fas': personType === CONSTANTS.PEOPLE_TYPES.UNKNOWN, 'far': personType !== CONSTANTS.PEOPLE_TYPES.UNKNOWN }"></i>Unknown</div>
    </li>
    <li
      v-if="showSorting"
      class="sort"
      :class="{ active: sortBy === CONSTANTS.PEOPLE_SORT_TYPES.NAME }"
      @click.stop="sort(CONSTANTS.PEOPLE_SORT_TYPES.NAME)">
      <i v-if="sortBy === CONSTANTS.PEOPLE_SORT_TYPES.NAME" class="fas" :class="{ 'fa-angle-down': sortDirection === 1, 'fa-angle-up': sortDirection === -1 }"></i> A-Z
    </li>
    <li
      v-if="showSorting"
      class="sort"
      :class="{ active: sortBy === CONSTANTS.PEOPLE_SORT_TYPES.COUNT }"
      @click.stop="sort(CONSTANTS.PEOPLE_SORT_TYPES.COUNT)">
      <i v-if="sortBy === CONSTANTS.PEOPLE_SORT_TYPES.COUNT" class="fas" :class="{ 'fa-angle-down': sortDirection === -1, 'fa-angle-up': sortDirection === 1 }"></i> Number of Faces
    </li>
    <li
      v-if="showSorting"
      class="sort"
      :class="{ active: sortBy === CONSTANTS.PEOPLE_SORT_TYPES.DATE }"
      @click.stop="sort(CONSTANTS.PEOPLE_SORT_TYPES.DATE)">
      <i v-if="sortBy === CONSTANTS.PEOPLE_SORT_TYPES.DATE" class="fas" :class="{ 'fa-angle-down': sortDirection === -1, 'fa-angle-up': sortDirection === 1 }"></i> Recent
    </li>
  </ul>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import { PEOPLE_FACES } from 'src/store/storeModules'
import {
  GET_CURRENT_PERSON_TYPE,
  GET_SORT_BY,
  GET_SORT_DIRECTION 
} from 'src/store/modules/people-faces/getters'
import {
  SET_PERSON_TYPE,
  SET_SORT_BY,
  SET_SORT_DIRECTION
} from 'src/store/modules/people-faces/mutations'

export default {
  name: 'people-filter-sort-bar',
  props: {
    applyChanges: {
      type: Function,
      default: () => {}
    },
    showSorting: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    ...mapGetters(PEOPLE_FACES, {
      personType: GET_CURRENT_PERSON_TYPE,
      sortBy: GET_SORT_BY,
      sortDirection: GET_SORT_DIRECTION
    })
  },
  methods: {
    ...mapMutations(PEOPLE_FACES, {
      setPersonType: SET_PERSON_TYPE,
      setSortBy: SET_SORT_BY,
      setSortDirection: SET_SORT_DIRECTION
    }),
    changePersonType (type) {
      this.setPersonType(type)
      this.applyChanges()
    },
    sort (by = this.CONSTANTS.PEOPLE_SORT_TYPES.COUNT) {
      if (this.sortBy === by) {
        this.setSortDirection(-this.sortDirection)
      } else {
        this.setSortBy(by)
        const dir = by === this.CONSTANTS.PEOPLE_SORT_TYPES.NAME ? 1 : -1
        this.setSortDirection(dir)
      }
      this.applyChanges()
    }
  }
}
</script>

<style lang="less" scoped>
@import '../../styles/_variables';
@import '../../styles/_mixins';
.people-filtering-sorting {
  .flex-box();
  font-size: 10px;
  font-weight: 900;
  height: 44px;
  list-style: none;
  margin: 0 20px 0 0;
  padding: 0;
  text-transform: uppercase;
  > li {
    .flex-container-between();
    padding: 0 10px 0 0;
    i {
      margin-right: 5px;
    }
    &.filter {
      > div {
        margin-right: 20px;
        &.active {
          color: @primary-button-color;
        }
      }
    }
    &.sort {
      margin-right: 20px;
    }
    &:hover {
      cursor: pointer;
    }    
  }
}
</style>