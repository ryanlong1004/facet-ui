<template>
  <div class="faces">

    <div class="people" :class="{ empty: !faces || !faces.length }">
      <div class="empty-notification" v-if="faces && !faces.length">
        We didn't detect any faces in this file.
      </div>
      <el-alert v-if="successMessage && numSelectedFaces === 0" :title="successMessage" type="success"></el-alert>
      <div v-if="numSelectedFaces > 0" class="name-person-inputs">
        <div class="name-person-inputs__input-wrapper el-form-item" :class="{ 'is-error': newPersonError }">
          <el-autocomplete
            :class="{ error: newPersonError }"
            v-model="newPersonName"
            :fetch-suggestions="queryPeople"
            placeholder="Enter name of person to save selected faces"
            :trigger-on-focus="false"
            :disabled="savingPerson"
          ></el-autocomplete>
          <div class="name-person-inputs__error" v-if="newPersonError">{{ newPersonError }}</div>
        </div>
        <div>
          <el-button type="primary" size="small" @click="saveNewPerson" :disabled="savingPerson"><span v-if="selectedPersonId === null">Save New</span><span v-if="selectedPersonId !== null">Apply To Existing</span> Person</el-button>
        </div>
      </div>

      <div class="face-list">
        <div v-for="face in faceList" :key="face.face_id" class="face-item" :class="{ selected: face.selected }" @click="toggleFaceSelect(face)">
          <picture><cropped-image :url="face.url" :rect="face.rectangle" :rounded="true"></cropped-image></picture>
          <p class="face-attributes">
            <span v-if="face.age">{{ face.age }} year old</span>
            <span>{{ face.gender || 'Unknown gender' }}</span>
            <span v-if="face.emotion !== ''">{{ face.emotion }}</span>
          </p>
        </div>
      </div>
    </div> <!-- .people -->

  </div>
</template>

<script>
import _ from 'lodash'
import api from '../../api'
import CroppedImage from '../thumbnail/CroppedImage.vue'

