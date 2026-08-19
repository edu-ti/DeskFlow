<template>
  <div class="flex h-[calc(100vh-4rem)] -mx-8 -my-8 overflow-hidden bg-white">
    <!-- Left Panel: Chat List -->
    <div class="w-1/2 max-w-[700px] min-w-[550px] flex-shrink-0 border-r border-gray-200 flex flex-col h-full bg-gray-50">
      <!-- Tabs -->
      <div class="px-4 py-3 border-b border-gray-200 bg-white">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-gray-800">WhatsApp (Omnichannel)</h2>
          <button 
            @click="showSimulateModal = true" 
            class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm active:scale-95"
            title="Simular mensagem recebida pelo WhatsApp"
          >
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Simular Mensagem
          </button>
        </div>
        <div class="flex space-x-1 overflow-x-auto pb-1 scrollbar-hide">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            class="px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors"
            :class="activeTab === tab.id ? 'bg-df-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          >
            {{ tab.label }}
            <span v-if="getTicketCount(tab.id) > 0" 
                  class="ml-1 px-1.5 py-0.5 text-xs rounded-full"
                  :class="activeTab === tab.id ? 'bg-white/20' : 'bg-gray-300 text-gray-700'">
              {{ getTicketCount(tab.id) }}
            </span>
          </button>
        </div>
      </div>
      
      <!-- Search -->
      <div class="p-3 bg-white border-b border-gray-200">
        <div class="relative">
          <SearchIcon class="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Pesquisar conversas..." 
            class="w-full pl-9 pr-3 py-2 bg-gray-100 border-transparent rounded-lg text-sm focus:border-df-primary focus:ring-1 focus:ring-df-primary outline-none"
          >
        </div>
      </div>

      <!-- Conversations List -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="isLoadingTickets" class="flex justify-center p-8">
          <Loader2Icon class="w-6 h-6 text-df-primary animate-spin" />
        </div>
        <div v-else-if="filteredTickets.length === 0" class="flex flex-col items-center justify-center p-8 text-gray-400">
          <MessageCircleIcon class="w-12 h-12 mb-3 text-gray-300" />
          <p class="text-sm text-center">Nenhuma conversa encontrada nesta aba.</p>
        </div>
        <div v-else>
          <div 
            v-for="ticket in filteredTickets" 
            :key="ticket.id"
            @click="selectTicket(ticket)"
            class="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
            :class="selectedTicket?.id === ticket.id ? 'bg-blue-50 hover:bg-blue-50' : 'bg-white'"
          >
            <div class="flex justify-between items-start mb-1">
              <h3 class="font-medium text-gray-900 truncate flex-1">
                {{ ticket.customer ? `${ticket.customer.firstname} ${ticket.customer.lastname}` : 'Cliente' }}
              </h3>
              <span class="text-xs text-gray-500 whitespace-nowrap ml-2">
                {{ formatTime(ticket.updated_at) }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <p class="text-sm text-gray-500 truncate flex-1">
                {{ ticket.title }}
              </p>
              <span v-if="ticket.unread" class="w-2.5 h-2.5 bg-green-500 rounded-full ml-2"></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Panel: Active Chat -->
    <div class="flex-1 flex flex-col h-full bg-[#efeae2] relative min-w-0">
      <div v-if="!selectedTicket" class="flex flex-col items-center justify-center h-full text-gray-400 bg-white">
        <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" class="w-24 h-24 mb-6 opacity-20 grayscale" alt="WhatsApp" />
        <h2 class="text-xl font-medium text-gray-600 mb-2">DeskFlow Omnichannel</h2>
        <p class="text-sm">Selecione uma conversa na lista à esquerda para começar.</p>
      </div>
      
      <template v-else>
        <!-- Chat Header -->
        <div class="h-16 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-10 shadow-sm">
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-green-500 to-green-600 flex items-center justify-center text-white font-bold mr-3 shadow-sm">
              {{ (selectedTicket.customer?.firstname || 'C')[0].toUpperCase() }}
            </div>
            <div>
              <h2 class="font-medium text-gray-900">
                {{ selectedTicket.customer ? `${selectedTicket.customer.firstname} ${selectedTicket.customer.lastname}` : 'Cliente' }}
              </h2>
              <p class="text-xs text-green-600 font-medium">WhatsApp</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-2">
            <select v-model="selectedTicket.state_id" @change="changeStatus(selectedTicket.state_id)" class="text-sm border-gray-300 rounded-md focus:ring-df-primary focus:border-df-primary bg-white h-9">
              <option :value="1">Triagem</option>
              <option :value="2">Aberto</option>
              <option :value="3">Em Atendimento</option>
              <option :value="4">Pendente</option>
              <option :value="6">Dúvida</option>
              <option :value="5">Resolvido</option>
            </select>
            
            <div class="relative">
              <button @click="showActionsMenu = !showActionsMenu" class="flex items-center px-3 h-9 bg-df-primary hover:bg-df-primary-hover text-white text-sm font-medium rounded-md transition-colors" title="Ações Rápidas">
                <ZapIcon class="w-4 h-4 mr-1.5" />
                Ações
              </button>
              
              <!-- Dropdown de Ações -->
              <div v-if="showActionsMenu" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
                <button @click="quickAction('alterar_assunto')" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                  Alterar assunto
                </button>
                <button @click="quickAction('mesclar')" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                  Mesclar chamado
                </button>
                <button @click="quickAction('vincular')" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                  Vincular a um chamado
                </button>
                <button @click="quickAction('subprocesso')" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                  Criar subprocesso
                </button>
                <button @click="quickAction('transferir')" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                  Transferir Setor
                </button>
              </div>
            </div>

            <button @click="toggleInfoSidebar" class="flex items-center px-3 h-9 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-md transition-colors" title="Informações do Chamado">
              <InfoIcon class="w-4 h-4 mr-1.5" />
              Info
            </button>
          </div>
        </div>

        <!-- Chat Messages -->
        <div class="flex-1 overflow-y-auto p-6 space-y-4" ref="messagesContainer">
          <div v-if="isLoadingMessages" class="flex justify-center p-4">
            <Loader2Icon class="w-6 h-6 text-gray-500 animate-spin" />
          </div>
          <template v-else>
            <div 
              v-for="msg in messages" 
              :key="msg.id"
              class="flex flex-col"
              :class="msg.isInternal || msg.senderType === 'agent' ? 'items-end' : 'items-start'"
            >
              <div 
                class="max-w-[75%] rounded-lg p-3 shadow-sm relative"
                :class="{
                  'bg-[#d9fdd3] text-gray-800 rounded-tr-none': (msg.isInternal || msg.senderType === 'agent') && !msg.isSystem,
                  'bg-white text-gray-800 rounded-tl-none': !msg.isInternal && msg.senderType !== 'agent' && !msg.isSystem,
                  'bg-yellow-100 text-yellow-800 text-xs mx-auto text-center !max-w-full': msg.isSystem
                }"
              >
                <!-- System Message -->
                <template v-if="msg.isSystem">
                  {{ msg.body }}
                </template>
                
                <!-- Normal Message -->
                <template v-else>
                  <p v-if="msg.body && !msg.body.startsWith('[Mídia recebida')" class="whitespace-pre-wrap text-sm leading-relaxed" v-html="formatMessage(msg.body)"></p>
                  
                  <!-- Attachments -->
                  <div v-if="msg.attachments && msg.attachments.length > 0" class="mt-2 space-y-2">
                    <div v-for="(att, idx) in msg.attachments" :key="idx" class="max-w-full">
                      <!-- Imagem -->
                      <img v-if="att.mimetype && att.mimetype.startsWith('image/')" :src="backendUrl + att.url" class="rounded-lg max-h-64 object-contain cursor-pointer" @click="openImage(backendUrl + att.url)" />
                      <!-- Video -->
                      <video v-else-if="att.mimetype && att.mimetype.startsWith('video/')" :src="backendUrl + att.url" controls class="rounded-lg max-h-64 w-full"></video>
                      <!-- Audio -->
                      <audio v-else-if="att.mimetype && att.mimetype.startsWith('audio/')" :src="backendUrl + att.url" controls class="w-full min-w-[220px] max-w-[280px]"></audio>
                      <!-- Documento -->
                      <a v-else :href="backendUrl + att.url" target="_blank" class="flex items-center p-3 bg-white/50 rounded-lg border border-black/5 hover:bg-white/80 transition-colors">
                        <FileIcon class="w-6 h-6 text-gray-500 mr-2 flex-shrink-0" />
                        <div class="truncate min-w-0">
                          <p class="text-sm font-medium text-gray-800 truncate">{{ att.filename || 'Arquivo' }}</p>
                          <p class="text-[10px] text-gray-500 uppercase">{{ att.mimetype ? att.mimetype.split('/')[1] : 'Documento' }}</p>
                        </div>
                      </a>
                    </div>
                  </div>

                  <div class="flex items-center justify-end mt-1 space-x-1">
                    <span class="text-[10px] text-gray-500">{{ formatTime(msg.created_at) }}</span>
                    <!-- Fake read receipt for agent messages -->
                    <CheckCheckIcon v-if="msg.isInternal || msg.senderType === 'agent'" class="w-3 h-3 text-blue-500" />
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>


        <!-- AI Assistant Action Bar -->
        <div v-if="selectedTicket" class="px-4 py-2 bg-gradient-to-r from-purple-50/70 to-indigo-50/70 border-t border-purple-100 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <button 
              @click="generateAiSummary" 
              type="button" 
              :disabled="isGeneratingSummary"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold transition-all shadow-2xs disabled:opacity-50"
            >
              <Loader2Icon v-if="isGeneratingSummary" class="w-3.5 h-3.5 animate-spin text-purple-600" />
              <SparklesIcon v-else class="w-3.5 h-3.5 text-purple-600" />
              <span>Resumo IA</span>
            </button>

            <button 
              @click="generateAiSuggestion" 
              type="button" 
              :disabled="isGeneratingSuggestion"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-all shadow-2xs disabled:opacity-50"
            >
              <Loader2Icon v-if="isGeneratingSuggestion" class="w-3.5 h-3.5 animate-spin text-blue-600" />
              <SparklesIcon v-else class="w-3.5 h-3.5 text-blue-600" />
              <span>Sugerir Resposta IA</span>
            </button>
          </div>

          <span v-if="selectedTicket" class="text-[11px] text-purple-800/80 font-medium">Assistente DeskFlow AI</span>
        </div>

        <!-- AI Summary Floating Card (if active) -->
        <div v-if="aiSummary" class="mx-4 my-2 p-3.5 bg-white border border-purple-200 rounded-xl shadow-sm animate-in fade-in zoom-in-95 duration-150">
          <div class="flex items-center justify-between mb-1.5">
            <div class="flex items-center gap-1.5 text-purple-900 font-bold text-xs">
              <SparklesIcon class="w-3.5 h-3.5 text-purple-600" />
              <span>Resumo da Conversa</span>
            </div>
            <button @click="aiSummary = ''" class="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
              <XIcon class="w-3.5 h-3.5" />
            </button>
          </div>
          <div class="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
            {{ aiSummary }}
          </div>
        </div>

        <!-- Chat Input -->
        <div class="p-4 bg-gray-50 border-t border-gray-200">
          
          <!-- File Preview -->
          <div v-if="selectedFile" class="mb-3 flex items-center p-2 bg-white rounded-lg border border-gray-200 shadow-sm inline-block max-w-[200px] relative group">
            <button @click="removeFile" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
              <XIcon class="w-3 h-3" />
            </button>
            <img v-if="previewUrl && selectedFile.type.startsWith('image/')" :src="previewUrl" class="w-12 h-12 object-cover rounded-md mr-3 border border-gray-100" />
            <video v-else-if="previewUrl && selectedFile.type.startsWith('video/')" :src="previewUrl" class="w-12 h-12 object-cover rounded-md mr-3 border border-gray-100"></video>
            <div v-else class="w-12 h-12 bg-gray-100 rounded-md mr-3 flex items-center justify-center flex-shrink-0">
              <FileIcon class="w-6 h-6 text-gray-400" />
            </div>
            <div class="truncate text-xs text-gray-700 font-medium flex-1 pr-2">
              {{ selectedFile.name }}
            </div>
          </div>

          <div class="flex items-end bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-df-primary focus-within:border-transparent transition-all relative">
            
            <!-- Recording UI Overlay -->
            <div v-if="isRecording" class="absolute inset-0 bg-red-50 flex items-center justify-between px-4 z-10">
              <div class="flex items-center text-red-500 animate-pulse">
                <MicIcon class="w-5 h-5 mr-2" />
                <span class="font-medium font-mono">{{ formatRecordingTime(recordingTime) }}</span>
              </div>
              <div class="flex items-center space-x-2">
                <button @click="cancelRecording" class="p-2 text-gray-500 hover:text-red-500 transition-colors text-sm font-medium">
                  Cancelar
                </button>
                <button @click="stopRecording" class="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm">
                  <SquareIcon class="w-4 h-4" />
                </button>
              </div>
            </div>


            <button 
              @click="triggerFileInput"
              class="p-3 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              title="Anexar arquivo"
              :class="{ 'invisible': isRecording }"
            >
              <PaperclipIcon class="w-5 h-5" />
            </button>
            <input type="file" class="hidden" ref="fileInputRef" @change="handleFileSelect" accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
            
            <textarea 
              v-model="newMessage"
              @keydown.enter.prevent="sendMessage"
              placeholder="Digite uma mensagem..." 
              class="flex-1 max-h-32 p-3 bg-transparent border-none outline-none resize-none text-sm placeholder-gray-400"
              rows="1"
              @input="adjustTextareaHeight"
              ref="textareaRef"
              :class="{ 'invisible': isRecording }"
            ></textarea>

            <!-- Send or Mic Button -->
            <button 
              v-if="!newMessage.trim() && !selectedFile"
              @click="startRecording"
              class="p-3 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
              title="Gravar áudio"
              :class="{ 'invisible': isRecording }"
            >
              <MicIcon class="w-5 h-5" />
            </button>
            <button 
              v-else
              @click="sendMessage"
              :disabled="isSending"
              class="p-3 text-df-primary hover:text-df-primary-hover disabled:opacity-50 transition-colors flex-shrink-0"
              :class="{ 'invisible': isRecording }"
            >
              <SendIcon class="w-5 h-5" v-if="!isSending" />
              <Loader2Icon class="w-5 h-5 animate-spin" v-else />
            </button>
          </div>
          <p class="text-[10px] text-gray-400 mt-2 text-center">Pressione Enter para enviar. Shift + Enter para quebrar linha.</p>
        </div>
      </template>
    </div>

    <!-- Right Panel: Ticket Info Sidebar (Collapsible) -->
    <div v-if="showInfoSidebar && selectedTicket" class="w-[350px] flex-shrink-0 border-l border-gray-200 bg-white flex flex-col h-full shadow-lg relative z-20">
      <div class="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <h3 class="font-semibold text-gray-800">Informações do Chamado</h3>
        <button @click="toggleInfoSidebar" class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="p-5 overflow-y-auto flex-1">
        <div class="mb-6">
          <p class="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Cliente</p>
          <p class="text-gray-900 font-medium">
            {{ selectedTicket.customer ? `${selectedTicket.customer.firstname} ${selectedTicket.customer.lastname}` : 'Cliente' }}
          </p>
          <p class="text-sm text-gray-500 mt-1">Via WhatsApp</p>
        </div>

        <div class="mb-6">
          <p class="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Assunto / Resumo</p>
          <p class="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100">
            {{ selectedTicket.title || 'Sem assunto' }}
          </p>
        </div>

        <div class="mb-6">
          <p class="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Status Atual</p>
          <div class="flex items-center space-x-2">
            <select 
              v-model="selectedTicket.state_id" 
              @change="changeStatus(selectedTicket.state_id)"
              class="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-df-primary focus:ring focus:ring-df-primary focus:ring-opacity-50"
              :disabled="isChangingStatus"
            >
              <option v-for="tab in tabs" :key="tab.id" :value="tab.id">
                {{ tab.label }}
              </option>
            </select>
            <Loader2Icon v-if="isChangingStatus" class="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        </div>
        
        <div class="mb-6">
          <p class="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Atribuído para (Agente)</p>
          <div class="flex items-center space-x-2">
            <select 
              v-model="selectedTicket.owner_id"
              @change="assignTicket(selectedTicket.owner_id)"
              class="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-df-primary focus:ring focus:ring-df-primary focus:ring-opacity-50"
              :disabled="isAssigning"
            >
              <option :value="null">Não atribuído (Fila)</option>
              <option v-for="agent in agents" :key="agent.id" :value="agent.id">
                {{ agent.firstname }} {{ agent.lastname }}
              </option>
            </select>
            <Loader2Icon v-if="isAssigning" class="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        </div>

        <div class="mb-6">
          <p class="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Criado em</p>
          <p class="text-sm text-gray-800">
            {{ new Date(selectedTicket.created_at).toLocaleString('pt-BR') }}
          </p>
        </div>

        <!-- Hierarquia -->
        <div class="pt-4 border-t border-gray-100">
          <h3 class="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wider">Hierarquia</h3>
          <div class="space-y-3">
            <div v-if="selectedTicket.parent">
              <span class="block text-xs font-medium text-gray-500">Processo Principal Pai</span>
              <span class="block text-sm text-df-primary font-medium cursor-pointer">#{{ selectedTicket.parent.id }} - {{ selectedTicket.parent.title }}</span>
            </div>
            <div v-if="selectedTicket.sub_tickets && selectedTicket.sub_tickets.length > 0">
              <span class="block text-xs font-medium text-gray-500">Subprocessos Ativos</span>
              <ul class="mt-1 space-y-1">
                <li v-for="sub in selectedTicket.sub_tickets" :key="sub.id" class="text-sm text-df-primary font-medium cursor-pointer">
                  #{{ sub.id }} - {{ sub.title }}
                </li>
              </ul>
            </div>
            <div v-if="ticketLinks && ticketLinks.length > 0">
              <span class="block text-xs font-medium text-gray-500 mt-2">Chamados Vinculados</span>
              <ul class="mt-1 space-y-1">
                <li v-for="link in ticketLinks" :key="link.id" class="text-sm text-df-primary font-medium cursor-pointer">
                  <span v-if="link.source_ticket_id === selectedTicket.id">#{{ link.target_ticket_id }} - {{ link.target_ticket.title }}</span>
                  <span v-else>#{{ link.source_ticket_id }} - {{ link.source_ticket.title }}</span>
                </li>
              </ul>
            </div>
            <div v-if="(!selectedTicket.sub_tickets || selectedTicket.sub_tickets.length === 0) && (!ticketLinks || ticketLinks.length === 0) && !selectedTicket.parent">
              <span class="block text-xs italic text-gray-400">Nenhum vínculo ou subprocesso</span>
            </div>
          </div>
        </div>
        
        <!-- Action to open full ticket -->
        <button @click="goToTicketDetail" class="w-full mt-4 flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
          <ExternalLinkIcon class="w-4 h-4 mr-2 text-gray-400" />
          Abrir chamado completo
        </button>
      </div>
    </div>
    <!-- Modais Customizados -->
    <!-- Modal: Alterar Assunto -->
    <div v-if="showSubjectModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Alterar Assunto</h3>
        <input 
          type="text" 
          v-model="newSubject" 
          class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-df-primary focus:border-transparent mb-6"
          placeholder="Digite o novo assunto"
          @keyup.enter="confirmSubjectChange"
        />
        <div class="flex justify-end space-x-3">
          <button @click="showSubjectModal = false" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
            Cancelar
          </button>
          <button @click="confirmSubjectChange" class="px-4 py-2 text-sm font-medium text-white bg-df-primary hover:bg-df-primary-hover rounded-md transition-colors" :disabled="isChangingSubject">
            <span v-if="!isChangingSubject">Salvar</span>
            <Loader2Icon v-else class="w-4 h-4 animate-spin" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Mesclar Chamado -->
    <div v-if="showMergeModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-2">Mesclar Chamado</h3>
        <p class="text-sm text-gray-500 mb-4">
          Digite o Número/ID do chamado de <strong>destino</strong>. As mensagens deste chamado atual ({{ selectedTicket?.id }}) serão transferidas para lá e este será finalizado.
        </p>
        <input 
          type="number" 
          v-model="mergeTargetId" 
          class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-df-primary focus:border-transparent mb-6"
          placeholder="Ex: 15"
          @keyup.enter="confirmMerge"
        />
        <div class="flex justify-end space-x-3">
          <button @click="showMergeModal = false" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
            Cancelar
          </button>
          <button @click="confirmMerge" class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors" :disabled="isMerging">
            <span v-if="!isMerging">Mesclar e Finalizar</span>
            <Loader2Icon v-else class="w-4 h-4 animate-spin" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Vincular Chamado -->
    <div v-if="showLinkModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-2">Vincular Chamado</h3>
        <p class="text-sm text-gray-500 mb-4">
          Digite o Número/ID do chamado que você quer vincular a este ({{ selectedTicket?.id }}).
        </p>
        <input 
          type="number" 
          v-model="linkTargetId" 
          class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-df-primary focus:border-transparent mb-6"
          placeholder="Ex: 22"
          @keyup.enter="confirmLink"
        />
        <div class="flex justify-end space-x-3">
          <button @click="showLinkModal = false" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
            Cancelar
          </button>
          <button @click="confirmLink" class="px-4 py-2 text-sm font-medium text-white bg-df-primary hover:bg-df-primary-hover rounded-md transition-colors" :disabled="isLinking">
            <span v-if="!isLinking">Vincular</span>
            <Loader2Icon v-else class="w-4 h-4 animate-spin" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Subprocesso -->
    <div v-if="showSubticketModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Criar Subprocesso</h3>
        <input 
          type="text" 
          v-model="subticketTitle" 
          class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-df-primary focus:border-transparent mb-6"
          placeholder="Título do novo subprocesso"
          @keyup.enter="confirmSubticket"
        />
        <div class="flex justify-end space-x-3">
          <button @click="showSubticketModal = false" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
            Cancelar
          </button>
          <button @click="confirmSubticket" class="px-4 py-2 text-sm font-medium text-white bg-df-primary hover:bg-df-primary-hover rounded-md transition-colors" :disabled="isCreatingSubticket">
            <span v-if="!isCreatingSubticket">Criar</span>
            <Loader2Icon v-else class="w-4 h-4 animate-spin" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Transferir Setor -->
    <div v-if="showTransferModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-2">Transferir Setor</h3>
        <p class="text-sm text-gray-500 mb-4">
          Escolha o grupo de destino e adicione o motivo da transferência.
        </p>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Grupo de Destino *</label>
          <select v-model="transferGroupId" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-df-primary focus:border-transparent">
            <option disabled value="">Selecione um grupo</option>
            <option v-for="group in availableGroups" :key="group.id" :value="group.id">{{ group.name }}</option>
          </select>
        </div>

        <div class="mb-4" v-if="transferGroupId">
          <label class="block text-sm font-medium text-gray-700 mb-1">Atendente (Opcional)</label>
          <select v-model="transferOwnerId" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-df-primary focus:border-transparent">
            <option value="">Fila Geral (Nenhum)</option>
            <option v-for="user in filteredUsersForGroup" :key="user.id" :value="user.id">{{ user.firstname }} {{ user.lastname }}</option>
          </select>
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-1">Motivo (Nota Interna) *</label>
          <textarea 
            v-model="transferNote" 
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-df-primary focus:border-transparent resize-none"
            rows="3"
            placeholder="Descreva o motivo desta transferência..."
          ></textarea>
        </div>

        <div class="flex justify-end space-x-3">
          <button @click="showTransferModal = false" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
            Cancelar
          </button>
          <button @click="confirmTransfer" class="px-4 py-2 text-sm font-medium text-white bg-df-primary hover:bg-df-primary-hover rounded-md transition-colors" :disabled="isTransferring || !transferGroupId || !transferNote.trim()">
            <span v-if="!isTransferring">Transferir</span>
            <Loader2Icon v-else class="w-4 h-4 animate-spin" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Simular Mensagem WhatsApp -->
    <div v-if="showSimulateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-xs">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">
              WA
            </div>
            <div>
              <h3 class="text-base font-bold text-gray-900 leading-tight">Simulador de WhatsApp</h3>
              <p class="text-xs text-gray-500">Envie uma mensagem fictícia para testar o fluxo</p>
            </div>
          </div>
          <button @click="showSimulateModal = false" class="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-4 my-4">
          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Nome do Cliente</label>
            <input 
              v-model="simName" 
              type="text" 
              placeholder="Ex: Carlos Eduardo" 
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Número de Telefone</label>
            <input 
              v-model="simPhone" 
              type="text" 
              placeholder="5511999998888" 
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-mono"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 mb-1">Mensagem Inicial</label>
            <textarea 
              v-model="simMessage" 
              rows="3"
              placeholder="Digite a mensagem do cliente..." 
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
            ></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-2.5 pt-2 border-t border-gray-100">
          <button 
            @click="showSimulateModal = false" 
            class="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button 
            @click="simulateWhatsAppMessage" 
            :disabled="isSimulating || !simMessage.trim()" 
            class="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
          >
            <Loader2Icon v-if="isSimulating" class="w-4 h-4 animate-spin" />
            <span>{{ isSimulating ? 'Processando...' : 'Enviar Simulação' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search as SearchIcon, MessageCircle as MessageCircleIcon, Send as SendIcon, Loader2 as Loader2Icon, ExternalLink as ExternalLinkIcon, CheckCheck as CheckCheckIcon, Zap as ZapIcon, Info as InfoIcon, File as FileIcon, Paperclip as PaperclipIcon, X as XIcon, Mic as MicIcon, Square as SquareIcon } from 'lucide-vue-next'
import api from '@/services/api'
import { iamService } from '@/services/iamService'
import { socketService } from '@/services/socketService'
import { useToast } from '@/composables/useToast'

const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') : 'http://localhost:3000'


const router = useRouter()
const { success: toastSuccess, error: toastError } = useToast()

const aiSummary = ref('')
const isGeneratingSummary = ref(false)
const isGeneratingSuggestion = ref(false)

const generateAiSummary = async () => {
  if (!selectedTicket.value) return
  isGeneratingSummary.value = true
  try {
    const res = await api.post(`/ai/tickets/${selectedTicket.value.id}/summarize`)
    aiSummary.value = res.data.summary
  } catch (err) {
    toastError('Erro', 'Não foi possível gerar o resumo com IA.')
  } finally {
    isGeneratingSummary.value = false
  }
}

const generateAiSuggestion = async () => {
  if (!selectedTicket.value) return
  isGeneratingSuggestion.value = true
  try {
    const res = await api.post(`/ai/tickets/${selectedTicket.value.id}/suggest-reply`)
    newMessage.value = res.data.suggestion
  } catch (err) {
    toastError('Erro', 'Não foi possível sugerir resposta com IA.')
  } finally {
    isGeneratingSuggestion.value = false
  }
}


const tabs = [
  { id: 1, label: 'Triagem' },
  { id: 2, label: 'Aberto' },
  { id: 3, label: 'Em Atendimento' },
  { id: 4, label: 'Pendente' },
  { id: 'presencial', label: 'Presencial' },
  { id: 6, label: 'Dúvida' },
  { id: 5, label: 'Resolvido' },
]

const agents = ref<any[]>([])
const isChangingStatus = ref(false)
const isAssigning = ref(false)
const showActionsMenu = ref(false)

const fetchAgents = async () => {
  try {
    const res = await api.get('/iam/users')
    agents.value = res.data
  } catch (err) {
    console.error('Erro ao buscar agentes:', err)
  }
}

// Modal States
const showSubjectModal = ref(false)
const newSubject = ref('')
const isChangingSubject = ref(false)

const showMergeModal = ref(false)
const mergeTargetId = ref('')
const isMerging = ref(false)

const showLinkModal = ref(false)
const linkTargetId = ref('')
const isLinking = ref(false)

// Simulator state
const showSimulateModal = ref(false)
const simName = ref('Carlos Cliente')
const simPhone = ref('5511988887777')
const simMessage = ref('Olá! Gostaria de consultar o andamento da minha solicitação.')
const isSimulating = ref(false)

const simulateWhatsAppMessage = async () => {
  if (!simMessage.value.trim()) return
  isSimulating.value = true
  try {
    await api.post('/whatsapp/simulate', {
      from: simPhone.value.trim() || '5511988887777',
      name: simName.value.trim() || 'Cliente WhatsApp',
      text: simMessage.value.trim()
    })
    toastSuccess('Sucesso', 'Mensagem de WhatsApp simulada com sucesso!')
    showSimulateModal.value = false
    simMessage.value = ''
    await fetchTickets()
    activeTab.value = 1 // Muda para aba Triagem onde novos chamados entram
  } catch (error) {
    toastError('Erro', 'Falha ao simular mensagem de WhatsApp.')
  } finally {
    isSimulating.value = false
  }
}

const ticketLinks = ref<any[]>([])

const showSubticketModal = ref(false)
const subticketTitle = ref('')
const isCreatingSubticket = ref(false)

const showTransferModal = ref(false)
const transferGroupId = ref<number | ''>('')
const transferOwnerId = ref<number | ''>('')
const transferNote = ref('')
const isTransferring = ref(false)
const availableGroups = ref<any[]>([])
const allUsers = ref<any[]>([])

const filteredUsersForGroup = computed(() => {
  if (!transferGroupId.value) return []
  return allUsers.value.filter(u => u.groups?.some((g: any) => g.id === transferGroupId.value))
})

const activeTab = ref<number | string>(2) // Default Aberto
const searchQuery = ref('')
const tickets = ref<any[]>([])
const isLoadingTickets = ref(true)
const selectedTicket = ref<any>(null)
const messages = ref<any[]>([])
const isLoadingMessages = ref(false)
const newMessage = ref('')
const isSending = ref(false)
const showInfoSidebar = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)

