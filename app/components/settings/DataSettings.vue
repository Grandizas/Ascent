<script setup lang="ts">
const CONFIRM_WORD = 'delete'

const { exportJson, exportCheckInsCsv } = useDataExport()
const { deleteAccount } = useAuth()

// ── Export ────────────────────────────────────────────────────────────
const exporting = ref<'json' | 'csv' | null>(null)
const exportError = ref<string | null>(null)

async function runExport(kind: 'json' | 'csv') {
  exporting.value = kind
  exportError.value = null
  try {
    await (kind === 'json' ? exportJson() : exportCheckInsCsv())
  }
  catch (error) {
    console.error('[settings] export failed', error)
    exportError.value = 'The export didn’t finish. Try again in a moment.'
  }
  finally {
    exporting.value = null
  }
}

// ── Delete ────────────────────────────────────────────────────────────
const confirming = ref(false)
const confirmText = ref('')
const deleting = ref(false)
const deleteError = ref<string | null>(null)
const confirmed = computed(() => confirmText.value.trim().toLowerCase() === CONFIRM_WORD)
const field = useTemplateRef<HTMLInputElement>('field')

async function startDelete() {
  confirming.value = true
  await nextTick()
  field.value?.focus()
}

function cancelDelete() {
  confirming.value = false
  confirmText.value = ''
  deleteError.value = null
}

async function remove() {
  if (!confirmed.value) return
  deleting.value = true
  deleteError.value = null
  const { error } = await deleteAccount()
  // On success the app reloads to /login; only a failure comes back here.
  if (error) {
    deleteError.value = error
    deleting.value = false
  }
}

const confirmId = useId()
</script>

<template>
  <SettingsSection
    label="Your data"
    title="Yours to keep, or to remove"
    description="Your entries are private to your account. Take a copy whenever you like."
  >
    <SettingsRow
      title="Export everything"
      description="Check-ins, notes, journal entries and journeys as one JSON file, or just your check-ins as a spreadsheet."
      :error="exportError"
    >
      <div class="settings-row__buttons">
        <BaseButton
          size="sm"
          variant="outline"
          :loading="exporting === 'json'"
          :disabled="!!exporting"
          @click="runExport('json')"
        >
          Download JSON
        </BaseButton>
        <BaseButton
          size="sm"
          variant="outline"
          :loading="exporting === 'csv'"
          :disabled="!!exporting"
          @click="runExport('csv')"
        >
          Check-ins CSV
        </BaseButton>
      </div>
    </SettingsRow>

    <SettingsRow
      title="Delete account"
      description="Removes your account and everything in it, for good."
      :error="deleteError"
    >
      <BaseButton
        v-if="!confirming"
        size="sm"
        variant="danger"
        @click="startDelete"
      >
        Delete account…
      </BaseButton>
      <template
        v-if="confirming"
        #details
      >
        <form
          class="settings-row__details settings-danger"
          novalidate
          @submit.prevent="remove"
        >
          <p class="settings-danger__text">
            Every check-in, note, journal entry and journey is deleted with your account. This can’t be undone. Download an export first if you want a copy.
          </p>
          <label
            :for="confirmId"
            class="settings-row__hint"
          >Type “{{ CONFIRM_WORD }}” to confirm.</label>
          <input
            :id="confirmId"
            ref="field"
            v-model="confirmText"
            class="settings-input"
            type="text"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
          >
          <div class="settings-row__actions">
            <BaseButton
              size="sm"
              :disabled="deleting"
              @click="cancelDelete"
            >
              Cancel
            </BaseButton>
            <BaseButton
              type="submit"
              size="sm"
              variant="danger"
              :disabled="!confirmed"
              :loading="deleting"
            >
              Delete my account
            </BaseButton>
          </div>
        </form>
      </template>
    </SettingsRow>
  </SettingsSection>
</template>
