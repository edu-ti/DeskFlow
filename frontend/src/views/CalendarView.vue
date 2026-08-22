<template>
  <div class="h-full flex flex-col gap-5 p-6 max-w-7xl mx-auto overflow-y-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
      <div>
        <div class="flex items-center gap-2">
          <div class="w-10 h-10 rounded-xl bg-df-primary/10 text-df-primary flex items-center justify-center font-bold">
            <CalendarIcon class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-xl font-extrabold text-gray-900">Agenda & Field Service</h1>
            <p class="text-xs text-gray-500">Gestão de atendimentos presenciais, rotas e atividades externas de técnicos</p>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <!-- View Selector -->
        <div class="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600">
          <button 
            @click="currentView = 'month'"
            :class="currentView === 'month' ? 'bg-white text-gray-900 shadow-xs' : 'hover:text-gray-900'"
            class="px-3 py-1.5 rounded-lg transition-all"
          >
            Mês
          </button>
          <button 
            @click="currentView = 'week'"
            :class="currentView === 'week' ? 'bg-white text-gray-900 shadow-xs' : 'hover:text-gray-900'"
            class="px-3 py-1.5 rounded-lg transition-all"
          >
            Semana
          </button>
          <button 
            @click="currentView = 'day'"
            :class="currentView === 'day' ? 'bg-white text-gray-900 shadow-xs' : 'hover:text-gray-900'"
            class="px-3 py-1.5 rounded-lg transition-all"
          >
            Dia
          </button>
          <button 
            @click="currentView = 'list'"
            :class="currentView === 'list' ? 'bg-white text-gray-900 shadow-xs' : 'hover:text-gray-900'"
            class="px-3 py-1.5 rounded-lg transition-all"
          >
            Lista
          </button>
        </div>

        <button 
          @click="openNewActivityModal()"
          class="flex items-center gap-2 px-4 py-2 bg-df-primary hover:bg-df-primary-hover text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <PlusIcon class="w-4 h-4" />
          <span>Agendar Visita</span>
        </button>
      </div>
    </div>

    <!-- Filters & Navigation Bar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
      <div class="flex items-center gap-3">
        <button 
          @click="navigatePeriod(-1)"
          class="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeftIcon class="w-4 h-4" />
        </button>
        <button 
          @click="goToToday()"
          class="px-3 py-1 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Hoje
        </button>
        <button 
          @click="navigatePeriod(1)"
          class="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ChevronRightIcon class="w-4 h-4" />
        </button>
        <span class="text-sm font-extrabold text-gray-800 ml-2 capitalize">{{ currentPeriodLabel }}</span>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- Technician Filter -->
        <select 
          v-model="selectedTechnicianId" 
          @change="fetchActivities"
          class="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-df-primary/20"
        >
          <option :value="null">Todos os Técnicos</option>
          <option v-for="t in technicians" :key="t.id" :value="t.id">
            {{ t.firstname }} {{ t.lastname }}
          </option>
        </select>

        <!-- Status Filter -->
        <select 
          v-model="selectedStatus" 
          @change="fetchActivities"
          class="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-df-primary/20"
        >
          <option value="">Todos os Status</option>
          <option value="scheduled">Agendado</option>
          <option value="traveling">Em Deslocamento</option>
          <option value="in_progress">Em Atendimento</option>
          <option value="completed">Concluído</option>
        </select>
      </div>
    </div>

    <!-- Main Calendar Content -->
    <div class="bg-white rounded-2xl border border-gray-200/80 shadow-xs flex-1 min-h-[500px] overflow-hidden flex flex-col">
      <div v-if="isLoading" class="flex-1 flex items-center justify-center p-12">
        <Loader2Icon class="w-8 h-8 text-df-primary animate-spin" />
      </div>

      <!-- Month View -->
      <div v-else-if="currentView === 'month'" class="flex flex-col flex-1">
        <div class="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80 text-center py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <div v-for="d in ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']" :key="d">{{ d }}</div>
        </div>
        <div class="grid grid-cols-7 flex-1 auto-rows-fr divide-x divide-y divide-gray-100">
          <div 
            v-for="(day, idx) in monthDays" 
            :key="idx" 
            :class="[
              'p-2 min-h-[110px] flex flex-col transition-colors',
              day.isCurrentMonth ? 'bg-white' : 'bg-gray-50/50 text-gray-300',
              isSameDay(day.date, new Date()) ? 'bg-blue-50/30' : ''
            ]"
          >
            <div class="flex items-center justify-between mb-1.5">
              <span 
                :class="[
                  'text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full',
                  isSameDay(day.date, new Date()) ? 'bg-df-primary text-white' : 'text-gray-700'
                ]"
              >
                {{ day.date.getDate() }}
              </span>
              <span v-if="day.activities.length > 0" class="text-[10px] font-bold text-gray-400">
                {{ day.activities.length }} {{ day.activities.length === 1 ? 'visita' : 'visitas' }}
              </span>
            </div>

            <div class="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-0.5">
              <div 
                v-for="act in day.activities" 
                :key="act.id"
                @click="openActivityDetails(act)"
                :class="getStatusBadgeClass(act.status)"
                class="p-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all hover:scale-[1.02] shadow-2xs truncate flex items-center gap-1.5"
              >
                <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="getStatusDotClass(act.status)"></span>
                <span class="font-bold shrink-0">{{ formatTime(act.scheduled_at) }}</span>
                <span class="truncate">{{ act.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Week View -->
      <div v-else-if="currentView === 'week'" class="flex flex-col flex-1 divide-y divide-gray-200">
        <div class="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80 text-center py-2 text-xs font-bold text-gray-600">
          <div v-for="day in weekDays" :key="day.date.toISOString()" class="py-1">
            <div class="text-[11px] text-gray-400 uppercase">{{ getWeekdayShort(day.date) }}</div>
            <div 
              :class="isSameDay(day.date, new Date()) ? 'bg-df-primary text-white' : 'text-gray-800'"
              class="w-7 h-7 mx-auto rounded-full flex items-center justify-center text-sm font-extrabold mt-0.5"
            >
              {{ day.date.getDate() }}
            </div>
          </div>
        </div>
        <div class="grid grid-cols-7 flex-1 divide-x divide-gray-100 min-h-[400px]">
          <div v-for="day in weekDays" :key="day.date.toISOString()" class="p-2 space-y-2 overflow-y-auto">
            <div 
              v-for="act in day.activities" 
              :key="act.id"
              @click="openActivityDetails(act)"
              :class="getStatusBadgeClass(act.status)"
              class="p-2.5 rounded-xl border text-xs cursor-pointer hover:shadow-xs transition-all"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="font-bold">{{ formatTime(act.scheduled_at) }}</span>
                <span class="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/70">
                  {{ getStatusLabel(act.status) }}
                </span>
              </div>
              <p class="font-bold text-gray-900 truncate mb-1">{{ act.title }}</p>
              <p v-if="act.organization" class="text-[11px] text-gray-600 truncate flex items-center gap-1">
                <Building2Icon class="w-3 h-3 text-gray-400" />
                {{ act.organization.name }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Day / List View -->
      <div v-else class="p-6 divide-y divide-gray-100 space-y-4">
        <div v-if="filteredActivities.length === 0" class="text-center py-12 text-gray-400">
          <CalendarIcon class="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p class="font-medium text-sm">Nenhuma atividade ou visita agendada para o período selecionado.</p>
        </div>

        <div 
          v-for="act in filteredActivities" 
          :key="act.id"
          class="pt-4 first:pt-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-gray-50/60 p-3 rounded-2xl transition-all"
        >
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center shrink-0">
              <span class="text-[10px] font-bold text-blue-600 uppercase">{{ new Date(act.scheduled_at).toLocaleDateString('pt-BR', { month: 'short' }) }}</span>
              <span class="text-base font-extrabold text-blue-900 leading-none">{{ new Date(act.scheduled_at).getDate() }}</span>
            </div>

            <div>
              <div class="flex items-center gap-2 mb-1">
                <span :class="getStatusBadgeClass(act.status)" class="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase border">
                  {{ getStatusLabel(act.status) }}
                </span>
                <span class="text-xs font-semibold text-gray-400">
                  {{ formatTime(act.scheduled_at) }} ({{ act.estimated_duration_mins }}m est.)
                </span>
                <span v-if="act.ticket" class="text-xs font-bold text-df-primary bg-df-primary/10 px-2 py-0.5 rounded-md">
                  #{{ act.ticket.id }}
                </span>
              </div>
              <h3 class="text-sm font-bold text-gray-900">{{ act.title }}</h3>
              <div class="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                <span v-if="act.organization" class="flex items-center gap-1 font-medium text-gray-700">
                  <Building2Icon class="w-3.5 h-3.5 text-gray-400" />
                  {{ act.organization.name }}
                </span>
                <span v-if="act.technician" class="flex items-center gap-1">
                  <UserIcon class="w-3.5 h-3.5 text-gray-400" />
                  {{ act.technician.firstname }} {{ act.technician.lastname }}
                </span>
                <span v-if="act.address" class="flex items-center gap-1 truncate max-w-xs">
                  <MapPinIcon class="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {{ act.address }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0 self-end md:self-center">
            <a 
              v-if="act.address"
              :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.address)}`"
              target="_blank"
              class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <NavigationIcon class="w-3.5 h-3.5" />
              <span>Rota</span>
            </a>
            <button 
              @click="openActivityDetails(act)"
              class="px-3 py-1.5 bg-df-primary text-white hover:bg-df-primary-hover text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Ver Detalhes
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Detalhes da Atividade / Check-in & Check-out -->
    <div v-if="selectedActivity" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span :class="getStatusBadgeClass(selectedActivity.status)" class="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase border">
                {{ getStatusLabel(selectedActivity.status) }}
              </span>
              <span v-if="selectedActivity.ticket" class="text-xs font-bold text-df-primary bg-df-primary/10 px-2 py-0.5 rounded-md">
                Chamado #{{ selectedActivity.ticket.id }}
              </span>
            </div>
            <h2 class="text-lg font-extrabold text-gray-900">{{ selectedActivity.title }}</h2>
          </div>
          <button @click="selectedActivity = null" class="text-gray-400 hover:text-gray-600 p-1">
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div class="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
            <div class="flex items-center justify-between">
              <span class="text-gray-500 font-semibold">Horário Agendado:</span>
              <span class="font-bold text-gray-800">{{ new Date(selectedActivity.scheduled_at).toLocaleString('pt-BR') }}</span>
            </div>
            <div v-if="selectedActivity.organization" class="flex items-center justify-between">
              <span class="text-gray-500 font-semibold">Empresa / Cliente:</span>
              <span class="font-bold text-gray-800">{{ selectedActivity.organization.name }}</span>
            </div>
            <div v-if="selectedActivity.technician" class="flex items-center justify-between">
              <span class="text-gray-500 font-semibold">Técnico Externo:</span>
              <span class="font-bold text-gray-800">{{ selectedActivity.technician.firstname }} {{ selectedActivity.technician.lastname }}</span>
            </div>
            <div v-if="selectedActivity.address" class="pt-2 border-t border-gray-200/60">
              <span class="text-gray-500 font-semibold block mb-1">Endereço da Visita:</span>
              <p class="font-medium text-gray-800">{{ selectedActivity.address }}</p>
              <div class="flex items-center gap-2 mt-2">
                <a 
                  :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedActivity.address)}`"
                  target="_blank"
                  class="text-df-primary hover:underline font-bold flex items-center gap-1"
                >
                  <NavigationIcon class="w-3.5 h-3.5" /> Abrir no Google Maps
                </a>
                <a 
                  :href="`https://waze.com/ul?q=${encodeURIComponent(selectedActivity.address)}`"
                  target="_blank"
                  class="text-blue-600 hover:underline font-bold flex items-center gap-1 ml-3"
                >
                  Abrir no Waze
                </a>
              </div>
            </div>
          </div>

          <div v-if="selectedActivity.description" class="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <span class="text-gray-500 font-semibold block mb-1">Descrição / Instruções:</span>
            <p class="text-gray-700 whitespace-pre-wrap">{{ selectedActivity.description }}</p>
          </div>

          <!-- Histórico de Check-in & Check-out -->
          <div v-if="selectedActivity.checkin_at || selectedActivity.checkout_at" class="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
            <div v-if="selectedActivity.checkin_at" class="flex items-start justify-between gap-2">
              <span class="text-blue-800 font-bold">📍 Check-in Realizado:</span>
              <span class="text-gray-600">{{ new Date(selectedActivity.checkin_at).toLocaleTimeString('pt-BR') }}</span>
            </div>
            <div v-if="selectedActivity.checkout_at" class="flex items-start justify-between gap-2">
              <span class="text-emerald-800 font-bold">🏁 Check-out Realizado:</span>
              <span class="text-gray-600">{{ new Date(selectedActivity.checkout_at).toLocaleTimeString('pt-BR') }}</span>
            </div>
          </div>
        </div>

        <!-- Ações do Técnico Externo -->
        <div class="space-y-3 pt-2 border-t border-gray-100">
          <div v-if="selectedActivity.status === 'scheduled'" class="flex items-center gap-2">
            <button 
              @click="setStatus(selectedActivity.id, 'traveling')" 
              class="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <CarIcon class="w-4 h-4" />
              <span>Iniciar Deslocamento</span>
            </button>
            <button 
              @click="performCheckIn(selectedActivity.id)" 
              class="flex-1 py-2.5 bg-df-primary hover:bg-df-primary-hover text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <MapPinIcon class="w-4 h-4" />
              <span>Fazer Check-in (Cheguei)</span>
            </button>
          </div>

          <div v-else-if="selectedActivity.status === 'traveling'" class="flex items-center gap-2">
            <button 
              @click="performCheckIn(selectedActivity.id)" 
              class="w-full py-2.5 bg-df-primary hover:bg-df-primary-hover text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <MapPinIcon class="w-4 h-4" />
              <span>Fazer Check-in (Chegada no Local)</span>
            </button>
          </div>

          <div v-else-if="selectedActivity.status === 'in_progress'" class="space-y-2">
            <textarea 
              v-model="checkoutNotes"
              placeholder="Digite o relato do atendimento presencial antes do checkout..."
              rows="2"
              class="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:border-df-primary"
            ></textarea>
            <button 
              @click="performCheckOut(selectedActivity.id)" 
              class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircleIcon class="w-4 h-4" />
              <span>Concluir Atendimento (Check-out)</span>
            </button>
          </div>

          <div v-else-if="selectedActivity.status === 'completed'" class="text-center py-2 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200">
            ✅ Atendimento Presencial Finalizado com Sucesso
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Nova Visita / Atividade Presencial -->
    <div v-if="showNewModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95">
        <div class="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 class="text-base font-extrabold text-gray-900">Agendar Atendimento Presencial</h2>
          <button @click="showNewModal = false" class="text-gray-400 hover:text-gray-600 p-1">
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="saveNewActivity" class="space-y-3.5 text-xs">
          <div>
            <label class="block font-bold text-gray-700 mb-1">Título da Atividade *</label>
            <input 
              v-model="newActivityForm.title" 
              type="text" 
              required
              placeholder="Ex: Troca de Switch / Manutenção no Servidor"
              class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-df-primary"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-gray-700 mb-1">Data & Hora *</label>
              <input 
                v-model="newActivityForm.scheduled_at" 
                type="datetime-local" 
                required
                class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-df-primary"
              />
            </div>
            <div>
              <label class="block font-bold text-gray-700 mb-1">Duração Est. (minutos)</label>
              <input 
                v-model.number="newActivityForm.estimated_duration_mins" 
                type="number" 
                step="30"
                class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-df-primary"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-gray-700 mb-1">Técnico Externo</label>
              <select 
                v-model="newActivityForm.technician_id"
                class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-df-primary"
              >
                <option :value="null">Não atribuído</option>
                <option v-for="t in technicians" :key="t.id" :value="t.id">
                  {{ t.firstname }} {{ t.lastname }}
                </option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-gray-700 mb-1">Vincular a Chamado (#ID)</label>
              <input 
                v-model.number="newActivityForm.ticket_id"
                type="number"
                placeholder="Ex: 1042"
                class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-df-primary"
              />
            </div>
          </div>

          <div>
            <label class="block font-bold text-gray-700 mb-1">Endereço Completo do Atendimento</label>
            <input 
              v-model="newActivityForm.address"
              type="text"
              placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
              class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-df-primary"
            />
          </div>

          <div>
            <label class="block font-bold text-gray-700 mb-1">Instruções / Detalhes</label>
            <textarea 
              v-model="newActivityForm.description"
              rows="2"
              placeholder="Descreva o escopo da visita..."
              class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-df-primary"
            ></textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button 
              type="button" 
              @click="showNewModal = false" 
              class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              class="px-4 py-2 bg-df-primary hover:bg-df-primary-hover text-white font-bold rounded-xl text-xs shadow-xs"
            >
              Salvar e Agendar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  Calendar as CalendarIcon, 
  ChevronLeft as ChevronLeftIcon, 
  ChevronRight as ChevronRightIcon, 
  Plus as PlusIcon, 
  MapPin as MapPinIcon, 
  User as UserIcon, 
  Building2 as Building2Icon, 
  Navigation as NavigationIcon, 
  Car as CarIcon, 
  CheckCircle as CheckCircleIcon, 
  X as XIcon, 
  Loader2 as Loader2Icon 
} from 'lucide-vue-next'
import { fieldService, type FieldActivity } from '../services/fieldService'
import { iamService } from '../services/iamService'
import { useToast } from '@/composables/useToast'