// Audio recording state
const isRecording = ref(false)
const recordingTime = ref(0)
const recordingInterval = ref<any>(null)
let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []

// Current logged user
const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

const fetchTickets = async () => {
  isLoadingTickets.value = true
  try {
    const response = await api.get('/tickets')
    // Filter only whatsapp tickets
    tickets.value = response.data.filter((t: any) => t.source === 'whatsapp')
  } catch (err) {
    toastError('Erro', 'Não foi possível carregar as conversas.')
  } finally {
    isLoadingTickets.value = false
  }
}

const filteredTickets = computed(() => {
  let filtered = tickets.value
  const presencialGroup = availableGroups.value.find(g => g.name.toLowerCase().includes('presencial'))

  if (activeTab.value === 'presencial') {
    if (presencialGroup) {
      filtered = filtered.filter(t => t.group_id === presencialGroup.id)
    } else {
      filtered = []
    }
  } else {
    // Se estiver em outra aba, não exibe os presenciais
    if (presencialGroup) {
      filtered = filtered.filter(t => t.state_id === activeTab.value && t.group_id !== presencialGroup.id)
    } else {
      filtered = filtered.filter(t => t.state_id === activeTab.value)
    }
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    filtered = filtered.filter(t => 
      t.title?.toLowerCase().includes(q) || 
      (t.customer?.firstname + ' ' + t.customer?.lastname).toLowerCase().includes(q)
    )
  }
  return filtered
})

