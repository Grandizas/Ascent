<script setup lang="ts">
import { isEmail, MIN_PASSWORD_LENGTH } from '~/utils/password'

const user = useSupabaseUser()
const { changeEmail, pendingEmail, changePassword, signOutOtherDevices, signOut } = useAuth()

const email = computed(() => user.value?.email ?? '')
const providers = computed(() => (user.value?.app_metadata?.providers as string[] | undefined) ?? ['email'])
/** Accounts created with Google have no password until they set one. */
const hasPassword = computed(() => providers.value.includes('email'))
const usesGoogle = computed(() => providers.value.includes('google'))

// ── Email ─────────────────────────────────────────────────────────────
const editingEmail = ref(false)
const newEmail = ref('')
const sendingEmail = ref(false)
const emailError = ref<string | null>(null)
const pending = ref<string | null>(null)

onMounted(async () => (pending.value = await pendingEmail()))
watch(newEmail, () => (emailError.value = null))

async function submitEmail() {
  const value = newEmail.value.trim()
  if (!isEmail(value)) {
    emailError.value = 'That doesn’t look like an email address.'
    return
  }
  if (value.toLowerCase() === email.value.toLowerCase()) {
    emailError.value = 'That’s already your email.'
    return
  }
  sendingEmail.value = true
  const { error } = await changeEmail(value)
  sendingEmail.value = false
  if (error) {
    emailError.value = error
    return
  }
  pending.value = value
  editingEmail.value = false
  newEmail.value = ''
}

function cancelEmail() {
  editingEmail.value = false
  newEmail.value = ''
}

// ── Password ──────────────────────────────────────────────────────────
const editingPassword = ref(false)
const password = ref('')
const code = ref('')
const needsCode = ref(false)
const savingPassword = ref(false)
const passwordError = ref<string | null>(null)
const passwordStatus = ref<string | null>(null)

watch([password, code], () => (passwordError.value = null))

async function submitPassword() {
  if (password.value.length < MIN_PASSWORD_LENGTH) {
    passwordError.value = `Use at least ${MIN_PASSWORD_LENGTH} characters.`
    return
  }
  if (needsCode.value && !code.value.trim()) {
    passwordError.value = 'Enter the code from the email.'
    return
  }
  savingPassword.value = true
  const result = await changePassword(password.value, needsCode.value ? code.value : undefined)
  savingPassword.value = false
  if (result.error) {
    passwordError.value = result.error
    return
  }
  if (result.needsCode) {
    needsCode.value = true
    passwordStatus.value = `We emailed a code to ${email.value}. Enter it to confirm the change.`
    return
  }
  cancelPassword()
  passwordStatus.value = hasPassword.value ? 'Password changed.' : 'Password set. You can now log in with your email too.'
}

function cancelPassword() {
  editingPassword.value = false
  password.value = ''
  code.value = ''
  needsCode.value = false
  passwordStatus.value = null
}

// ── Devices ───────────────────────────────────────────────────────────
const signingOutOthers = ref(false)
const devicesStatus = ref<string | null>(null)
const devicesError = ref<string | null>(null)

async function signOutOthers() {
  signingOutOthers.value = true
  devicesStatus.value = null
  const { error } = await signOutOtherDevices()
  signingOutOthers.value = false
  devicesError.value = error
  if (!error) devicesStatus.value = 'Signed out everywhere else. This device stays signed in.'
}

const emailId = useId()
</script>

<template>
  <SettingsSection
    label="Account"
    title="Signing in"
  >
    <SettingsRow
      title="Email"
      :error="emailError"
    >
      <template #description>
        <span class="settings-row__value">{{ email }}</span>
        <template v-if="pending">
          Waiting for you to confirm {{ pending }}. Open the link we sent to finish the change.
        </template>
        <template v-else>
          Used to log in and to reset your password.
        </template>
      </template>
      <BaseButton
        v-if="!editingEmail"
        size="sm"
        variant="outline"
        @click="editingEmail = true"
      >
        Change
      </BaseButton>
      <template
        v-if="editingEmail"
        #details
      >
        <form
          class="settings-row__details"
          novalidate
          @submit.prevent="submitEmail"
        >
          <label
            :for="emailId"
            class="visually-hidden"
          >New email</label>
          <input
            :id="emailId"
            v-model="newEmail"
            class="settings-input"
            type="email"
            autocomplete="email"
            placeholder="New email address"
            :aria-invalid="!!emailError"
          >
          <span class="settings-row__hint">We’ll send a confirmation link. Your email changes once you open it{{ usesGoogle ? '; Google sign-in keeps working with your Google account' : '' }}.</span>
          <div class="settings-row__actions">
            <BaseButton
              size="sm"
              :disabled="sendingEmail"
              @click="cancelEmail"
            >
              Cancel
            </BaseButton>
            <BaseButton
              type="submit"
              size="sm"
              variant="primary"
              :loading="sendingEmail"
            >
              Send link
            </BaseButton>
          </div>
        </form>
      </template>
    </SettingsRow>

    <SettingsRow
      title="Password"
      :description="hasPassword ? 'Change the password you log in with.' : 'You sign in with Google. Set a password to log in with your email as well.'"
      :status="passwordStatus"
      :error="passwordError"
    >
      <BaseButton
        v-if="!editingPassword"
        size="sm"
        variant="outline"
        @click="editingPassword = true; passwordStatus = null"
      >
        {{ hasPassword ? 'Change' : 'Set a password' }}
      </BaseButton>
      <template
        v-if="editingPassword"
        #details
      >
        <form
          class="settings-row__details"
          novalidate
          @submit.prevent="submitPassword"
        >
          <PasswordField
            v-model="password"
            label="New password"
            autocomplete="new-password"
            placeholder="At least 8 characters"
          >
            <PasswordStrength :password="password" />
          </PasswordField>
          <TextField
            v-if="needsCode"
            v-model="code"
            label="Code from the email"
            autocomplete="one-time-code"
          />
          <div class="settings-row__actions">
            <BaseButton
              size="sm"
              :disabled="savingPassword"
              @click="cancelPassword"
            >
              Cancel
            </BaseButton>
            <BaseButton
              type="submit"
              size="sm"
              variant="primary"
              :loading="savingPassword"
            >
              {{ needsCode ? 'Confirm' : 'Save password' }}
            </BaseButton>
          </div>
        </form>
      </template>
    </SettingsRow>

    <SettingsRow
      title="Other devices"
      description="Ends every session except this one, e.g. after using a shared computer."
      :status="devicesStatus"
      :error="devicesError"
    >
      <BaseButton
        size="sm"
        variant="outline"
        :loading="signingOutOthers"
        @click="signOutOthers"
      >
        Sign out of other devices
      </BaseButton>
    </SettingsRow>

    <SettingsRow
      title="This device"
      description="Your entries stay safe in your account."
    >
      <BaseButton
        size="sm"
        variant="outline"
        @click="signOut"
      >
        <AppIcon name="sign-out" />
        Sign out
      </BaseButton>
    </SettingsRow>
  </SettingsSection>
</template>
