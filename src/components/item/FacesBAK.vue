<template>
  <div class="faces">

    <div class="people" :class="{ empty: !people || !people.length }">
      <div class="empty-notification" v-if="people && !people.length">
        We didn't detect any faces in this file
      </div>
      <div class="face-list">
        <div v-for="person in people" :key="person.id" class="face-item" :class="{ active: person.id === selectedPersonId }">
          <picture @click="personSelected(person.id)"><cropped-image :url="person.image" :rect="person.rect" :rounded="true"></cropped-image></picture>
          <p @click="personSelected(person.id)">
            <span v-if="person.age">{{ person.age }} year old</span>
            <span>{{ person.gender || 'Unknown gender' }}<br></span>
            <span>{{ person.num_faces }} faces</span>
          </p>
        </div>
      </div>
    </div> <!-- .people -->

    <div class="person" v-if="selectedPersonData">
      <div v-if="!personSaved">
        <div>
          <p>De-select the faces below that do not belong to this person and enter a name to save this group of faces to a known person</p>
          <div class="name-person-inputs">
            <el-autocomplete
              v-model="selectedPersonData.name"
              :fetch-suggestions="getCelebsList"
              placeholder="Enter the name of this person..."
              @select="handleTypeaheadSuggestion"
            ></el-autocomplete>
            <el-button size="small" type="primary" @click="savePerson">Save Person</el-button>
          </div>
        </div>
        <div v-if="selectedPersonData" class="face-list">
          <div v-for="face in selectedPersonData.faces" :key="face.face_id" class="face-item" :class="{ removed: face.remove }">
            <picture><cropped-image :url="face.image" :rect="face.rect" :rounded="true"></cropped-image></picture>
            <p>
              <span v-if="face.age">{{ face.age }} year old</span>
              <span>{{ face.gender || 'face' }}</span>
            </p>
            <button type="button" class="add-remove-btn" @click="toggleFace(face)">
              <i class="far fa-plus"></i>
            </button>
          </div>
        </div>
      </div>
      <div v-if="personSaved">
        <p>Great! We've saved your selected faces to the person "{{ selectedPersonData.name }}" - hop over to the "People" tab to see where they appear in this video</p>
        <el-button type="primary" @click="reset()">Got It!</el-button>
      </div>
    </div> <!-- .person -->

  </div>
</template>

<script>
import _ from 'lodash'

import CroppedImage from '../thumbnail/CroppedImage.vue'