const getTicketCount = (stateId: any) => {
  const presencialGroup = availableGroups.value.find(g => g.name.toLowerCase().includes('presencial'))
  
  if (stateId === 'presencial') {
    if (!presencialGroup) return 0
    return tickets.value.filter(t => t.group_id === presencialGroup.id).length
  }
  
  if (presencialGroup) {
    return tickets.value.filter(t => t.state_id === stateId && t.group_id !== presencialGroup.id).length
  }
  return tickets.value.filter(t => t.state_id === stateId).length
}

const quickAction = async (action: string) => {
  showActionsMenu.value = false
  if (action === 'alterar_assunto') {
    newSubject.value = selectedTicket.value?.title || ''
    showSubjectModal.value = true
  } else if (action === 'mesclar') {
    mergeTargetId.value = ''
    showMergeModal.value = true
  } else if (action === 'vincular') {
    linkTargetId.value = ''
    showLinkModal.value = true
  } else if (action === 'subprocesso') {
    subticketTitle.value = `[Subprocesso] ${selectedTicket.value?.title || ''}`
    showSubticketModal.value = true
  } else if (action === 'transferir') {
    transferGroupId.value = ''
    transferOwnerId.value = ''
    transferNote.value = ''
    showTransferModal.value = true
    
    // Fetch groups and users if empty
    if (availableGroups.value.length === 0) {
      iamService.getGroups().then(g => availableGroups.value = g).catch(console.error)
    }
    if (allUsers.value.length === 0) {
      iamService.getUsers().then(u => allUsers.value = u).catch(console.error)
    }
  }
}

