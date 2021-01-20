import { mount, createLocalVue } from '@vue/test-utils'
import VueRouter from 'vue-router'
import ElementUI from 'element-ui'

const localVue = createLocalVue()
localVue.use(VueRouter)
localVue.use(ElementUI)

const routes = [
  {
    path: '/',
    name: 'home',
    children: [{
      path: 'dashboard',
      name: 'dashboard'
    }]
  },
  {
    path: '/menu',
    name: 'menu',
    children: [{
      path: 'menu1',
      name: 'menu1',
      meta: { title: 'menu1' },
      children: [{
        path: 'menu1-1',
        name: 'menu1-1',
        meta: { title: 'menu1-1' }
      },
      {
        path: 'menu1-2',
        name: 'menu1-2',
        redirect: 'noredirect',
        meta: { title: 'menu1-2' },
        children: [{
          path: 'menu1-2-1',
          name: 'menu1-2-1',
          meta: { title: 'menu1-2-1' }
        },
        {
          path: 'menu1-2-2',
          name: 'menu1-2-2'
        }]
      }]
    }]
  }]

const router = new VueRouter({
  routes
})