export default {
  name: 'faces',
  props: {
    faces: Array,
    celebs: Array
  },
  data () {
    return {
      selectedPersonId: null,
      selectedPersonData: null,
      personSaved: false,
      celebrityNames: [],
      people: [
        {
          id: 'asdf1234',
          name: '',
          image: '/files/a955b8f83e4a46974e664bf1476a256d/video_main_frames/frame-0000000010.jpg',
          rect: {
            height: 192,
            left: 146,
            top: 76,
            width: 192
          },
          num_faces: 8,
          gender: 'male'
        },
        {
          id: 'lkjh9876',
          name: '',
          image: '/files/a955b8f83e4a46974e664bf1476a256d/video_main_frames/frame-0000000052.jpg',
          rect: {
            height: 128,
            left: 173,
            top: 153,
            width: 128
          },
          num_faces: 22,
          gender: 'female'
        }
      ]
    }
  },
  components: {
    CroppedImage
  },
  watch: {
    celebs: function (newVal, oldVal) {
      if (newVal && newVal.length) {
        this.celebrityNames = newVal.map((c) => {
          return { value: c.name }
        })
      }
    }
  },
  methods: {
    personSelected: function (personId) {
      console.log('personSelected', personId)
      this.selectedPersonId = personId
      this.selectedPersonData = {
        item_id: '',
        person_id: personId,
        name: '',
        faces: [
          {
            face_id: '1',
            remove: false,
            image: '/files/a955b8f83e4a46974e664bf1476a256d/video_main_frames/frame-0000000010.jpg',
            rect: {
              height: 192,
              left: 146,
              top: 76,
              width: 192
            },
            gender: 'male',
            age: 32,
            start_at: 4
          },
          {
            face_id: '2',
            remove: false,
            image: '/files/a955b8f83e4a46974e664bf1476a256d/video_main_frames/frame-0000000010.jpg',
            rect: {
              height: 192,
              left: 146,
              top: 76,
              width: 192
            },
            gender: 'male',
            age: 32,
            start_at: 9
          },
          {
            face_id: '3',
            remove: false,
            image: '/files/a955b8f83e4a46974e664bf1476a256d/video_main_frames/frame-0000000010.jpg',
            rect: {
              height: 192,
              left: 146,
              top: 76,
              width: 192
            },
            gender: 'male',
            age: 32,
            start_at: 13
          },
          {
            face_id: '4',
            remove: false,
            image: '/files/a955b8f83e4a46974e664bf1476a256d/video_main_frames/frame-0000000010.jpg',
            rect: {
              height: 192,
              left: 146,
              top: 76,
              width: 192
            },
            gender: 'male',
            age: 32,
            start_at: 36
          },
          {
            face_id: '5',
            remove: false,
            image: '/files/a955b8f83e4a46974e664bf1476a256d/video_main_frames/frame-0000000010.jpg',
            rect: {
              height: 192,
              left: 146,
              top: 76,
              width: 192
            },
            gender: 'male',
            age: 32,
            start_at: 45
          },
          {
            face_id: '6',
            remove: false,
            image: '/files/a955b8f83e4a46974e664bf1476a256d/video_main_frames/frame-0000000010.jpg',
            rect: {
              height: 192,
              left: 146,
              top: 76,
              width: 192
            },
            gender: 'male',
            age: 32,
            start_at: 50
          },
          {
            face_id: '7',
            remove: false,
            image: '/files/a955b8f83e4a46974e664bf1476a256d/video_main_frames/frame-0000000010.jpg',
            rect: {
              height: 192,
              left: 146,
              top: 76,
              width: 192
            },
            gender: 'male',
            age: 32,
            start_at: 52
          },
          {
            face_id: '8',
            remove: false,
            image: '/files/a955b8f83e4a46974e664bf1476a256d/video_main_frames/frame-0000000010.jpg',
            rect: {
              height: 192,
              left: 146,
              top: 76,
              width: 192
            },
            gender: 'male',
            age: 32,
            start_at: 60
          }
        ]
      }
    },
    toggleFace: function (face) {
      face.remove = !face.remove
    },
    getCelebsList: function (queryString, cb) {
      cb(this.celebrityNames)
    },
    handleTypeaheadSuggestion: function (e) {
      console.log(e)
    },
    savePerson: function () {
      const savedFaces = _.filter(this.selectedPersonData.faces, f => !f.remove)
      const newTimes = savedFaces.map((f) => {
        return { start_at: f.start_at, end_at: f.start_at + 1 }
      })
      const deletedFaces = _.filter(this.selectedPersonData.faces, f => f.remove)
      console.log(newTimes, savedFaces, deletedFaces)
      this.celebs.push({
        name: this.selectedPersonData.name,
        url: savedFaces[0].image,
        faceRectangle: savedFaces[0].rect,
        data: newTimes
      })
      this.personSaved = true
    },
    reset: function () {
      this.people = _.filter(this.people, p => p.id !== this.selectedPersonId)
      this.personSaved = false
      this.selectedPersonId = null
      this.selectedPersonData = null
    }
  }
}
</script>

<style lang="less" scoped>
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

.people, .person {
  width: 48%;
}
.people {
  border-right: 1px dotted #ccc;
}

.face-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
}

.face-item {
  width: 200px;
  padding: 10px;
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 20px;
  picture {
    width: @thumbSize;
    height: @thumbSize;
    margin-right: 10px;
  }
  p {
    margin: 0;
    padding: 0;
    font-size: 14px;
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
      color: #666;
      font-size: 1.15rem;
      font-weight: normal;
      line-height: 20px;
      transition: transform 100ms ease-out;
      transform: rotate(-45deg);
    }
    &:hover {
      background-color: #666;
      i.far {
        color: #fff;
      }
    }
  }

  &.removed {
    picture, p {
      opacity: .3;
    }
    .add-remove-btn {
      &:hover {
        background-color: #879baf;
      }
      i.far {
        transform: rotate(0deg);
      }
    }
  }
  &.active {
    background-color: rgba(255,255,255,.2);
    box-shadow: 2px 2px 4px rgba(0,0,0,.2);
  }
}

.name-person-inputs {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 15px;
  .el-autocomplete {
    margin-right: 10px;
    width: 100%;
  }
}
</style>
