<template>
  <div>
    <router-link :to="{ name: 'create-extractor-profile' }" class="new-profile-btn" v-if="showNewButton">
      <i class="fas fa-plus"></i> Create New Profile
    </router-link>
    <ul class="nav-links">
      <li
        v-for="profile in profiles"
        :key="profile.id"
        :class="{ active: profile.id === currentProfileId }">
        <router-link :to="{ name: 'extractor-profile', params: { id: profile.id }}">
          {{ profile.name }}
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

import { EXTRACTORS } from 'src/store/storeModules'
import {
  GET_EXTRACTOR_PROFILES,
  GET_CURRENT_EXTRACTOR_PROFILE_ID,
  SELECT_PROFILE
} from 'src/store/modules/admin/extractors'

export default {
  name: 'profiles-nav',
  beforeMount () {
    this.$watch('$route.params.id', newVal => {
      if (newVal) {
        this.doSetCurrentProfile(newVal)
      }      
    }, { immediate: true })
    this.$watch('$route.name', newVal => {
      if (newVal === 'create-extractor-profile') {
        this.showNewButton = false
      } else {
        this.showNewButton = true
      }
    })
    // if no provider in current route, force it
    if (!this.$route.params.id) {
      this.$router.push({
        name: 'extractor-profile',
        params: {
          id: 'default'
        }
      })
    }
  },
  data () {
    return {
      showNewButton: true
    }
  },
  computed: {
    ...mapGetters(EXTRACTORS, {
      profiles: GET_EXTRACTOR_PROFILES,
      currentProfileId: GET_CURRENT_EXTRACTOR_PROFILE_ID
    })
  },
  methods: {
    ...mapActions(EXTRACTORS, {
      doSetCurrentProfile: SELECT_PROFILE
    })
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.new-profile-btn {
  background-color: transparent;
  border: 1px solid @color-tone-lighter;
  color: @color-tone-darkest;
  cursor: pointer;
  display: block;
  font-family: @default-font-family-medium;
  font-size: 11px;
  margin: 15px 0 5px 15px;
  padding: 8px 10px;
  text-align: center;
  text-transform: uppercase;
  width: 170px;
  > i {
    margin-right: 2px;
  }
  &:hover {
    background-color: @color-base;
    border-color: @color-tone-lightest;
    color: @color-primary;
    text-decoration: none;
  }
}
</style>
