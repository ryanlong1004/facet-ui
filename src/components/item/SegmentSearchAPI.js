import Vue from 'vue'
import _ from 'lodash'
import q from 'q'
import SegmentQuery, { LIMIT } from './SegmentQuery'
import { PROPERTY_PATHS } from 'src/property-paths'

const API_URL = '/api/data/segments/search'

export class SegmentSearchAPI {
  constructor () {
    // we need a unique ID for the skeleton segments
    this.segId = 0
  }

  search (segmentQuery, tag = '') {
    let url = API_URL
    if (tag !== '') {
      url += '?' + tag
    }
    return Vue.http.post(url, segmentQuery.getQueryObject())
      .then(response => {
        response = response.body
        response.totalPages = Math.ceil(response.total_hits / response.limit)
        response.thisPageQuery = segmentQuery.serialize()
        // if there are more pages
        if (response.totalPages > (response.page + 1)) {
          response.nextPageQuery = segmentQuery.copy().page(response.page + 1).serialize()
        }
        if (response.page > 0) {
          response.previousPageQuery = segmentQuery.copy().page(response.page - 1).serialize()
        }
        return response
      })
  }

  getDocumentContents (itemId) {
    return this.search(new SegmentQuery(itemId)
      .only('_id',
        PROPERTY_PATHS.PAGE_NUM.path,
        PROPERTY_PATHS.DOCUMENT_CONTENTS_TEXT.path
       )
      .sort(PROPERTY_PATHS.SEGMENT_INDEX.path)
      .limit(9999),
      'documentContents'
    )
  }
}

const segmentSearchAPI = new SegmentSearchAPI()
export default segmentSearchAPI