const confirmSubjectChange = async () => {
  if (!selectedTicket.value || !newSubject.value.trim() || newSubject.value === selectedTicket.value.title) {
    showSubjectModal.value = false
    return
  }
  isChangingSubject.value = true
  try {
    await api.patch(`/tickets/${selectedTicket.value.id}/title`, { title: newSubject.value.trim() })
    selectedTicket.value.title = newSubject.value.trim()
    const tIndex = tickets.value.findIndex(t => t.id === selectedTicket.value!.id)
    if (tIndex > -1) {
      tickets.value[tIndex].title = newSubject.value.trim()
    }
    toastSuccess('Sucesso', 'Assunto alterado com sucesso.')
    showSubjectModal.value = false
  } catch (err) {
    toastError('Erro', 'Falha ao alterar o assunto.')
  } finally {
    isChangingSubject.value = false
  }
}

const confirmMerge = async () => {
  const targetId = parseInt(mergeTargetId.value, 10)
  if (!selectedTicket.value || isNaN(targetId) || targetId === selectedTicket.value.id) {
    toastError('Erro', 'ID de destino inválido.')
    return
  }
  
  isMerging.value = true
  try {
    await api.post(`/tickets/${selectedTicket.value.id}/merge`, { target_ticket_id: targetId })
    toastSuccess('Sucesso', 'Chamado mesclado com sucesso!')
    
    // Remove local
    const tIndex = tickets.value.findIndex(t => t.id === selectedTicket.value!.id)
    if (tIndex > -1) {
      tickets.value.splice(tIndex, 1)
    }
    selectedTicket.value = null
    showMergeModal.value = false
  } catch (err) {
    toastError('Erro', 'Falha ao mesclar o chamado. Verifique se o ID destino existe.')
  } finally {
    isMerging.value = false
  }
}

