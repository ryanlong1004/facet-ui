import shortid from 'shortid'
import Vue from 'vue'
import _ from 'lodash'

export function getSearchQuery (key) {
  let empty = {}
  try {
    let json = Vue.localStorage.get(key)
    let jsonObj = JSON.parse(json)
    return jsonObj
  }
  catch (err) {
    return empty
  }
}

export function hashSearch (searchQuery) {
  let key = shortid.generate()
  let json = JSON.stringify(searchQuery)
  try {
    Vue.localStorage.set(key, json)
  }
  catch (err) {
    localStorage.clear()
    Vue.localStorage.set(key, json)
  }
  return key
}
