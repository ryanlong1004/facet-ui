import api from 'src/api'

// export function tagsTypeaheadSearch (queryString, cb) {
//   api.getTagSearch(queryString)
//     .then(response => {
//       const tags = _.get(response, 'tags', []) || []
//       const suggestions = tags.map(l => {
//         return {
//           value: l.tag
//         }
//       })
//       cb(suggestions)
//     })
//     .catch(() => {
//       cb([])
//     })
// }

export function logoTypeaheadSearch (queryString, cb) {
  api.getLogoSearch(queryString)
    .then(response => {
      const logos = _.get(response, 'logos', []) || []
      const suggestions = logos.map(l => {
        return {
          value: l.name
        }
      })
      cb(suggestions)
    })
    .catch(() => {
      cb([])
    })
}

export function categoriesTypeaheadSearch (queryString, cb) {
  api.getSearchCategories(queryString)
    .then(response => {
      const cats = _.get(response, 'categories', []) || []
      const suggestions = cats.map(l => {
        return {
          value: l.category
        }
      })
      cb(suggestions)
    })
    .catch(() => {
      cb([])
    })
}

export function customTagsTypeaheadSearch (queryString, cb) {
  api.getCustomTagsSearch(queryString)
    .then(response => {
      const tags = _.get(response, 'labels', []) || []
      const suggestions = tags.map(l => {
        return {
          value: l.label
        }
      })
      cb(suggestions)
    })
    .catch(() => {
      cb([])
    })
}

export async function peopleTypeaheadSearch (queryString, cb) {
  try {
    const response = await api.getPeopleSearch(queryString)
    let people = _.get(response, 'people', null)
    if (people === null) {
      people = []
    }
    const suggestions = people.map(p => {
      return {
        value: p.person_id,
        label: p.name,
        person: _.assign({}, p, {faceImageUrl: '/files/' + p.face_img_path})
      }
    })
    cb(suggestions)
  }
  catch (err) {
    cb([])
  }
}
