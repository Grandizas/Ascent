<script setup lang="ts">
import { browserTimeZone } from '~/composables/useTimezone'
import { formatTime } from '~/utils/date'
import { type TimeZoneOption, timeZoneLabel, timeZoneName, timeZoneOptions } from '~/utils/timezones'

/** Matches the profiles.display_name check. */
const MAX_NAME_LENGTH = 80

const { profile, update } = useProfile()
const timeZone = useTimezone()
const now = useNow()

// ── Name ──────────────────────────────────────────────────────────────
const name = ref(profile.value?.displayName ?? '')
const savingName = ref(false)
const nameStatus = ref<string | null>(null)
const nameError = ref<string | null>(null)
const nameChanged = computed(() => name.value.trim() !== (profile.value?.displayName ?? ''))

watch(name, () => {
  nameStatus.value = null
  nameError.value = null
})

async function saveName() {
  const value = name.value.trim().replace(/\s+/g, ' ')
  if (!value) {
    nameError.value = 'Enter a name. A nickname is fine.'
    return
  }
  const submitted = name.value
  savingName.value = true
  try {
    await update({ displayName: value })
    // The field stays editable while saving; keep anything typed meanwhile.
    if (name.value !== submitted) return
    name.value = value
    await nextTick() // let the watcher clear old messages first
    nameStatus.value = 'Saved.'
  }
  catch (error) {
    console.error('[settings] name save failed', error)
    nameError.value = 'Couldn’t save your name. Try again.'
  }
  finally {
    savingName.value = false
  }
}

// ── Timezone ──────────────────────────────────────────────────────────
type ZoneMode = 'device' | 'fixed'
const MODES = [
  { value: 'device', label: 'Follow this device' },
  { value: 'fixed', label: 'Choose one' },
] as const

const savingZone = ref(false)
const zoneStatus = ref<string | null>(null)
const zoneError = ref<string | null>(null)

// The full list differs slightly between runtimes, so it's built in the
// browser only; the server renders just the current zone.
const allZones = ref<TimeZoneOption[]>([])
onMounted(() => (allZones.value = timeZoneOptions(new Date(), [timeZone.value, 'UTC'])))
const zoneOptions = computed(() =>
  allZones.value.length ? allZones.value : [{ value: timeZone.value, label: timeZoneLabel(timeZone.value, new Date(now.value)) }])

async function saveZone(timezone: string, timezoneAuto: boolean): Promise<boolean> {
  savingZone.value = true
  zoneStatus.value = null
  zoneError.value = null
  try {
    await update({ timezone, timezoneAuto })
    timeZone.value = timezone
    zoneStatus.value = timezoneAuto
      ? 'Saved. Your timezone follows whichever device you use.'
      : `Saved. Your days now start at midnight in ${timeZoneName(timezone)}.`
    return true
  }
  catch (error) {
    console.error('[settings] timezone save failed', error)
    zoneError.value = 'Couldn’t save your timezone. Try again.'
    return false
  }
  finally {
    savingZone.value = false
  }
}

const mode = computed<ZoneMode>({
  get: () => (profile.value?.timezoneAuto === false ? 'fixed' : 'device'),
  set: (value) => {
    if (value === mode.value || savingZone.value) return
    if (value === 'device') saveZone(browserTimeZone() ?? timeZone.value, true)
    else saveZone(timeZone.value, false)
  },
})

async function pickZone(event: Event) {
  const select = event.target as HTMLSelectElement
  if (select.value === timeZone.value) return
  // On failure the bound value hasn't changed, so Vue won't reset the
  // select; do it here so picking the same zone again retries.
  if (!(await saveZone(select.value, false))) select.value = timeZone.value
}

const zoneId = useId()
const nameId = useId()
</script>

<template>
  <SettingsSection
    label="Profile"
    title="You"
  >
    <SettingsRow
      title="Name"
      description="How Today greets you. Only you see it."
      :label-for="nameId"
      :status="nameStatus"
      :error="nameError"
    >
      <form
        class="settings-inline"
        novalidate
        @submit.prevent="saveName"
      >
        <input
          :id="nameId"
          v-model="name"
          class="settings-input"
          type="text"
          autocomplete="name"
          :maxlength="MAX_NAME_LENGTH"
          :aria-invalid="!!nameError"
        >
        <BaseButton
          type="submit"
          size="sm"
          variant="outline"
          :disabled="!nameChanged"
          :loading="savingName"
        >
          Save
        </BaseButton>
      </form>
    </SettingsRow>

    <SettingsRow
      title="Timezone"
      :status="zoneStatus"
      :error="zoneError"
    >
      <template #description>
        Decides when each day starts and ends. It’s {{ formatTime(now, timeZone) }} in {{ timeZoneName(timeZone) }} now.
      </template>
      <SegmentedControl
        v-model="mode"
        :options="MODES"
        label="Timezone"
        variant="sans"
      />
      <template
        v-if="mode === 'fixed'"
        #details
      >
        <div class="settings-row__details">
          <label
            :for="zoneId"
            class="visually-hidden"
          >Timezone</label>
          <select
            :id="zoneId"
            class="settings-input settings-select"
            :value="timeZone"
            :disabled="savingZone"
            @change="pickZone"
          >
            <option
              v-for="option in zoneOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          <span class="settings-row__hint">Stays put while you travel. Entries keep the moment they were logged; only how days are grouped changes.</span>
        </div>
      </template>
    </SettingsRow>
  </SettingsSection>
</template>
