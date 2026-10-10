<script setup lang="ts">
import { DEFAULT_TAGS } from '~/utils/mood'
import { addTag, MAX_TAG_LENGTH, removeTag, sameTags } from '~/utils/tags'

const { profile, tagOptions, update } = useProfile()

const draft = ref('')
const saving = ref(false)
const status = ref<string | null>(null)
const error = ref<string | null>(null)
const usingDefaults = computed(() => profile.value?.tags == null)

watch(draft, () => (error.value = null))

/** Saves the list; the default list is stored as null so later default changes reach it. */
async function save(tags: readonly string[], message: string): Promise<boolean> {
  saving.value = true
  status.value = null
  error.value = null
  try {
    await update({ tags: sameTags(tags, DEFAULT_TAGS) ? null : [...tags] })
    status.value = message
    return true
  }
  catch (cause) {
    console.error('[settings] tags save failed', cause)
    error.value = 'Couldn’t save your tags. Try again.'
    return false
  }
  finally {
    saving.value = false
  }
}

async function add() {
  if (saving.value) return
  const submitted = draft.value
  const result = addTag(tagOptions.value, submitted)
  if (result.error) {
    error.value = result.error
    return
  }
  const tag = result.tags.at(-1)!
  // The field stays editable while saving; only clear it if nothing new was typed.
  if (await save(result.tags, `Added “${tag}”.`) && draft.value === submitted) draft.value = ''
}

function remove(tag: string) {
  save(removeTag(tagOptions.value, tag), `Removed “${tag}”. Past check-ins keep it.`)
}

function reset() {
  save(DEFAULT_TAGS, 'Back to the default tags.')
}

const inputId = useId()
</script>

<template>
  <SettingsSection
    label="Tags"
    title="Context tags"
    description="Offered when you log a mood. Removing a tag keeps it on past check-ins and in Insights."
  >
    <SettingsRow
      title="Your tags"
      :status="status"
      :error="error"
    >
      <BaseButton
        v-if="!usingDefaults"
        size="xs"
        variant="ghost"
        :disabled="saving"
        @click="reset"
      >
        Reset to defaults
      </BaseButton>
      <template #details>
        <div class="settings-row__details">
          <ul
            v-if="tagOptions.length"
            class="settings-tags"
          >
            <li
              v-for="tag in tagOptions"
              :key="tag"
              class="settings-tags__tag"
            >
              {{ tag }}
              <button
                type="button"
                class="settings-tags__remove"
                :aria-label="`Remove ${tag}`"
                :disabled="saving"
                @click="remove(tag)"
              >
                <AppIcon name="close" />
              </button>
            </li>
          </ul>
          <span
            v-else
            class="settings-row__hint"
          >No tags. The mood log won’t offer any until you add one.</span>
          <form
            class="settings-inline"
            novalidate
            @submit.prevent="add"
          >
            <label
              :for="inputId"
              class="visually-hidden"
            >New tag</label>
            <input
              :id="inputId"
              v-model="draft"
              class="settings-input"
              type="text"
              :maxlength="MAX_TAG_LENGTH"
              placeholder="Add a tag, e.g. Reading"
              autocomplete="off"
              :aria-invalid="!!error"
            >
            <BaseButton
              type="submit"
              size="sm"
              variant="outline"
              :loading="saving"
            >
              <AppIcon name="plus" />
              Add
            </BaseButton>
          </form>
        </div>
      </template>
    </SettingsRow>
  </SettingsSection>
</template>
