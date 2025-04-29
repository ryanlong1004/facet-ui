import _ from 'lodash'

export function getTopFaceEmotion (emotions) {
  let e = ''
  let score = 0
  _.each(emotions, (val, emotion) => {
    if (val > score) {
      e = emotion
      score = val
    }
  })
  return e
}