const { success: toastSuccess, error: toastError } = useToast()

const currentView = ref<'month' | 'week' | 'day' | 'list'>('month')
const currentDate = ref(new Date())
const activities = ref<FieldActivity[]>([])
const technicians = ref<any[]>([])
const selectedTechnicianId = ref<number | null>(null)
const selectedStatus = ref<string>('')
const isLoading = ref(false)
const selectedActivity = ref<FieldActivity | null>(null)
const showNewModal = ref(false)
const checkoutNotes = ref('')

const newActivityForm = ref<{
  title: string;
  scheduled_at: string;
  estimated_duration_mins: number;
  technician_id: number | null;
  ticket_id: number | null;
  address: string;
  description: string;
}>({
  title: '',
  scheduled_at: new Date().toISOString().slice(0, 16),
  estimated_duration_mins: 120,
  technician_id: null,
  ticket_id: null,
  address: '',
  description: '',
})

const currentPeriodLabel = computed(() => {
  if (currentView.value === 'month') {
    return currentDate.value.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }
  if (currentView.value === 'week') {
    const start = new Date(currentDate.value)
    start.setDate(start.getDate() - start.getDay())
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return `${start.getDate()} a ${end.getDate()} de ${end.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`
  }
  return currentDate.value.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
})

const filteredActivities = computed(() => {
  return activities.value.filter(a => {
    if (selectedTechnicianId.value && a.technician_id !== selectedTechnicianId.value) return false;
    if (selectedStatus.value && a.status !== selectedStatus.value) return false;
    return true;
  })
})

const monthDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  const days: { date: Date; isCurrentMonth: boolean; activities: FieldActivity[] }[] = []
  
  // Preencher dias do mês anterior
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = firstDay.getDay() - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i)
    days.push({ date: d, isCurrentMonth: false, activities: getActivitiesForDate(d) })
  }

  // Dias do mês atual
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i)
    days.push({ date: d, isCurrentMonth: true, activities: getActivitiesForDate(d) })
  }

  // Preencher dias do próximo mês para fechar a grade (múltiplo de 7)
  const remaining = (7 - (days.length % 7)) % 7
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i)
    days.push({ date: d, isCurrentMonth: false, activities: getActivitiesForDate(d) })
  }

  return days
})

const weekDays = computed(() => {
  const days: { date: Date; activities: FieldActivity[] }[] = []
  const start = new Date(currentDate.value)
  start.setDate(start.getDate() - start.getDay())
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    days.push({ date: d, activities: getActivitiesForDate(d) })
  }
  return days
})

const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate()
}

const getActivitiesForDate = (date: Date) => {
  return filteredActivities.value.filter(a => isSameDay(new Date(a.scheduled_at), date))
}

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const getWeekdayShort = (date: Date) => {
  return date.toLocaleDateString('pt-BR', { weekday: 'short' })
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    scheduled: 'Agendado',
    traveling: 'Em Deslocamento',
    in_progress: 'Em Atendimento',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  }
  return map[status] || status
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'scheduled': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'traveling': return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'in_progress': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

