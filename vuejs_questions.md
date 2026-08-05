# Vue.js Questions

## Table of Contents

1. [Explain Vue.js reactivity and common issues when tracking changes.](#reactivity-system--common-tracking-issues)
2. [Describe data flow between components in a Vue.js app](#component-data-flow-architecture)
3. [List the most common cause of memory leaks in Vue.js apps and how they can be solved](#memory-leak-prevention--management)
4. [What have you used for state management? (Pinia)](#state-management-with-pinia)
5. [What’s the difference between pre-rendering and server side rendering?](#pre-rendering-vs-server-side-rendering-ssr)

---

## Reactivity System & Common Tracking Issues

Vue 3's reactivity system relies on JavaScript **ES6 Proxies**. When reactive state is initialized, Vue creates a proxy wrapper around objects to intercept property access (`track`) and mutations (`trigger`).

- **`ref`**: Wraps any value (primitives or objects) inside an object container with a `.value` property.
- **`reactive`**: Creates a proxy wrapper directly around object types (objects, arrays, collections).

```js
import { ref, reactive } from 'vue';

const count = ref(0); // count.value = 0
const user = reactive({ name: 'Alex', age: 28 }); // user.name
```

### Common Reactivity Pitfalls & Solutions

#### 1. Destructuring `reactive` objects loses reactivity

Destructuring extracts primitive values directly, detaching them from Vue's Proxy interceptors.

- **Incorrect:**

  ```js
  const state = reactive({ count: 0, title: 'Dashboard' });
  const { count } = state; // Reactivity broken!
  ```

- **Solution:** Use `toRefs()` or `toRef()` to maintain reactive connections.

  ```js
  import { reactive, toRefs } from 'vue';

  const state = reactive({ count: 0, title: 'Dashboard' });
  const { count, title } = toRefs(state); // Maintains reactivity
  ```

#### 2. Reassigning a `reactive` object

Assigning a whole new object breaks the reference to the original Proxy.

- **Incorrect:**

  ```js
  let state = reactive({ count: 0 });
  state = { count: 1 }; // Overwrites the proxy reference!
  ```

- **Solution:** Reassign properties internally or use `ref()` for values requiring complete reassignment.

  ```js
  // Option A: Reassign inner properties
  Object.assign(state, { count: 1 });

  // Option B: Use ref instead
  const stateRef = ref({ count: 0 });
  stateRef.value = { count: 1 };
  ```

#### 3. Wrapping large non-reactive third-party instances

Wrapping complex third-party library instances (like Chart.js, Three.js, or Leaflet map instances) in `ref` or `reactive` causes severe performance overhead and unexpected side effects.

- **Solution:** Mark instances as raw using `shallowRef()` or `markRaw()`.

  ```js
  import { shallowRef, markRaw } from 'vue';

  const mapInstance = shallowRef(null);
  // or
  const rawChart = markRaw(new Chart(ctx, config));
  ```

---

## Component Data Flow Architecture

Vue adheres to a strict **One-Way Data Flow (Unidirectional)** pattern. Parents pass data down through props, and children emit events back up to request changes.

```text
+----------------------------------------+
|            Parent Component            |
+----------------------------------------+
     |                              ^
     | (Props: Data Down)           | (Events: Action Up)
     v                              |
+----------------------------------------+
|            Child Component             |
+----------------------------------------+
```

### 1. Parent to Child (`props`)

Props passed into child components are read-only snapshot bindings. Children must never mutate props directly.

```vue
<!-- Parent.vue -->
<ChildComponent :user-name="name" />
```

### 2. Child to Parent (`emit`)

Child components notify parents about state changes by emitting custom events.

```vue
<!-- ChildComponent.vue -->
<script setup>
const emit = defineEmits(['update-name']);

function onChange(e) {
  emit('update-name', e.target.value);
}
</script>
```

### 3. Two-Way Binding (`v-model`)

`v-model` acts as syntactic sugar for passing a prop alongside a matching `update:modelValue` emit event.

```vue
<!-- Parent -->
<CustomInput v-model="searchText" />

<!-- Expands to: -->
<CustomInput 
  :modelValue="searchText" 
  @update:modelValue="newValue => searchText = newValue" 
/>
```

### 4. Deep Component Trees (`provide` / `inject`)

To prevent "prop drilling" across deeply nested components, an ancestor component can `provide` data that any descendant can `inject`.

```js
// Ancestor.vue
provide('theme', themeRef);

// DeepChild.vue
const theme = inject('theme');
```

---

## Memory Leak Prevention & Management

A memory leak in Vue occurs when a component instance is unmounted and destroyed, but detached JavaScript references lingering in memory prevent the browser's Garbage Collector (GC) from releasing the allocated memory.

### 1. Forgotten Global Event Listeners & Timers

Attaching event listeners to global targets (`window`, `document`) or maintaining active `setInterval`/`setTimeout` calls without cleanup.

- **Solution:** Explicitly remove listeners and clear timers in the `onBeforeUnmount` lifecycle hook.

  ```js
  import { onMounted, onBeforeUnmount } from 'vue';

  let timerId;
  const handleResize = () => console.log('Resized');

  onMounted(() => {
    window.addEventListener('resize', handleResize);
    timerId = setInterval(() => {}, 1000);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
    clearInterval(timerId);
  });
  ```

### 2. Third-Party Library Cleanup

Initializing external JS libraries (D3, Chart.js, TinyMCE, Leaflet) that attach internal DOM listeners without executing teardown routines.

- **Solution:** Call destruction/disposal APIs prior to component destruction.

  ```js
  onBeforeUnmount(() => {
    chartInstance?.destroy();
  });
  ```

### 3. Active Subscriptions (RxJS, WebSockets, EventBus)

Subscribing to global event buses or WebSocket streams inside a component creates lingering reference paths.

- **Solution:** Unsubscribe manually during unmount, or leverage composables (e.g., VueUse utilities) that bind lifetime handling automatically.

---

## State Management with Pinia

**Pinia** is the official state management solution for Vue 3, replacing Vuex. Key highlights include:

- **Type Safety & Autocompletion:** Built natively in TypeScript without requiring verbose wrapper definitions.
- **No Mutations:** Direct state mutations are permitted inside actions (no separate mutation layer needed).
- **Modular Architecture:** Encourages splitting state into domain-specific stores instead of managing a monolith.
- **Composition API First:** Supports Setup Store syntax using standard Vue reactivity primitives (`ref`, `computed`, functions).

### Example: Setup Store Pattern

```ts
// stores/useUserStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<{ name: string; isLoggedIn: boolean } | null>(null);

  // Getters
  const isAuthenticated = computed(() => !!user.value?.isLoggedIn);

  // Actions
  async function login(credentials: { user: string; pass: string }) {
    const res = await apiLogin(credentials);
    user.value = res.data;
  }

  function logout() {
    user.value = null;
  }

  return { user, isAuthenticated, login, logout };
});
```

---

## Pre-rendering vs. Server-Side Rendering (SSR)

Both techniques render HTML ahead of time to optimize SEO and lower First Contentful Paint (FCP) times compared to standard Client-Side Rendered (CSR) Single Page Applications.

| Feature | Pre-rendering (SSG - Static Site Generation) | Server-Side Rendering (SSR) |
| :--- | :--- | :--- |
| **Generation Time** | At **build time** within a CI/CD pipeline or deployment environment. | On-demand **per request** at runtime on a live server. |
| **Server Requirements** | Static file hosting (CDN, S3, Netlify, Vercel Static). | Active Node.js runtime server. |
| **Primary Use Cases** | Blogs, documentation sites, marketing pages, static landing sites. | Dashboards, e-commerce checkouts, real-time feeds, user-tailored content. |
| **Build & Load Profile** | Fast CDN edge delivery; build duration scales with total page count. | Instant deployment times; TTFB depends on server runtime computation. |
| **Vue Ecosystem Tools** | Nuxt (Static mode / `nuxt generate`), Vitepress. | Nuxt (`ssr: true`), `@vue/server-renderer`. |