const confirmLink = async () => {
  const targetId = parseInt(linkTargetId.value, 10)
  if (!selectedTicket.value || isNaN(targetId) || targetId === selectedTicket.value.id) {
    toastError('Erro', 'ID de destino inválido.')
    return
  }
  
  isLinking.value = true
  try {
    const res = await api.post(`/tickets/${selectedTicket.value.id}/links`, { target_ticket_id: targetId })
    toastSuccess('Sucesso', 'Chamado vinculado com sucesso!')
    ticketLinks.value.push(res.data) // Atualiza tela
    showLinkModal.value = false
  } catch (err) {
    toastError('Erro', 'Falha ao vincular o chamado. Verifique se o ID destino existe.')
  } finally {
    isLinking.value = false
  }
}

const confirmSubticket = async () => {
  if (!selectedTicket.value || !subticketTitle.value.trim()) {
    toastError('Erro', 'Título do subprocesso não pode ser vazio.')
    return
  }
  
  isCreatingSubticket.value = true
  try {
    const res = await api.post(`/tickets/${selectedTicket.value.id}/subtickets`, { title: subticketTitle.value.trim() })
    toastSuccess('Sucesso', 'Subprocesso criado com sucesso!')
    if (!selectedTicket.value.sub_tickets) {
      selectedTicket.value.sub_tickets = []
    }
    selectedTicket.value.sub_tickets.push(res.data)
    
    // Insere o novo subprocesso na lista local se corresponder ao filtro ativo
    if (activeTab.value === 2) { // "Aberto" é 2 por padrão
      tickets.value.unshift(res.data)
    }

    showSubticketModal.value = false
  } catch (err) {
    toastError('Erro', 'Falha ao criar o subprocesso.')
  } finally {
    isCreatingSubticket.value = false
  }
}

