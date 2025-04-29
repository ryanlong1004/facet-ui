import NotFound from './NotFound.vue'

export const PATH_404 = '/404'

export const notFoundRoutes = [
  { path: PATH_404, component: NotFound },  
  { path: '*', redirect: PATH_404 }
]
