import shortid from 'shortid'
import Vue from 'vue'
import _ from 'lodash'

export const getSearchPropertyPath = path => {
  return _.get(path, 'path') + (_.get(path, 'useRaw') ? '.raw' : '')
}

export const getHistoPath = path => {
  const histoPath = _.get(path, 'histoPath')
  const searchPath = _.get(path, 'path')

  return (histoPath ? histoPath : searchPath) + (_.get(path, 'useRaw') ? '.raw' : '')
}

// load a search query object from localStorage
export function getSearchQueryFromStore (key) {
  let empty = {}
  if (Vue.localStorage) {
    try {
      let json = Vue.localStorage.get(key)
      let jsonObj = JSON.parse(json)
      return jsonObj
    }
    catch (err) {
      return empty
    }
  }
  return empty
}

// save a search query object to localStorage and get a hash key back (or false if not able to save)
export function putSearchQueryInStore (searchQuery) {
  if (typeof searchQuery.getQueryObject === 'function') {
    searchQuery = searchQuery.getQueryObject()
  }
  let key = shortid.generate()
  let json = JSON.stringify(searchQuery)
  if (Vue.localStorage) {
    try {
      Vue.localStorage.set(key, json)
    }
    catch (err) {
      localStorage.clear()
      Vue.localStorage.set(key, json)
    }
    return key
  } else {
    return false
  }
}