const getStatusDotClass = (status: string) => {
  switch (status) {
    case 'scheduled': return 'bg-blue-500';
    case 'traveling': return 'bg-amber-500';
    case 'in_progress': return 'bg-purple-500';
    case 'completed': return 'bg-emerald-500';
    default: return 'bg-gray-400';
  }
}

const navigatePeriod = (delta: number) => {
  const d = new Date(currentDate.value)
  if (currentView.value === 'month') {
    d.setMonth(d.getMonth() + delta)
  } else if (currentView.value === 'week') {
    d.setDate(d.getDate() + delta * 7)
  } else {
    d.setDate(d.getDate() + delta)
  }
  currentDate.value = d
  fetchActivities()
}

const goToToday = () => {
  currentDate.value = new Date()
  fetchActivities()
}

const fetchActivities = async () => {
  isLoading.value = true
  try {
    activities.value = await fieldService.getActivities({
      technician_id: selectedTechnicianId.value || undefined,
      status: selectedStatus.value || undefined,
    })
  } catch (error) {
    console.error('Failed to load field activities', error)
  } finally {
    isLoading.value = false
  }
}

const fetchTechnicians = async () => {
  try {
    const users = await iamService.getUsers()
    technicians.value = users.filter((u: any) => u.roles?.some((r: any) => r.name === 'admin' || r.name === 'agent'))
  } catch (error) {
    console.error('Failed to load technicians', error)
  }
}

