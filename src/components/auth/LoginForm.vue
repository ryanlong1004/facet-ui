<template>
  <form name="loginForm">
    <!-- <div class="form-group" :class="{ 'has-error': errors.email }">
      <label class="control-label">Email Address</label>
      <input class="form-control" type="text" v-model="credentials.email" @keyup="resetError('email')">
      <span class="help-block" v-if="errors.email">{{errors.email}}</span>
    </div>
    <div class="form-group" :class="{ 'has-error': errors.password }">
      <label class="control-label">Password</label>
      <input class="form-control" type="password" v-model="credentials.password" @keyup="resetError('password')">
      <span class="help-block" v-if="errors.password">{{errors.password}}</span>
    </div> -->
    <div class="form-group">
      <button type="button" class="btn btn-primary" @click="submit">Login</button>
    </div>
  </form>
</template>

<script>
import Vue from 'vue'

export default {
  name: 'login-form',
  components: {
  },
  data () {
    return {
      credentials: {
        email: '',
        password: ''
      },
      errors: {
        email: null,
        password: null,
        server: null
      }
    }
  },
  mounted: function () {
    const self = this
    window.addEventListener('message', function (e) {
      // check message origin
      if (e.origin === 'http://localhost:7000') {
        window.localStorage.setItem('authToken', e.data.token)
        window.localStorage.setItem('userID', e.data.userID)
        Vue.http.interceptors.push(function (request, next) {
          request.headers.set('Authorization', e.data.token)
          next()
        })
        self.$router.push('/')
      }
    })
  },
  methods: {
    submit (e) {
      window.open('http://localhost:7000/')
    }
  }
}
</script>

<style scoped="scoped">
  form {
    max-width: 300px;
  }
</style>