const confirmTransfer = async () => {
  if (!selectedTicket.value || !transferGroupId.value || !transferNote.value.trim()) {
    toastError('Erro', 'Grupo de destino e motivo são obrigatórios.')
    return
  }
  
  isTransferring.value = true
  try {
    await api.post(`/tickets/${selectedTicket.value.id}/transfer`, {
      group_id: transferGroupId.value,
      owner_id: transferOwnerId.value || undefined,
      note: transferNote.value.trim()
    })
    toastSuccess('Sucesso', 'Chamado transferido com sucesso!')
    
    // Atualiza localmente o ticket ao invés de apagá-lo,
    // assim ele apenas vai para a aba correta se mudar o grupo.
    const tIndex = tickets.value.findIndex(t => t.id === selectedTicket.value!.id)
    if (tIndex > -1) {
      tickets.value[tIndex].group_id = transferGroupId.value
      tickets.value[tIndex].owner_id = transferOwnerId.value || null
    }
    selectedTicket.value = null
    showTransferModal.value = false
  } catch (err) {
    toastError('Erro', 'Falha ao transferir o chamado.')
  } finally {
    isTransferring.value = false
  }
}

const fetchLinks = async (ticketId: number) => {
  try {
    const res = await api.get(`/tickets/${ticketId}/links`)
    ticketLinks.value = res.data
  } catch (err) {
    console.error('Falha ao buscar links', err)
  }
}

