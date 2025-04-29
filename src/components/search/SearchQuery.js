import _ from 'lodash'
import { SEARCH_CONSTANTS } from 'src/constants-search'
import { getSearchPropertyPath, putSearchQueryInStore } from './search-helper'
import { PROPERTY_PATHS } from 'src/property-paths'

export const AGGREGATION_METRIC_TYPES = {
  SUM: 'sum',
  AVG: 'avg',
  MAX: 'max',
  MIN: 'min',
  CARDINALITY: 'cardinality'
}

export const DEFAULTS = {
  LIMIT: 10,
  HISTOGRAM_INTERVAL: 2,
  HISTOGRAM_MIN: 0
}

export const ATTRIBUTE_PATHS = {
  PEOPLE: getSearchPropertyPath(PROPERTY_PATHS.PERSON_NAME),
  LOGO: getSearchPropertyPath(PROPERTY_PATHS.LOGO_TEXT),
  ADULT: getSearchPropertyPath(PROPERTY_PATHS.NSFW),
  OCR: getSearchPropertyPath(PROPERTY_PATHS.OCR),
  S2T: getSearchPropertyPath(PROPERTY_PATHS.STT_TEXT),
  CAPTIONS: getSearchPropertyPath(PROPERTY_PATHS.CAPTIONS_TEXT),
  TAGS: getSearchPropertyPath(PROPERTY_PATHS.TAGS),
  DESCRIPTION: getSearchPropertyPath(PROPERTY_PATHS.DESCRIPTIONS_TEXT),
  CATEGORIES: getSearchPropertyPath(PROPERTY_PATHS.CATEGORIES)
}

function getCleanAggregations () {
  return {
    date_ranges: [],
    terms: [],
    metrics: [],
    histograms: []
  }
}

export default class SearchQuery {

  constructor (queryString = '') {
    this.reset(queryString)
  }

  reset (queryString = '') {
    this.queryObj = {
      query: queryString,
      page: 0,
      limit: DEFAULTS.LIMIT,
      filters: {
        full_text: [],
        full_text_phrase: [],
        exact_terms: [],
        multi_terms: [],
        exclude_terms: [],
        exists: [],
        not_exists: [],
        ranges: []
      },
      fields: [],
      only: [],
      sort_fields: [],
      aggregations: getCleanAggregations()
    }
    return this.queryObj
  }

  toHash () {
    return putSearchQueryInStore(this)
  }

  applyQueryParams (params) {
    if (params) {
      this.queryObj = _.cloneDeep(params)
    }
    return this
  }

  getQueryObject () {
    return this.queryObj
  }

  queryString (query = '') {
    this.queryObj.query = query
    return this
  }
  getQueryString () {
    return this.queryObj.query
  }

  page (p) {
    this.queryObj.page = p
    return this
  }

  getPage () {
    return this.queryObj.page
  }

  sort (field, ascending = true) {
    this.queryObj.sort_fields.push({ field, ascending })
    return this
  }

  clearSorting () {
    this.queryObj.sort_fields = []
    return this
  }

  limit (limit = DEFAULTS.LIMIT) {
    this.queryObj.limit = limit
    return this
  }

  fields (...fields) {
    _.each(fields, (field) => {
      this.queryObj.fields.push(field)
    })
    return this
  }

  only (...fields) {
    _.each(fields, (field) => {
      this.queryObj.only.push(field)
    })
    return this
  }

  /*
   * ===========================
   * filter methods
   * ===========================
  */
  // full text
  addFullTextFilter (field = '', value = '') {
    if (field === '' || value === '') {
      return this
    }
    const existing = _.find(this.queryObj.filters.full_text, { field, value })
    if (!existing) {
      this.queryObj.filters.full_text.push({ field, value })
    }
    return this
  }
  removeFullTextFilter (field = '', value = '') {
    this.queryObj.filters.full_text = _.filter(this.queryObj.filters.full_text, o => {
      return !(o.field === field && o.value === value)
    })
    return this
  }
  // full text phrase
  addFullTextPhraseFilter (field = '', value = '') {
    if (field === '' || value === '') {
      return this
    }
    const existing = _.find(this.queryObj.filters.full_text_phrase, { field, value })
    if (!existing) {
      this.queryObj.filters.full_text_phrase.push({ field, value })
    }
    return this
  }
  removeFullTextPhraseFilter (field = '', value = '') {
    this.queryObj.filters.full_text_phrase = _.filter(this.queryObj.filters.full_text_phrase, o => {
      return !(o.field === field && o.value === value)
    })
    return this
  }
  // exact term
  addExactTermFilter (field = '', value = '') {
    if (field === '' || value === '') {
      return this
    }
    const existing = _.find(this.queryObj.filters.exact_terms, { field, value })
    if (!existing) {
      this.queryObj.filters.exact_terms.push({ field, value })
    }
    return this
  }

