export const DEFAULT_EXTRACTOR_PROFILE_ID = 'default'

export const EXTRACTOR_CATEGORIES = [
  {
    id: 'category_adult_moderation',
    icon: 'fas fa-eye-slash',
    name: 'Adult/Moderation'
  },
  {
    id: 'category_audio_sound_effects',
    icon: 'fas fa-volume-up',
    name: 'Audio/Sound Effects'
  },
  // {
  //   id: 'category_captions',
  //   icon: 'fas fa-closed-captioning',
  //   name: 'Closed Captions'
  // },
  {
    id: 'category_custom_tags',
    icon: 'fas fa-user-tag',
    name: 'Custom Tags'
  },
  {
    id: 'category_geo_landmarks',
    icon: 'fas fa-map-marker-alt',
    name: 'Geo/Landmarks'
  },
  {
    id: 'category_language_detection',
    icon: 'far fa-globe',
    name: 'Language Detection'
  },
  {
    id: 'category_logos',
    icon: 'fas fa-images',
    name: 'Logos/Known Graphics'
  },
  {
    id: 'category_scene_descriptions',
    icon: 'fas fa-binoculars',
    name: 'Scene Descriptions'
  },
  {
    id: 'category_nlp',
    icon: 'fas fa-comment-alt-dots',
    name: 'Natural Language Processing'
  },
  {
    id: 'category_ocr',
    icon: 'icon-OCR',
    name: 'OCR (Visual Text)'
  },
  {
    id: 'category_people_faces',
    icon: 'fas fa-users',
    name: 'People and Faces'
  },
  {
    id: 'category_speech_to_text',
    icon: 'fas fa-comments-alt',
    name: 'Speech-to-text'
  },
  {
    id: 'category_sports',
    icon: 'fas fa-running',
    name: 'Sports'
  },
  {
    id: 'category_tags',
    icon: 'fas fa-tags',
    name: 'Tags'
  },
  {
    id: 'category_technical_cues',
    icon: 'far fa-crosshairs',
    name: 'Technical Cues'
  },
  {
    id: 'category_weather',
    icon: 'fas fa-cloud-sun',
    name: 'Weather'
  }
]

export const VIDEO_MAIN_FRAMES_EXTRACTOR_NAME = 'video_main_frames'
export const VIDEO_MAIN_FRAMES_FRAME_RATE_CONFIG_KEY = 'video_main_frames_seconds_between_frames'
export const VIDEO_MAIN_FRAMES_DEFAULT_FRAME_ACCURACY = '2'

export const VIDEO_MAIN_FRAME_ACCURACY = [
  '2', '1', '0.5', '0.25'
]

export const EXTRACTOR_FRAME_ACCURACY = [
  '10', '6', '4', '2', '1', '0.5', '0.25'
]

export const FILE_TYPE_EXTRACTORS = [
  {
    id: 'csv',
    name: 'CSV'
  },
  {
    id: 'json',
    name: 'JSON'
  },
  {
    id: 'xml',
    name: 'XML'
  },
  {
    id: 'officex',
    name: 'OfficeX'
  },
  {
    id: 'html',
    name: 'HTML'
  },
  {
    id: 'fdx',
    name: 'FDX'
  },
  {
    id: 'pdf',
    name: 'PDF'
  },
  {
    id: 'dpx',
    name: 'DPX'
  },
  {
    id: 'email',
    name: 'Emails'
  },
  {
    id: 'dbf',
    name: 'DBF'
  }
]

export const BOOLEAN_EXTRACTORS = [
  {
    id: 'audio_previews',
    name: 'Audio Previews'
  },
  {
    id: 'video_previews',
    name: 'Video Previews'
  },
  {
    id: 'video_main_frames',
    name: 'Video Main Frames'
  },
  {
    id: 'audiopeak',
    name: 'Audiopeak'
  },
  {
    id: 'volumedetect',
    name: 'Volume Detect'
  },
  {
    id: 'audioinfo',
    name: 'Audio Info'
  },
  {
    id: 'document_pages',
    name: 'Document Pages'
  },
  {
    id: 'archive',
    name: 'Archives'
  },
  {
    id: 'manifest',
    name: 'Manifest'
  },
  {
    id: 'm2ts',
    name: 'M2TS'
  },
  {
    id: 'captions',
    name: 'Embedded Captions'
  }
]

export const IGNORED_EXTRACTORS = [
  // this has a special configuration
  {
    id: 'video_main_frames',
    name: 'Video Main Frames'
  },
  // this has a special configuration
  {
    id: 'caption_files',
    name: 'Caption Files'
  },
  // ignoring this because it might not be useful
  {
    id: 'captionsv2',
    name: 'Captions v2'
  }
]

export const FIELD_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  NUMBER_RANGE: 'number_range',
  BOOLEAN: 'boolean',
  SELECT: 'select',
  MULTIPLE: 'multiple',
  VIDEO_FRAMES: 'frame_select'
}