const openActivityDetails = (act: FieldActivity) => {
  selectedActivity.value = act
  checkoutNotes.value = act.checkout_notes || ''
}

const setStatus = async (id: number, status: string) => {
  try {
    await fieldService.updateActivity(id, { status: status as any })
    toastSuccess('Status atualizado', `Atividade marcada como ${getStatusLabel(status)}`)
    await fetchActivities()
    if (selectedActivity.value?.id === id) {
      selectedActivity.value = await fieldService.getActivityById(id)
    }
  } catch (error) {
    toastError('Erro', 'Falha ao atualizar status da visita.')
  }
}

const performCheckIn = async (id: number) => {
  try {
    await fieldService.checkIn(id, {})
    toastSuccess('Check-in realizado', 'Chegada no local confirmada!')
    await fetchActivities()
    if (selectedActivity.value?.id === id) {
      selectedActivity.value = await fieldService.getActivityById(id)
    }
  } catch (error) {
    toastError('Erro', 'Falha ao realizar check-in.')
  }
}

const performCheckOut = async (id: number) => {
  try {
    await fieldService.checkOut(id, { notes: checkoutNotes.value })
    toastSuccess('Check-out realizado', 'Atendimento presencial concluído!')
    await fetchActivities()
    selectedActivity.value = null
  } catch (error) {
    toastError('Erro', 'Falha ao realizar check-out.')
  }
}

const openNewActivityModal = () => {
  newActivityForm.value = {
    title: '',
    scheduled_at: new Date().toISOString().slice(0, 16),
    estimated_duration_mins: 120,
    technician_id: null,
    ticket_id: null,
    address: '',
    description: '',
  }
  showNewModal.value = true
}

const saveNewActivity = async () => {
  try {
    await fieldService.createActivity(newActivityForm.value)
    toastSuccess('Sucesso', 'Atendimento presencial agendado com sucesso!')
    showNewModal.value = false
    await fetchActivities()
  } catch (error) {
    toastError('Erro', 'Falha ao agendar atendimento presencial.')
  }
}

onMounted(() => {
  fetchTechnicians()
  fetchActivities()
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}
</style>
