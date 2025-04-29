import _ from 'lodash'
import { CONSTANTS } from 'src/constants'

const PLACEHOLDER_DESCRIPTION = { id: null, text: '' }

// sort by confidence DESC, text ASC
const sortTags = tags => {
  return tags.sort((a, b) => {
    if (a.confidence > b.confidence) {
      return -1
    } else if (b.confidence > a.confidence) {
      return 1
    } else if (a.text > b.text) {
      return 1
    } else if (b.text > a.text) {
      return -1
    }
    return 0
  })
}

// dedupe tags and return sorted
const dedupeTags = tags => {
  let map = {}
  for (let i = 0; i < tags.length; i++) {
    const key = tags[i].text
    if (!map[key]) {
      map[key] = tags[i]
    } else {
      map[key].confidence = Math.max(map[key].confidence, tags[i].confidence)
    }
  }
  const out = []
  _.each(map, (val, key) => {
    out.push(val)
  })
  return sortTags(out)
}

// multiplies confidence 1 <> 0 to human readable 100% scale
const normalizeConfidence = c => {
  if (c > 0 && c <= 1) {
    c = _.round(c * 100)
  }
  return c
}

// normalizes confidence on a set of tags
export const normalizeTagsConfidence = tags => {
  if (tags && tags.length) {
    const normalized = tags.concat([])
    _.each(normalized, t => {
      t.confidence = normalizeConfidence(t.confidence)
    })
    return normalized
  }
  return tags
}

// pulls tags out of a v3/tags response based on the type of content (image, video, document)
export const parseTags = (tagsResponse, itemType = CONSTANTS.ITEM_DETAIL_TYPES.IMAGE) => {
  let tags = []

  switch (itemType) {
    // images
    case CONSTANTS.ITEM_DETAIL_TYPES.IMAGE:
      tags = _.get(tagsResponse, `${CONSTANTS.V3_METADATA_KEYS.IMAGE.COLLECTION_WRAPPER}.tags`, []) || []
      tags = normalizeTagsConfidence(tags)
      break

    // video
    case CONSTANTS.ITEM_DETAIL_TYPES.VIDEO:
      tags = _.get(tagsResponse, CONSTANTS.V3_METADATA_KEYS.VIDEO.COLLECTION_WRAPPER, []) || []
      _.each(tags, t => {
        t.tags = normalizeTagsConfidence(t.tags)
      })
      break

    // documents
    case CONSTANTS.ITEM_DETAIL_TYPES.DOCUMENT:
      tags = _.get(tagsResponse, CONSTANTS.V3_METADATA_KEYS.DOCUMENT.COLLECTION_WRAPPER, []) || []
      _.each(tags, t => {
        const pageTags = _.get(t, 'tags', []) || []
        let allPageTags = [].concat(pageTags)
        const imgs = _.get(t, 'images', []) || []
        _.each(imgs, i => {
          const imgTags = _.get(i, 'tags', []) || []
          allPageTags = allPageTags.concat(imgTags)
        })
        allPageTags = dedupeTags(allPageTags)
        t.tags = normalizeTagsConfidence(allPageTags)
      })
      break
  }
  return tags
}

// combines tags and descriptions into 1 object for vertical timelines (videos and documents only)
export const marryTagsDescriptions = (tags, descriptions, indexKey = CONSTANTS.V3_METADATA_KEYS.VIDEO.SEGMENT_INTERVAL_KEY, metaIdKey = CONSTANTS.V3_METADATA_KEYS.VIDEO.META_ID_KEY) => {
  let married = []
  _.each(tags, (t, i) => {
    married.push({
      segmentId: t[indexKey],
      key: t[indexKey],
      metaId: t[metaIdKey],
      start_at: t[indexKey],
      end_at: t[indexKey] + 0.5,
      tags: _.get(tags, `[${i}]tags`, []) || [],
      description: _.get(descriptions, `[${i}]description`, PLACEHOLDER_DESCRIPTION)
    })
  })
  return married
}
