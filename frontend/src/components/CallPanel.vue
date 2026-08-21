<template>
  <div>
    <audio ref="remoteAudioRef" autoplay class="hidden"></audio>

    <!-- Consentimento LGPD -->
    <div v-if="showConsentModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <ShieldCheckIcon class="w-6 h-6 text-emerald-600" />
            <h3 class="text-base font-bold text-gray-900">Consentimento obrigatório</h3>
          </div>
          <button @click="showConsentModal = false" class="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <XIcon class="w-5 h-5" />
          </button>
        </div>
        <p class="text-sm text-gray-600 mb-2">
          Para ligar para <strong>{{ formatPhone(consentPhone) }}</strong>, o cliente precisa ter autorizado chamadas de voz (LGPD).
        </p>
        <p class="text-xs text-gray-500 mb-4">
          Confirme que o cliente manifestou interesse em receber chamadas (por mensagem ou verbalmente) antes de registrar o consentimento.
        </p>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Método do consentimento</label>
          <select v-model="consentMethod" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
            <option value="message_opt_in">Opt-in por mensagem</option>
            <option value="callback_request">Solicitação de retorno (callback)</option>
            <option value="manual">Verbal / presencial</option>
          </select>
        </div>
        <div class="flex justify-end gap-2.5 pt-2 border-t border-gray-100">
          <button @click="showConsentModal = false" class="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            Cancelar
          </button>
          <button
            @click="confirmConsentAndCall"
            :disabled="isRecordingConsent"
            class="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Loader2Icon v-if="isRecordingConsent" class="w-4 h-4 animate-spin" />
            <span>{{ isRecordingConsent ? 'Registrando...' : 'Registrar consentimento e ligar' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Incoming call overlay -->
    <div
      v-if="incomingCall"
      class="fixed bottom-6 right-6 z-50 w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
    >
      <div class="bg-gradient-to-r from-emerald-500 to-green-600 px-5 py-4 text-white flex items-center justify-between">
        <div class="flex items-center">
          <div class="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
            <PhoneIncomingIcon class="w-5 h-5" />
          </div>
          <div class="ml-3">
            <p class="text-xs text-white/75 font-medium">Chamada de voz WhatsApp</p>
            <p class="text-lg font-bold leading-tight">{{ incomingCall.callerName || incomingCall.from }}</p>
            <p class="text-xs text-white/70 font-mono">{{ formatPhone(incomingCall.from) }}</p>
          </div>
        </div>
        <button @click="dismissIncoming" class="text-white/60 hover:text-white transition-colors">
          <XIcon class="w-5 h-5" />
        </button>
      </div>
      <div class="p-4">
        <p class="text-xs text-gray-500 mb-4 text-center">Chamada recebida. Deseja atender?</p>
        <div class="flex justify-center space-x-6">
          <button
            @click="rejectIncoming"
            class="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
            title="Rejeitar"
          >
            <PhoneOffIcon class="w-6 h-6" />
          </button>
          <button
            @click="acceptIncoming"
            class="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
            title="Atender"
          >
            <PhoneIcon class="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>

    <!-- Active call bar -->
    <div
      v-if="activeCall && activeCall.status !== 'ended'"
      class="fixed bottom-0 inset-x-0 z-40 bg-[#075e54] text-white shadow-2xl border-t border-black/10"
    >
      <div class="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div class="flex items-center min-w-0">
          <div class="relative mr-4">
            <div class="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center">
              <PhoneOutgoingIcon v-if="activeCall.direction === 'out'" class="w-5 h-5" />
              <PhoneIncomingIcon v-else class="w-5 h-5" />
            </div>
            <span
              class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#075e54]"
              :class="activeCall.status === 'connected' ? 'bg-emerald-400' : 'bg-yellow-400 animate-pulse'"
            ></span>
          </div>
          <div class="min-w-0">
            <p class="font-semibold truncate">{{ activeCall.displayName }}</p>
            <p class="text-xs text-white/70">
              <template v-if="activeCall.status === 'connected'">
                {{ formatDuration(elapsed) }}
              </template>
              <template v-else-if="activeCall.direction === 'out'">Chamando...</template>
              <template v-else>Conectando...</template>
            </p>
          </div>
        </div>

        <div class="flex items-center space-x-3">
          <button
            @click="toggleMute"
            class="w-11 h-11 rounded-full flex items-center justify-center transition-colors"
            :class="activeCall.muted ? 'bg-white/20 text-white' : 'bg-white/10 hover:bg-white/20'"
            :title="activeCall.muted ? 'Ativar microfone' : 'Silenciar microfone'"
          >
            <MicOffIcon v-if="activeCall.muted" class="w-5 h-5" />
            <MicIcon v-else class="w-5 h-5" />
          </button>
          <button
            @click="hangUp"
            class="w-11 h-11 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            title="Encerrar chamada"
          >
            <PhoneOffIcon class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Phone as PhoneIcon, PhoneOff as PhoneOffIcon, PhoneIncoming as PhoneIncomingIcon, PhoneOutgoing as PhoneOutgoingIcon, Mic as MicIcon, MicOff as MicOffIcon, X as XIcon, ShieldCheck as ShieldCheckIcon, Loader2 as Loader2Icon } from 'lucide-vue-next'
import { socketService } from '@/services/socketService'
import { callingService } from '@/services/callingService'
import { useToast } from '@/composables/useToast'

const props = defineProps<{ ticket: any }>()

const { success: toastSuccess, error: toastError } = useToast()

interface IncomingCall {
  callId: string
  from: string
  to: string
  callerName?: string
  phoneId?: string
  sdpOffer?: string
  pendingAnswer?: string
}

interface ActiveCall {
  callId: string
  direction: 'in' | 'out'
  status: string
  displayName: string
  phone: string
  startedAt: number
  muted: boolean
}

const incomingCall = ref<IncomingCall | null>(null)
const activeCall = ref<ActiveCall | null>(null)
const isBusy = ref(false)
const elapsed = ref(0)

const showConsentModal = ref(false)
const consentPhone = ref('')
const consentMethod = ref('message_opt_in')
const isRecordingConsent = ref(false)

const remoteAudioRef = ref<HTMLAudioElement | null>(null)

let pc: RTCPeerConnection | null = null
let localStream: MediaStream | null = null
let elapsedInterval: ReturnType<typeof setInterval> | null = null

const customerPhone = computed(() => {
  const phone = props.ticket?.customer?.phone || props.ticket?.customer?.login || ''
  return String(phone).replace(/\D/g, '')
})

const customerName = computed(() => {
  const c = props.ticket?.customer
  return c ? `${c.firstname || ''} ${c.lastname || ''}`.trim() : 'Cliente'
})

const formatPhone = (p: string) => (p ? String(p).replace(/\D/g, '') : '')

const formatDuration = (s: number) => {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

const startElapsed = () => {
  stopElapsed()
  elapsed.value = 0
  elapsedInterval = setInterval(() => {
    elapsed.value++
  }, 1000)
}

const stopElapsed = () => {
  if (elapsedInterval) {
    clearInterval(elapsedInterval)
    elapsedInterval = null
  }
}

const createPeerConnection = (): RTCPeerConnection => {
  const conn = new RTCPeerConnection()
  conn.ontrack = (e) => {
    const stream = e.streams[0] || new MediaStream([e.track])
    if (remoteAudioRef.value) remoteAudioRef.value.srcObject = stream
  }
  conn.onconnectionstatechange = () => {
    if (conn.connectionState === 'disconnected' || conn.connectionState === 'failed') {
      endActiveCall('Rede instável')
    }
  }
  return conn
}

const waitIceGathering = (conn: RTCPeerConnection): Promise<void> =>
  new Promise((resolve) => {
    if (conn.iceGatheringState === 'complete') return resolve()
    const done = () => {
      if (conn.iceGatheringState === 'complete') {
        conn.removeEventListener('icegatheringstatechange', done)
        resolve()
      }
    }
    conn.addEventListener('icegatheringstatechange', done)
    setTimeout(resolve, 8000)
  })

const buildSdp = async (conn: RTCPeerConnection, kind: 'offer' | 'answer'): Promise<string> => {
  const desc = kind === 'offer' ? await conn.createOffer() : await conn.createAnswer()
  await conn.setLocalDescription(desc)
  await waitIceGathering(conn)
  return conn.localDescription!.sdp!
}

const getLocalStream = async (): Promise<MediaStream> => {
  if (localStream) return localStream
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true })
  return localStream
}