  // multi term (comma separated list of words)
  addMultiTermFilter (field = '', value = '') {
    if (field === '' || value === '') {
      return this
    }
    // if term already exists, update it...
    let t = _.find(this.queryObj.filters.multi_terms, { field })
    if (t) {
      const currentTerms = t.value.split(',')
      if (currentTerms.indexOf(value) < 0) {
        t.value = currentTerms.concat([value]).join(',')
      } else {
        this.removeMultiTermFilter(field, value)
      }
    } else {
      this.queryObj.filters.multi_terms.push({ field, value })
    }
    return this
  }
  removeMultiTermFilter (field = '', value = '') {
    let t = _.find(this.queryObj.filters.multi_terms, { field })
    if (t) {
      let currentTerms = t.value.split(',')
      const pulled = _.pull(currentTerms, value)
      if (!pulled.length) {
        this.queryObj.filters.multi_terms = _.filter(this.queryObj.filters.multi_terms, t => {
          return t.field !== field
        })
      } else {
        t.value = pulled.join(',')
      }
    }
    return this
  }
  // exists
  addExistsFilter (field = '') {
    if (field !== '' && this.queryObj.filters.exists.indexOf(field) === -1) {
      this.queryObj.filters.exists.push(field)
    }
    return this
  }
  removeExistsFilter (field = '') {
    _.pull(this.queryObj.filters.exists, field)
  }
  // not exists
  addNotExistsFilter (field = '') {
    if (field !== '' && this.queryObj.filters.not_exists.indexOf(field) === -1) {
      this.queryObj.filters.not_exists.push(field)
    }
    return this
  }
  removeNotExistsFilter (field = '') {
    _.pull(this.queryObj.filters.not_exists, field)
  }
  // range
  addRangeFilter (field, from = 0, to = 1) {
    // if range already exists, update it...
    let t = _.find(this.queryObj.filters.ranges, { field })
    if (t) {
      t.from = from.toString()
      t.to = to.toString()
    } else {
      this.queryObj.filters.ranges.push({ field, from: from.toString(), to: to.toString() })
    }
    return this
  }

  /*
   * ===========================
   * aggregation methods
   * ===========================
  */
  addDateRangeAggregation (name = '', field = '') {
    if (name === '' || field === '') {
      return this
    }
    // check if this aggregation already exists (based on the field)
    const existingByField = _.find(this.queryObj.aggregations.date_ranges, { field })
    const existingByName = _.find(this.queryObj.aggregations.date_ranges, { name })
    // if field already exists, use latest provided name
    if (existingByField) {
      existingByField.name = name
    // if name already exists, use latest provided field
    } else if (existingByName) {
      existingByName.field = field
    } else {
      this.queryObj.aggregations.date_ranges.push({ name, field })
    }
    return this
  }
  addTermAggregation (name = '', field = '', size = DEFAULTS.AGGREGATION_TERM_SIZE) {
    if (name === '' || field === '') {
      return this
    }
    if (size <= 0) {
      size = DEFAULTS.AGGREGATION_TERM_SIZE
    }
    // check if this aggregation already exists (based on the field)
    const existingByField = _.find(this.queryObj.aggregations.terms, { field })
    const existingByName = _.find(this.queryObj.aggregations.terms, { name })
    // if field already exists, use latest provided name
    if (existingByField) {
      existingByField.name = name
      existingByField.size = size
    // if name already exists, use latest provided field
    } else if (existingByName) {
      existingByName.field = field
      existingByName.size = size
    } else {
      this.queryObj.aggregations.terms.push({ name, field, size })
    }
    return this
  }

  setAggregations (aggs = {}) {
    this.queryObj.aggregations.date_ranges = _.get(aggs, 'date_ranges', [])
    this.queryObj.aggregations.terms = _.get(aggs, 'terms', [])
    this.queryObj.aggregations.metrics = _.get(aggs, 'metrics', [])
    this.queryObj.aggregations.histograms = _.get(aggs, 'histograms', [])
  }
  addDefaultAggregations () {
    this.setAggregations(SEARCH_CONSTANTS.DEFAULT_SEARCH_AGGREGATIONS)
    return this
  }
  clearAggregations () {
    this.queryObj.aggregations = getCleanAggregations()
    return this
  }
}
