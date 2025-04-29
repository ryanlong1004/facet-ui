import _ from 'lodash'

function reactiveExtractor (extractor, enabledExtractor) {
  extractor.formData = {}
  if (_.get(extractor, 'config.fields.length', null) === null) {
    extractor.config = {fields: []}
  }
  _.each(_.get(extractor, 'config.fields'), field => {
    let enabledField
    if (enabledExtractor) {
      enabledField = _.find(_.get(enabledExtractor, 'config.values'), {key: field.key})
    }

    field.value = _.get(enabledField, 'value') || field.default

    // if there's no given value or default value, we still need a value property for reactivity
    if (field.value === undefined) {
      if (field.type === 'string' || field.type === 'secret' || field.type === 'select') {
        field.value = ''
      }
      else if (field.type === 'boolean') {
        field.value = false
      } else if (field.type === 'multiple') {
        field.value = []
      }
    }
    else {
      if (field.type === 'boolean') {
        field.value = field.value === 'true'
      } else if (field.type === 'multiple') {
        if (field.value === '') {
          field.value = []
        }
      }
    }

    if (!field.name) {
      field.name = field.key
    }
    extractor.formData[field.key] = field
  })

  extractor.id = _.get(enabledExtractor, 'id', null)
  extractor.uiActive = _.get(enabledExtractor, 'active', false)
  extractor.error = false
  extractor.errorMsg = ''
  extractor.dlgError = ''

  if (!extractor.display_name) {
    extractor.display_name = extractor.extractor_name
  }

  return extractor
}

function extractorConfigActivateBody (extractor) {
  let extractorJson = {
    extractor_name: extractor.extractor_name,
    active: true
  }

  let values = _.map(extractor.formData, field => {
    return {key: field.key, value: field.type === 'multiple' ? field.value : field.value.toString()}
  })

  if (values) {
    _.set(extractorJson, 'config.values', values)
  }

  if (extractor.id) {
    extractorJson.id = extractor.id
  }

  return extractorJson
}

export { reactiveExtractor, extractorConfigActivateBody }