const addLocalTracks = (conn: RTCPeerConnection) => {
  if (localStream) {
    localStream.getTracks().forEach((track) => conn.addTrack(track, localStream as MediaStream))
  }
}

const cleanupMedia = () => {
  stopElapsed()
  if (pc) {
    pc.ontrack = null
    pc.onconnectionstatechange = null
    pc.close()
    pc = null
  }
  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop())
    localStream = null
  }
  if (remoteAudioRef.value) remoteAudioRef.value.srcObject = null
}

// ---------------------------------------------------------------------------
// Chamada de saída
// ---------------------------------------------------------------------------

const startCall = async (phoneOverride?: string) => {
  const phone = (phoneOverride || customerPhone.value).replace(/\D/g, '')
  if (!phone || isBusy.value) return
  if (activeCall.value) {
    toastError('Ocupado', 'Já existe uma chamada ativa.')
    return
  }
  isBusy.value = true
  try {
    const consent = await callingService.getConsent(phone)
    if (!consent.granted) {
      consentPhone.value = phone
      consentMethod.value = 'message_opt_in'
      showConsentModal.value = true
      return
    }
    if (consent.allowed) {
      await doStartCall(phone)
      return
    }
    if (consent.meta_permission === null) {
      toastError('Indisponível', 'Não foi possível confirmar a permissão com a WhatsApp. Verifique a configuração (whatsapp_token/whatsapp_phone_id).')
      return
    }
    toastError('Sem permissão', 'O cliente ainda não autorizou chamadas na WhatsApp. Envie uma mensagem solicitando autorização e aguarde a aprovação.')
  } catch (err: any) {
    toastError('Erro', err?.response?.data?.message || 'Não foi possível verificar a permissão de chamada.')
  } finally {
    isBusy.value = false
  }
}

