<script setup lang="ts">
import type { JournalFilters, TagCount } from '~/types/journal'
import { MOODS } from '~/utils/mood'

const props = defineProps<{
  filters: JournalFilters
  /** Most used tags; a selected tag outside this list is added to it. */
  tags: readonly TagCount[]
}>()

const emit = defineEmits<{ change: [patch: Partial<JournalFilters>] }>()

/** The search text, which the page applies after a short pause. */
const search = defineModel<string>('search', { required: true })

const MODES = [
  { value: 'notes', label: 'With notes' },
  { value: 'all', label: 'Every check-in' },
] as const

const mode = computed({
  get: () => (props.filters.notesOnly ? 'notes' : 'all'),
  set: value => emit('change', { notesOnly: value === 'notes' }),
})

const tagChips = computed<{ tag: string, count: number | null }[]>(() => {
  const { tag } = props.filters
  return tag && !props.tags.some(t => t.tag === tag) ? [...props.tags, { tag, count: null }] : [...props.tags]
})

const input = useTemplateRef<HTMLInputElement>('input')
defineExpose({ focusSearch: () => input.value?.focus() })
</script>

<template>
  <div class="journal-filters">
    <div class="journal-filters__bar">
      <div class="journal-search">
        <span
          class="journal-search__glyph"
          aria-hidden="true"
        />
        <input
          id="search"
          ref="input"
          v-model="search"
          type="search"
          class="journal-search__input"
          placeholder="Search your notes"
          aria-label="Search your notes"
          autocomplete="off"
          enterkeyhint="search"
        >
        <button
          v-if="search"
          type="button"
          class="journal-search__clear"
          @click="search = ''"
        >
          Clear
        </button>
      </div>
      <SegmentedControl
        v-model="mode"
        :options="MODES"
        label="Which check-ins to show"
        variant="sans"
      />
    </div>

    <div
      class="journal-filters__row"
      role="group"
      aria-labelledby="journal-filter-mood"
    >
      <span
        id="journal-filter-mood"
        class="journal-filters__label"
      >Mood</span>
      <ChipButton
        v-for="mood in MOODS"
        :key="mood.level"
        :selected="filters.level === mood.level"
        @click="emit('change', { level: filters.level === mood.level ? null : mood.level })"
      >
        <MoodDot
          :color="mood.color"
          :size="6"
        />
        {{ mood.label }}
      </ChipButton>
    </div>
    <div
      v-if="tagChips.length"
      class="journal-filters__row"
      role="group"
      aria-labelledby="journal-filter-tags"
    >
      <span
        id="journal-filter-tags"
        class="journal-filters__label"
      >Tags</span>
      <ChipButton
        v-for="chip in tagChips"
        :key="chip.tag"
        class="journal-filters__tag"
        :selected="filters.tag === chip.tag"
        @click="emit('change', { tag: filters.tag === chip.tag ? null : chip.tag })"
      >
        #{{ chip.tag }}
        <span
          v-if="chip.count !== null"
          class="journal-filters__count"
        >{{ chip.count }}</span>
      </ChipButton>
    </div>
  </div>
</template>
