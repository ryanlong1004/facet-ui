import _ from 'lodash'
import { PROPERTY_PATHS } from 'src/property-paths'

// default search key
export const SEARCH_DEFAULT = 'default'

// grab the important part of media_info.video.duration_time string
export function cleanVideoDuration (d) {
  return d.split(' ')[0]
}
// convert media_info.video.duration (milliseconds) to 'HH:MM:SS' format
export function millisToHHMMSS (m) {
  return new Date(m).toISOString().substr(11, 8)
}
