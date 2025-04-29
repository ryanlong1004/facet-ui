import _ from 'lodash'

export const LIMIT = 100
export const TAGS_PAGE_SIZE = 20
export const OCR_PAGE_SIZE = 20

export const METRIC_TYPES = {
  MIN: 'min',
  MAX: 'max',
  AVG: 'avg',
  SUM: 'sum',
  CARDINALITY: 'cardinality'
}

export default class SegmentQuery {

  constructor (itemId, seralized = null) {
    this.itemId = itemId
    if (seralized !== null) {
      this.deserialize(seralized)
    } else {
      this.reset()
    }
  }

  reset () {
    this.query = {
      query: '',
      page: 0,
      limit: LIMIT,
      filters: {
        exact_terms: [{ field: 'item_id', value: this.itemId }],
        ranges: [],
        exists: []
      },
      fields: [],
      only: [],
      sort_fields: [],
      aggregations: {
        terms: [],
        histograms: [],
        metrics: []
      }
    }
  }

  serialize () {
    return JSON.stringify(this.getQueryObject())
  }

  deserialize (jsonString) {
    this.query = JSON.parse(jsonString)
    return this
  }

  copy () {
    const seralized = this.serialize()
    return new SegmentQuery(this.itemId, seralized)
  }

  getQueryObject () {
    return this.query
  }

  queryString (q) {
    this.query.query = q
    return this
  }

  page (p) {
    this.query.page = p
    return this
  }

  limit (l) {
    this.query.limit = l
    return this
  }

  sort (field, ascending = true) {
    this.query.sort_fields.push({ field, ascending })
    return this
  }

  fields (...fields) {
    _.each(fields, (field) => {
      this.query.fields.push(field)
    })
    return this
  }

  only (...fields) {
    _.each(fields, (field) => {
      this.query.only.push(field)
    })
    return this
  }

  filter (field, value) {
    this.query.filters.exact_terms.push({ field, value })
    return this
  }

  exists (field) {
    this.query.filters.exists.push(field)
    return this
  }

  range (field, from = 0, to = 1) {
    this.query.filters.ranges.push({ field, from, to })
    return this
  }

  metric (name, field, type = METRIC_TYPES.MIN) {
    this.query.aggregations.metrics.push({ name, field, type })
    return this
  }

  aggregation (name, field) {
    this.query.aggregations.terms.push({ name, field })
    return this
  }

  histogram (name, field, interval = 5, minCount = 1) {
    this.query.aggregations.histograms.push({ name, field, interval, min_count: minCount })
    return this
  }

}
