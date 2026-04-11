<template>
  <div class="auth-layout">
    <div class="auth-container">
      <div class="auth-logo">
        <router-link to="/">
          <n-text strong style="font-size: 32px; color: var(--primary-color)">Nexbuy</n-text>
        </router-link>
      </div>
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { NText } from 'naive-ui'
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}
.auth-container {
  width: 100%;
  max-width: 420px;
  padding: 24px;
}
.auth-logo {
  text-align: center;
  margin-bottom: 32px;
}
.auth-logo a {
  text-decoration: none;
}
</style>