const selectTicket = async (ticket: any) => {
  selectedTicket.value = ticket
  ticket.unread = false // mark as read locally
  ticketLinks.value = [] // Limpa o estado
  
  await loadMessages(ticket.id)
  await fetchLinks(ticket.id)
}

const loadMessages = async (ticketId: number) => {
  isLoadingMessages.value = true
  try {
    const res = await api.get(`/tickets/${ticketId}`)
    const fullTicket = res.data
    selectedTicket.value = fullTicket // Atualiza com dados completos (customer, sub_tickets, parent, etc)
    
    // Map articles to chat messages
    messages.value = fullTicket.articles.map((art: any) => {
      // Determine if sender is agent or customer based on who created it
      // For MVP, we assume if it's created by ticket customer, it's incoming.
      const isAgent = art.created_by?.roles?.includes('admin') || art.created_by?.roles?.includes('agent')
      return {
        id: art.id,
        body: art.body,
        created_at: art.created_at,
        isInternal: art.is_internal,
        senderType: isAgent ? 'agent' : 'customer',
        isSystem: art.type === 'system',
        attachments: art.attachments || []
      }
    })
    
    nextTick(() => {
      scrollToBottom()
    })
    fetchAgents()
  } catch (err) {
    toastError('Erro', 'Não foi possível carregar as mensagens.')
  } finally {
    isLoadingMessages.value = false
  }
}

const formatTime = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const formatMessage = (text: string) => {
  if (!text) return ''
  // Basic markdown to HTML conversion for bold, italic, line breaks
  return text
    .replace(/\n/g, '<br>')
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
}

const adjustTextareaHeight = () => {
  const el = textareaRef.value
  if (el) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    if (!file) return
    selectedFile.value = file
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      previewUrl.value = URL.createObjectURL(file)
    } else {
      previewUrl.value = null
    }
  }
}

const removeFile = () => {
  selectedFile.value = null
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const formatRecordingTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream)
    audioChunks = []
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data)
    }
    
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
      const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, { type: 'audio/webm' })
      selectedFile.value = audioFile as any
      previewUrl.value = URL.createObjectURL(audioBlob)
      
      // Stop all tracks to release microphone
      stream.getTracks().forEach(track => track.stop())
    }
    
    mediaRecorder.start()
    isRecording.value = true
    recordingTime.value = 0
    recordingInterval.value = setInterval(() => {
      recordingTime.value++
    }, 1000)
    
  } catch (err) {
    toastError('Erro', 'Não foi possível acessar o microfone.')
  }
}