const confirmConsentAndCall = async () => {
  const phone = consentPhone.value
  if (!phone) return
  isRecordingConsent.value = true
  try {
    await callingService.recordConsent({ user_wa_id: phone, method: consentMethod.value })
    toastSuccess('Consentimento', 'Consentimento registrado (LGPD).')
    showConsentModal.value = false
    await doStartCall(phone)
  } catch (err: any) {
    toastError('Erro', err?.response?.data?.message || 'Falha ao registrar o consentimento.')
  } finally {
    isRecordingConsent.value = false
  }
}

const doStartCall = async (phone: string) => {
  isBusy.value = true
  try {
    const stream = await getLocalStream()
    const conn = createPeerConnection()
    pc = conn
    addLocalTracks(conn)

    const sdp = await buildSdp(conn, 'offer')

    const res = await callingService.initiateCall({
      to: phone,
      sdp,
      biz_opaque_callback_data: `ticket-${props.ticket?.id || ''}`,
    })

    if (!res.callId) {
      throw new Error('Meta não retornou call_id')
    }

    activeCall.value = {
      callId: res.callId,
      direction: 'out',
      status: 'calling',
      displayName: customerName.value || phone,
      phone,
      startedAt: Date.now(),
      muted: false,
    }
    startElapsed()
  } catch (err: any) {
    cleanupMedia()
    toastError('Erro', err?.response?.data?.message || 'Não foi possível iniciar a chamada.')
  } finally {
    isBusy.value = false
  }
}

// ---------------------------------------------------------------------------
// Chamada de entrada
// ---------------------------------------------------------------------------

const prepareIncoming = async (payload: any) => {
  const callId = payload.callId
  const offer = payload.sdp

  if (activeCall.value) {
    // Já ocupado: rejeita automaticamente
    try {
      await callingService.callAction({ callId, action: 'reject' })
    } catch (e) {
      /* noop */
    }
    return
  }

  incomingCall.value = {
    callId,
    from: payload.from,
    to: payload.to,
    callerName: payload.callerName,
    phoneId: payload.phoneId,
    sdpOffer: offer,
  }

  if (!offer) return

  try {
    const stream = await getLocalStream()
    const conn = createPeerConnection()
    pc = conn
    addLocalTracks(conn)
    await conn.setRemoteDescription({ type: 'offer', sdp: offer })
    const answer = await buildSdp(conn, 'answer')
    if (incomingCall.value && incomingCall.value.callId === callId) {
      incomingCall.value.pendingAnswer = answer
    }
  } catch (err) {
    console.error('Falha ao preparar WebRTC da chamada de entrada', err)
  }
}