export default {
  name: 'faces',
  props: {
    faces: Array
  },
  data () {
    return {
      celebrityNames: [],
      numSelectedFaces: 0,
      faceList: [],
      newPersonName: '',
      selectedPersonId: null,
      newPersonError: '',
      successMessage: '',
      savingPerson: false,
      peopleSearchResults: []
    }
  },
  components: {
    CroppedImage
  },
  mounted () {
    this.handleChanges()
  },
  watch: {
    faces (newVal, oldVal) {
      this.handleChanges()
    },
    newPersonName (newVal, oldVal) {
      const existing = this.findPersonInResults(newVal)
      if (existing) {
        this.selectedPersonId = existing.person_id
      } else {
        this.selectedPersonId = null
      }
    }
  },
  methods: {
    queryPeople (queryString, cb) {
      api.getPeopleSearch(queryString)
        .then(response => {
          const results = response.people.map(p => {
            return {
              value: p.name,
              person_id: p.person_id
            }
          })
          _.each(results, person => {
            if (!this.findPersonInResults(person.value)) {
              this.peopleSearchResults.push(person)
            }
          })
          cb(results)
        })
    },
    findPersonInResults (personName) {
      return _.find(this.peopleSearchResults, { value: personName })
    },
    handleChanges () {
      if (this.faces && this.faces.length) {
        this.faceList = this.faces.map(f => {
          return _.assign({}, f, { selected: false })
        })
      }
    },
    nameInputChanged (e) {
      this.newPersonError = ''
    },
    toggleFaceSelect (face) {
      face.selected = !face.selected
      if (face.selected) {
        this.numSelectedFaces += 1
      } else {
        this.numSelectedFaces -= 1
      }
    },
    saveNewPerson () {
      if (this.newPersonName === '') {
        this.newPersonError = 'Person name is required'
        return false
      }
      const selectedFaces = _.filter(this.faceList, { selected: true })
      const selectedFaceIds = selectedFaces.map(f => { return f.face_id })
      if (selectedFaceIds.length === 0) {
        this.newPersonError = 'You must select more than 1 face to save to a person'
        return false
      }
      this.savingPerson = true
      this.newPersonError = ''

      let call
      // if saving to existing person...
      if (this.selectedPersonId) {
        call = api.addFacesToPerson(this.selectedPersonId, selectedFaceIds)
      // else save to new person...
      } else {
        call = api.createPersonFromFaces(this.newPersonName, selectedFaceIds)
      }
      call.then(response => {
        this.faceList = _.filter(this.faceList, f => {
          return f.selected === false
        })
        if (this.selectedPersonId) {
          this.successMessage = this.numSelectedFaces = ' faces have been added to the person "' + this.newPersonName + '" - hop over to the "People" tab to see the updated timeline'
          this.$emit('existing-person-updated', { person_id: this.selectedPersonId })

        } else {
          this.successMessage = 'Great! We\'ve saved your selected faces to the person "' + this.newPersonName + '" - hop over to the "People" tab to see where they appear in this video'
          this.$emit('new-person-added', response.person)
        }
        this.selectedPersonId = null
        this.newPersonName = ''
        this.numSelectedFaces = 0
      })
      .catch(err => {
        console.error('error saving person', err)
      })
      .finally(() => {
        this.savingPerson = false
      })
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_mixins';
@thumbSize: 70px;

.empty-notification {
  padding: 0 15px 15px 15px;
}

.faces {
  padding-top: 15px;
  width: 100%;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
}

.face-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}

.face-item {
  align-items: center;
  border: 1px solid rgba(131, 144, 165, 0);
  display: flex;
  flex-direction: row;
  margin: 0 20px 20px 0;
  padding: 10px;
  width: 200px;

  picture {
    width: @thumbSize;
    height: @thumbSize;
    margin-right: 10px;
  }
  p.face-attributes {
    margin: 0;
    padding: 0;
    font-size: 14px;
    span {
      display: block;
    }
  }
  picture, p {
    transition: opacity 100ms ease-out;
  }
  .add-remove-btn {
    background-color: transparent;
    border: 0 none;
    border-radius: 50%;
    cursor: pointer;
    margin-left: 5px;
    width: 34px;
    height: 30px;
    text-align: center;
    transition: background-color 100ms ease-out;
    &:focus {
      outline: 0;
    }
    i.far {
      color: @color-tone-medium;
      font-size: 1.15rem;
      font-weight: normal;
      line-height: 20px;
      transition: transform 100ms ease-out;
      transform: rotate(-45deg);
    }
    &:hover {
      background-color: @color-tone-medium;
      i.far {
        color: @color-base;
      }
    }
  }

  &.removed {
    picture, p {
      opacity: .3;
    }
    .add-remove-btn {
      &:hover {
        background-color: @color-tone-darker;
      }
      i.far {
        transform: rotate(0deg);
      }
    }
  }

  &:hover, &.selected {
    border-radius: 4px;
  }

  &:hover {
    background-color: rgba(255,255,255,.35);
    border: 1px solid rgba(131, 144, 165, .7);
    box-shadow: 2px 2px 4px rgba(0,0,0,0);
    cursor: pointer;
  }

  &.selected {
    background-color: rgba(255,255,255,.5);
    border: 1px solid rgb(131, 144, 165);
    box-shadow: 2px 2px 4px rgba(0,0,0,.2);
    color: rgb(131, 144, 165);
  }
}

.name-person-inputs {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 15px;
  &__input-wrapper {
    flex: 1;
  }
  &__error {
    color: @color-alert;
    font-size: 12px;
    line-height: 1;
    padding-top: 4px;
  }
  .el-autocomplete, .el-input {
    width: 100%;
  }
  .el-button {
    margin-left: 10px;
  }
}
</style>
