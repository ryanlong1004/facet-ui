import _ from 'lodash'

export const UNKNOWN_NAME = 'Unknown'
export const DEFAULT_FACE_IMAGE = '/static/img/default-avatar.png'

export function getOptimalFaceImage (obj) {
  const smallPath = _.get(obj, 'face_img_sm_path', undefined) || _.get(obj, 'face_img_small_path', undefined)
  const faceImgPath = (smallPath && smallPath.length) ? smallPath : obj.face_img_path
  return faceImgPath && faceImgPath.length ? '/files/' + faceImgPath : DEFAULT_FACE_IMAGE
}