const acceptIncoming = async () => {
  const call = incomingCall.value
  if (!call) return
  try {
    await callingService.callAction({
      callId: call.callId,
      action: 'accept',
      sdp: call.pendingAnswer,
    })
    activeCall.value = {
      callId: call.callId,
      direction: 'in',
      status: 'connected',
      displayName: call.callerName || call.from,
      phone: call.from,
      startedAt: Date.now(),
      muted: false,
    }
    incomingCall.value = null
    startElapsed()
  } catch (err: any) {
    toastError('Erro', err?.response?.data?.message || 'Falha ao atender a chamada.')
  }
}

const rejectIncoming = async () => {
  const call = incomingCall.value
  if (!call) return
  try {
    await callingService.callAction({ callId: call.callId, action: 'reject' })
  } catch (e) {
    /* noop */
  }
  incomingCall.value = null
  cleanupMedia()
}

const dismissIncoming = () => {
  incomingCall.value = null
  cleanupMedia()
}

// ---------------------------------------------------------------------------
// Controle / encerramento
// ---------------------------------------------------------------------------

const toggleMute = () => {
  if (!activeCall.value) return
  activeCall.value.muted = !activeCall.value.muted
  if (localStream) {
    localStream.getAudioTracks().forEach((t) => {
      t.enabled = !activeCall.value!.muted
    })
  }
}

const endActiveCall = (reason?: string) => {
  activeCall.value = null
  cleanupMedia()
  if (reason) toastSuccess('Chamada', reason)
}

const hangUp = async () => {
  const call = activeCall.value
  activeCall.value = null
  if (call) {
    try {
      await callingService.callAction({ callId: call.callId, action: 'terminate' })
    } catch (e) {
      /* noop */
    }
  }
  cleanupMedia()
}

// ---------------------------------------------------------------------------
// Eventos do socket
// ---------------------------------------------------------------------------

const handleCallIncoming = (payload: any) => {
  prepareIncoming(payload)
}

const handleCallRinging = (payload: any) => {
  if (activeCall.value && activeCall.value.callId === payload.callId) {
    activeCall.value.status = 'ringing'
  }
}

const handleCallState = async (payload: any) => {
  if (activeCall.value && activeCall.value.callId === payload.callId) {
    if (payload.sdp && pc && activeCall.value.status !== 'connected') {
      try {
        await pc.setRemoteDescription({ type: 'answer', sdp: payload.sdp })
        activeCall.value.status = 'connected'
      } catch (err) {
        console.error('Falha ao aplicar resposta da chamada de saída', err)
      }
    } else if (payload.status) {
      activeCall.value.status = payload.status
    }
  }
}

const handleCallTerminated = (payload: any) => {
  const wasActive = activeCall.value?.callId === payload.callId
  const wasIncoming = incomingCall.value?.callId === payload.callId
  if (wasActive) {
    activeCall.value = null
  }
  if (wasIncoming) {
    incomingCall.value = null
  }
  if (wasActive || wasIncoming) {
    cleanupMedia()
    if (payload.duration) {
      toastSuccess('Chamada', `Chamada encerrada (${formatDuration(Number(payload.duration))}).`)
    }
  }
}

onMounted(() => {
  const socket = socketService.getSocket()
  if (socket) {
    socket.on('call_incoming', handleCallIncoming)
    socket.on('call_ringing', handleCallRinging)
    socket.on('call_state', handleCallState)
    socket.on('call_terminated', handleCallTerminated)
  }
})

onUnmounted(() => {
  const socket = socketService.getSocket()
  if (socket) {
    socket.off('call_incoming', handleCallIncoming)
    socket.off('call_ringing', handleCallRinging)
    socket.off('call_state', handleCallState)
    socket.off('call_terminated', handleCallTerminated)
  }
  cleanupMedia()
})

// Encerra a chamada ao trocar de ticket
watch(
  () => props.ticket?.id,
  () => {
    if (activeCall.value) hangUp()
  },
)

defineExpose({ startCall })
</script>