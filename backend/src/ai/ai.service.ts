import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Article } from '../tickets/entities/article.entity';
import { SettingsService } from '../settings/services/settings.service';
import { KbPublicService } from '../kb/services/kb-public.service';
import axios from 'axios';

export interface AiConfig {
  provider: 'openai' | 'gemini' | 'deepseek' | 'claude' | 'groq' | 'ollama' | 'custom';
  apiKey: string;
  baseUrl: string;
  model: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    private readonly settingsService: SettingsService,
    private readonly kbPublicService: KbPublicService,
  ) {}

  /**
   * Obtém a configuração ativa de IA mesclando configurações salvas e fallbacks
   */
  async getAiConfig(overrides?: Partial<AiConfig>): Promise<AiConfig> {
    const [savedProvider, savedKey, legacyOpenAiKey, savedBaseUrl, savedModel] = await Promise.all([
      this.settingsService.getSetting('AI_PROVIDER', 'openai'),
      this.settingsService.getSetting('AI_API_KEY', ''),
      this.settingsService.getSetting('OPENAI_API_KEY', ''),
      this.settingsService.getSetting('AI_BASE_URL', ''),
      this.settingsService.getSetting('AI_MODEL', ''),
    ]);

    const provider = (overrides?.provider || savedProvider || 'openai').toLowerCase() as AiConfig['provider'];
    
    // Resolução de API Key com fallbacks de ambiente
    let apiKey = overrides?.apiKey ?? (savedKey || legacyOpenAiKey || process.env.AI_API_KEY || '');
    if (!apiKey) {
      if (provider === 'openai') apiKey = process.env.OPENAI_API_KEY || '';
      else if (provider === 'gemini') apiKey = process.env.GEMINI_API_KEY || '';
      else if (provider === 'deepseek') apiKey = process.env.DEEPSEEK_API_KEY || '';
      else if (provider === 'claude') apiKey = process.env.ANTHROPIC_API_KEY || '';
      else if (provider === 'groq') apiKey = process.env.GROQ_API_KEY || '';
    }

    // Resolução de Base URL padrão por provedor
    let defaultBaseUrl = 'https://api.openai.com/v1';
    let defaultModel = 'gpt-4o-mini';

    switch (provider) {
      case 'gemini':
        defaultBaseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai';
        defaultModel = 'gemini-2.0-flash';
        break;
      case 'deepseek':
        defaultBaseUrl = 'https://api.deepseek.com/v1';
        defaultModel = 'deepseek-chat';
        break;
      case 'claude':
        defaultBaseUrl = 'https://api.anthropic.com/v1';
        defaultModel = 'claude-3-5-sonnet-20241022';
        break;
      case 'groq':
        defaultBaseUrl = 'https://api.groq.com/openai/v1';
        defaultModel = 'llama-3.3-70b-versatile';
        break;
      case 'ollama':
        defaultBaseUrl = 'http://localhost:11434/v1';
        defaultModel = 'llama3.2';
        break;
      case 'custom':
        defaultBaseUrl = savedBaseUrl || 'https://api.openai.com/v1';
        defaultModel = savedModel || 'gpt-4o-mini';
        break;
      case 'openai':
      default:
        defaultBaseUrl = 'https://api.openai.com/v1';
        defaultModel = 'gpt-4o-mini';
        break;
    }

    const baseUrl = overrides?.baseUrl || savedBaseUrl || defaultBaseUrl;
    const model = overrides?.model || savedModel || defaultModel;

    return {
      provider,
      apiKey,
      baseUrl: baseUrl.replace(/\/+$/, ''),
      model,
    };
  }

  /**
   * Executa chamada para o LLM configurado (OpenAI, Gemini, DeepSeek, Claude, Groq, Ollama, Custom)
   */
  async callLLM(
    systemPrompt: string,
    userPrompt: string,
    temperature = 0.3,
    overrides?: Partial<AiConfig>,
  ): Promise<string> {
    const config = await this.getAiConfig(overrides);

    // Ollama local não requer API Key, outros provedores sim
    if (!config.apiKey && config.provider !== 'ollama') {
      throw new Error(`Chave de API não configurada para o provedor ${config.provider.toUpperCase()}`);
    }

    // Anthropic Claude Messages API
    if (config.provider === 'claude') {
      const url = `${config.baseUrl}/messages`;
      const response = await axios.post(
        url,
        {
          model: config.model,
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
          temperature,
        },
        {
          headers: {
            'x-api-key': config.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          timeout: 45000,
        },
      );

      return response.data.content?.[0]?.text || '';
    }

    // Protocolo compatível com OpenAI (OpenAI, Gemini OpenAI-endpoint, DeepSeek, Groq, Ollama, Custom)
    const url = `${config.baseUrl}/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    const response = await axios.post(
      url,
      {
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
      },
      {
        headers,
        timeout: 45000,
      },
    );

    return response.data.choices?.[0]?.message?.content || '';
  }

  /**
   * Testa a conexão com o provedor de IA informado
   */
  async testConnection(testConfig?: Partial<AiConfig>): Promise<{ success: boolean; message: string; reply?: string; model?: string; provider?: string }> {
    try {
      const config = await this.getAiConfig(testConfig);
      const testReply = await this.callLLM(
        'Você é o assistente de IA integrado ao DeskFlow.',
        'Responda em uma frase curta confirmando que a conexão com o DeskFlow foi realizada com sucesso.',
        0.2,
        config,
      );

      return {
        success: true,
        message: `Conexão bem-sucedida com ${config.provider.toUpperCase()} (${config.model})!`,
        reply: testReply.trim(),
        model: config.model,
        provider: config.provider,
      };
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || 'Falha ao conectar com o serviço de IA.';
      this.logger.error(`Falha no teste de conexão de IA: ${errorMsg}`, error?.stack);
      throw new BadRequestException(`Erro na conexão com IA: ${errorMsg}`);
    }
  }

  /**
   * Resume o histórico do chamado
   */
  async summarizeTicket(ticketId: number): Promise<{ summary: string; action_items: string[] }> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: { customer: true, owner: true, articles: true },
      order: { articles: { created_at: 'ASC' } },
    });

    if (!ticket) throw new NotFoundException('Ticket não encontrado');

    const conversationText = (ticket.articles || [])
      .map((a) => `[${a.created_at.toISOString().split('T')[0]}] ${a.is_internal ? '(Nota Interna)' : ''} ${a.body}`)
      .join('\n');

    try {
      const aiText = await this.callLLM(
        'Você é um assistente de suporte técnico sênior da DeskFlow. Analise o histórico do chamado e gere um resumo conciso com: 1. Problema Principal, 2. Ações Tomadas e 3. Próximo Passo Recomendado. Responda em Português do Brasil de forma estruturada com emojis nos tópicos.',
        `Título: ${ticket.title}\nCliente: ${ticket.customer?.firstname || 'Cliente'}\nHistórico:\n${conversationText}`,
        0.3,
      );

      if (aiText && aiText.trim()) {
        return {
          summary: aiText,
          action_items: ['Verificar resolução com o cliente', 'Atualizar status do chamado'],
        };
      }
    } catch (error) {
      this.logger.warn('Chamada de IA falhou ao gerar resumo, utilizando fallback heurístico', error);
    }

    const articlesCount = ticket.articles?.length || 0;
    const lastArticle = ticket.articles?.[articlesCount - 1]?.body || 'Sem mensagens recentes.';
    const summary = `📋 **Resumo do Chamado #${ticket.id}**:
- **Título:** ${ticket.title}
- **Total de Interações:** ${articlesCount} mensagem(ns)
- **Última Mensagem:** "${lastArticle.slice(0, 150)}..."
- **Status:** ${ticket.state_id === 5 ? 'Resolvido' : ticket.state_id === 1 ? 'Em Triagem' : 'Em Andamento'}`;

    return {
      summary,
      action_items: [
        'Analisar última solicitação do cliente',
        'Validar se a demanda foi atendida',
      ],
    };
  }

  /**
   * Sugere resposta rápida para o atendente
   */
  async suggestReply(ticketId: number): Promise<{ suggestion: string }> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: { customer: true, articles: true },
      order: { articles: { created_at: 'ASC' } },
    });

    if (!ticket) throw new NotFoundException('Ticket não encontrado');

    const customerName = ticket.customer?.firstname || 'Cliente';
    const lastMessage = ticket.articles?.[ticket.articles.length - 1]?.body || ticket.title;

    try {
      const suggestion = await this.callLLM(
        'Você é um atendente de suporte empático, claro e altamente profissional da plataforma DeskFlow. Escreva uma sugestão de resposta cordial e direta para o cliente, pronta para envio.',
        `Nome do cliente: ${customerName}\nAssunto: ${ticket.title}\nÚltima mensagem do cliente: "${lastMessage}"`,
        0.5,
      );

      if (suggestion && suggestion.trim()) {
        return { suggestion: suggestion.trim() };
      }
    } catch (err) {
      this.logger.warn('Chamada de IA falhou ao gerar sugestão de resposta, utilizando fallback', err);
    }

    return {
      suggestion: `Olá ${customerName}, tudo bem?\n\nObrigado por nos contatar! Recebemos sua mensagem a respeito de "${ticket.title}" e já estamos verificando os detalhes para te atender da melhor forma.\n\nQualquer dúvida adicional, estamos à disposição!`,
    };
  }

  /**
   * Triagem automática de mensagens do WhatsApp
   */
  async triageWhatsAppMessage(fromPhone: string, customerName: string, text: string): Promise<{ shouldTransferToHuman: boolean; replyText: string }> {
    const lowerText = text.toLowerCase();
    if (
      lowerText.includes('humano') ||
      lowerText.includes('atendente') ||
      lowerText.includes('suporte') ||
      lowerText.includes('pessoa') ||
      lowerText.includes('falar com alguem')
    ) {
      return {
        shouldTransferToHuman: true,
        replyText: `Entendido, ${customerName}! Estou transferindo você agora para um de nossos atendentes humanos. Por favor, aguarde um momento.`,
      };
    }

    const kbResults = await this.kbPublicService.searchArticles(text);
    if (kbResults && kbResults.length > 0) {
      const topArticle = kbResults[0];
      const reply = `Olá ${customerName}! 🤖 Sou o assistente virtual do DeskFlow.\n\nEncontrei uma informação que pode te ajudar:\n\n📋 *${topArticle.title}*\n${topArticle.content.slice(0, 300)}...\n\n💡 Se isso não resolver, digite *"falar com atendente"* para transferirmos para nossa equipe!`;
      return {
        shouldTransferToHuman: false,
        replyText: reply,
      };
    }

    // Tentar resposta contextualizada via IA se o bot estiver ativo
    const botEnabled = await this.settingsService.getSetting('AI_BOT_ENABLED', 'true');
    if (botEnabled === 'true') {
      try {
        const aiResponse = await this.callLLM(
          'Você é o assistente virtual de triagem do DeskFlow no WhatsApp. Responda ao cliente de forma muito concisa (máximo 2 a 3 frases), acolhedora e prestativa em Português do Brasil. Se for algo complexo, diga que abriu o chamado e que um especialista humano irá assumir em seguida.',
          `Cliente: ${customerName}\nMensagem: "${text}"`,
          0.4,
        );

        if (aiResponse && aiResponse.trim()) {
          return {
            shouldTransferToHuman: false,
            replyText: `🤖 ${aiResponse.trim()}\n\n_(Para falar com um especialista humano a qualquer momento, digite *"humano"* ou *"atendente"*)_`,
          };
        }
      } catch (e) {
        // Fallback silencioso se o LLM não estiver configurado
      }
    }

    return {
      shouldTransferToHuman: true,
      replyText: `Olá ${customerName}! Recebemos sua mensagem e abrimos um chamado de suporte com nossa equipe. Em breve um de nossos especialistas irá te responder!`,
    };
  }
}
