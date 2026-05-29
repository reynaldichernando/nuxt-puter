<script setup lang="ts">
import type { KVPair } from '@heyputer/puter.js'

// $puter is provided by plugins/puter.client.ts (browser only). All usage below
// happens in onMounted or click handlers, which only run client-side, so it's
// always defined by the time we touch it.
const { $puter } = useNuxtApp()

const key = ref('')
const value = ref('')
const result = ref<string | null>(null)
const pairs = ref<KVPair[]>([])

const loading = ref(false)
const error = ref<string | null>(null)

const signedIn = ref(false)
const username = ref<string | null>(null)

async function refreshAuth() {
  signedIn.value = await $puter.auth.isSignedIn()
  username.value = signedIn.value ? (await $puter.auth.getUser())?.username ?? null : null
}

async function refreshList() {
  pairs.value = await $puter.kv.list(true)
}

async function login() {
  error.value = null
  loading.value = true
  try {
    await $puter.auth.signIn() // opens the Puter login popup
    await refreshAuth()
    await refreshList()
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
}

async function logout() {
  await $puter.auth.signOut()
  await refreshAuth()
  pairs.value = []
  result.value = null
}

async function onSet() {
  error.value = null
  loading.value = true
  try {
    await $puter.kv.set(key.value, value.value)
    await refreshList()
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
}

async function onGet() {
  error.value = null
  loading.value = true
  try {
    result.value = (await $puter.kv.get<string>(key.value)) ?? null
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
}

// Once we're in the browser, check auth and load pairs if already signed in.
onMounted(async () => {
  try {
    await refreshAuth()
    if (signedIn.value) await refreshList()
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  }
})
</script>

<template>
  <main class="wrap">
    <h1>Puter KV demo</h1>

    <!-- Auth bar: KV calls fail "unauthorized" until the user signs in. -->
    <div class="row">
      <template v-if="signedIn">
        <span class="muted">Signed in as <strong>{{ username }}</strong></span>
        <button :disabled="loading" @click="logout">Sign out</button>
      </template>
      <button v-else :disabled="loading" @click="login">Sign in with Puter</button>
    </div>

    <template v-if="signedIn">
      <div class="row">
        <input v-model="key" placeholder="key" />
        <input v-model="value" placeholder="value" />
        <button :disabled="loading" @click="onSet">Set</button>
        <button :disabled="loading" @click="onGet">Get</button>
      </div>

      <p v-if="result !== null">
        <strong>Get result:</strong> {{ result }}
      </p>

      <h2>All stored pairs</h2>
      <ul v-if="pairs.length">
        <li v-for="p in pairs" :key="p.key">
          <code>{{ p.key }}</code> = <code>{{ p.value }}</code>
        </li>
      </ul>
      <p v-else class="muted">No pairs stored yet.</p>
    </template>
    <p v-else class="muted">Sign in to read and write your key/value store.</p>

    <p v-if="loading" class="muted">Loading…</p>
    <p v-if="error" class="error">Error: {{ error }}</p>
  </main>
</template>

<style>
.wrap {
  max-width: 640px;
  margin: 3rem auto;
  font-family: system-ui, sans-serif;
}
.row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 1rem;
}
.row input {
  flex: 1;
  padding: 0.5rem;
}
.row button {
  padding: 0.5rem 1rem;
  cursor: pointer;
}
.muted {
  color: #888;
}
.error {
  color: #c00;
}
</style>
