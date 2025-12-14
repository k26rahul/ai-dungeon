<script setup></script>

<template>
  <nav>
    <router-link to="/">Chat</router-link>
    <router-link to="/settings">Settings</router-link>
  </nav>
  <div class="activity">
    <router-view></router-view>
  </div>
</template>

<style scoped>
nav {
  display: flex;
  gap: 1rem;
}

nav a {
  color: var(--color-text-muted);
  text-decoration: none;
  font-weight: 500;
  padding: 0.25rem 0;
}

nav a:hover {
  color: var(--color-text-main);
}
</style>