const stopRecording = () => {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
    isRecording.value = false
    clearInterval(recordingInterval.value)
  }
}

const cancelRecording = () => {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
    setTimeout(() => {
      removeFile()
    }, 50)
    isRecording.value = false
    clearInterval(recordingInterval.value)
  }
}

const sendMessage = async () => {
  if ((!newMessage.value.trim() && !selectedFile.value) || !selectedTicket.value) return
  
  isSending.value = true
  try {
    const formData = new FormData()
    formData.append('body', newMessage.value.trim() || '[Mídia enviada]')
    formData.append('type', 'note')
    formData.append('is_internal', 'false')
    
    if (selectedFile.value) {
      formData.append('file', selectedFile.value)
    }

    const res = await api.post(`/tickets/${selectedTicket.value.id}/articles`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    // Add to local list optimistically
    messages.value.push({
      id: res.data.id || Date.now(),
      body: newMessage.value.trim(),
      created_at: new Date().toISOString(),
      isInternal: false,
      senderType: 'agent',
      isSystem: false,
      attachments: res.data.attachments || []
    })
    
    newMessage.value = ''
    removeFile()
    if (textareaRef.value) textareaRef.value.style.height = 'auto'
    scrollToBottom()
    
    // Move ticket to top of list and update its updated_at
    selectedTicket.value.updated_at = new Date().toISOString()
    const tIndex = tickets.value.findIndex(t => t.id === selectedTicket.value.id)
    if (tIndex > -1) {
      const t = tickets.value.splice(tIndex, 1)[0]
      tickets.value.unshift(t)
    }
    
  } catch (err) {
    toastError('Erro', 'Falha ao enviar mensagem.')
  } finally {
    isSending.value = false
  }
}

const changeStatus = async (statusId: number) => {
  if (!selectedTicket.value) return
  isChangingStatus.value = true
  try {
    await api.patch(`/tickets/${selectedTicket.value.id}/state`, { state_id: statusId })
    // Local Update
    const tIndex = tickets.value.findIndex(t => t.id === selectedTicket.value!.id)
    if (tIndex > -1) {
      tickets.value[tIndex].state_id = statusId
    }
    toastSuccess('Sucesso', 'Status atualizado.')
    
    // Deselect if it moved out of current tab
    if (statusId !== activeTab.value) {
      selectedTicket.value = null
    }
  } catch (err) {
    toastError('Erro', 'Falha ao mudar status.')
  } finally {
    isChangingStatus.value = false
  }
}

const assignTicket = async (ownerId: number | null) => {
  if (!selectedTicket.value) return
  isAssigning.value = true
  try {
    await api.patch(`/tickets/${selectedTicket.value.id}/assign`, { owner_id: ownerId })
    const tIndex = tickets.value.findIndex(t => t.id === selectedTicket.value!.id)
    if (tIndex > -1) {
      tickets.value[tIndex].owner_id = ownerId
    }
    toastSuccess('Sucesso', 'Chamado transferido.')
  } catch (err) {
    toastError('Erro', 'Falha ao transferir chamado.')
  } finally {
    isAssigning.value = false
  }
}

const toggleInfoSidebar = () => {
  showInfoSidebar.value = !showInfoSidebar.value
}

const goToTicketDetail = () => {
  if (selectedTicket.value) {
    router.push(`/tickets/${selectedTicket.value.id}`)
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const openImage = (url: string) => {
  window.open(url, '_blank')
}

// Socket listening for new messages
const handleSocketMessage = (data: any) => {
  if (data.ticket.source !== 'whatsapp') return
  
  // se for do ticket selecionado, atualiza o chat
  if (selectedTicket.value && data.ticket.id === selectedTicket.value.id) {
    // Add new article to messages list if it's not from us
    if (data.article && data.article.created_by?.id !== currentUser.id) {
      const isAgent = data.article.created_by?.roles?.includes('admin') || data.article.created_by?.roles?.includes('agent')
      messages.value.push({
        id: data.article.id,
        body: data.article.body,
        created_at: data.article.created_at,
        isInternal: data.article.is_internal,
        senderType: isAgent ? 'agent' : 'customer',
        isSystem: data.article.type === 'system',
        attachments: data.article.attachments || []
      })
      scrollToBottom()
    }
  }
  
  // Atualiza a lista na esquerda
  let existingTicket = tickets.value.find(t => t.id === data.ticket.id)
  if (existingTicket) {
    existingTicket.updated_at = new Date().toISOString()
    // Marca unread se não estivermos com ele aberto e a mensagem não for do agent
    if (!selectedTicket.value || selectedTicket.value.id !== existingTicket.id) {
       if (data.article && !data.article.created_by?.roles?.includes('admin')) {
         existingTicket.unread = true
       }
    }
    // Mover para o topo
    const tIndex = tickets.value.findIndex(t => t.id === data.ticket.id)
    if (tIndex > -1) {
      const t = tickets.value.splice(tIndex, 1)[0]
      tickets.value.unshift(t)
    }
  } else {
    // É um novo ticket, faz fetch de novo pra garantir
    fetchTickets()
  }
}

onMounted(() => {
  fetchTickets()
  
  const socket = socketService.getSocket()
  if (socket) {
    socket.on('ticket.updated', handleSocketMessage)
  }
})

onUnmounted(() => {
  const socket = socketService.getSocket()
  if (socket) {
    socket.off('ticket.updated', handleSocketMessage)
  }
})

// Focus textarea when a ticket is selected
watch(selectedTicket, (newVal) => {
  if (newVal) {
    nextTick(() => {
      textareaRef.value?.focus()
    })
  }
})
</script>
