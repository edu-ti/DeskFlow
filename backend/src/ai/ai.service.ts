import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Article } from '../tickets/entities/article.entity';
import { SettingsService } from '../settings/services/settings.service';
import { KbPublicService } from '../kb/services/kb-public.service';
import axios from 'axios';

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

  async summarizeTicket(ticketId: number): Promise<{ summary: string; action_items: string[] }> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: { customer: true, owner: true, articles: true },
      order: { articles: { created_at: 'ASC' } }
    });

    if (!ticket) throw new NotFoundException('Ticket não encontrado');

    const conversationText = (ticket.articles || [])
      .map(a => `[${a.created_at.toISOString().split('T')[0]}] ${a.is_internal ? '(Nota Interna)' : ''} ${a.body}`)
      .join('\n');

    const apiKey = await this.settingsService.getSetting('OPENAI_API_KEY') || process.env.OPENAI_API_KEY;
    const model = await this.settingsService.getSetting('AI_MODEL', 'gpt-4o-mini');

    if (apiKey) {
      try {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model,
            messages: [
              {
                role: 'system',
                content: 'Você é um assistente de suporte técnico sênior da DeskFlow. Analise o histórico do chamado e gere um resumo conciso com: 1. Problema Principal, 2. Ações Tomadas e 3. Próximo Passo Recomendado. Responda em Português do Brasil de forma estruturada.'
              },
              {
                role: 'user',
                content: `Título: ${ticket.title}\nCliente: ${ticket.customer?.firstname || 'Cliente'}\nHistórico:\n${conversationText}`
              }
            ],
            temperature: 0.3,
          },
          { headers: { Authorization: `Bearer ${apiKey}` } }
        );

        const aiText = response.data.choices[0]?.message?.content || '';
        return {
          summary: aiText,
          action_items: ['Verificar resolução com o cliente', 'Atualizar status do chamado']
        };
      } catch (error) {
        this.logger.error('Erro na chamada da API de IA, usando fallback inteligente', error);
      }
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
        'Validar se a demanda foi atendida'
      ]
    };
  }

  async suggestReply(ticketId: number): Promise<{ suggestion: string }> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: { customer: true, articles: true },
      order: { articles: { created_at: 'ASC' } }
    });

    if (!ticket) throw new NotFoundException('Ticket não encontrado');

    const customerName = ticket.customer?.firstname || 'Cliente';
    const lastMessage = ticket.articles?.[ticket.articles.length - 1]?.body || ticket.title;

    const apiKey = await this.settingsService.getSetting('OPENAI_API_KEY') || process.env.OPENAI_API_KEY;
    const model = await this.settingsService.getSetting('AI_MODEL', 'gpt-4o-mini');

    if (apiKey) {
      try {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model,
            messages: [
              {
                role: 'system',
                content: 'Você é um atendente de suporte empático, claro e altamente profissional da plataforma DeskFlow. Escreva uma sugestão de resposta cordial e direta para o cliente, pronta para envio.'
              },
              {
                role: 'user',
                content: `Nome do cliente: ${customerName}\nAssunto: ${ticket.title}\nÚltima mensagem do cliente: "${lastMessage}"`
              }
            ],
            temperature: 0.5,
          },
          { headers: { Authorization: `Bearer ${apiKey}` } }
        );

        return {
          suggestion: response.data.choices[0]?.message?.content || `Olá ${customerName}, obrigado pelo contato! Estamos analisando sua solicitação.`
        };
      } catch (err) {
        this.logger.error('Erro ao gerar sugestão de resposta com IA', err);
      }
    }

    return {
      suggestion: `Olá ${customerName}, tudo bem?\n\nObrigado por nos contatar! Recebemos sua mensagem a respeito de "${ticket.title}" e já estamos verificando os detalhes para te atender da melhor forma.\n\nQualquer dúvida adicional, estamos à disposição!`
    };
  }

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
        replyText: `Entendido, ${customerName}! Estou transferindo você agora para um de nossos atendentes humanos. Por favor, aguarde um momento.`
      };
    }

    const kbResults = await this.kbPublicService.searchArticles(text);
    if (kbResults && kbResults.length > 0) {
      const topArticle = kbResults[0];
      const reply = `Olá ${customerName}! 🤖 Sou o assistente virtual do DeskFlow.\n\nEncontrei uma informação que pode te ajudar:\n\n📋 *${topArticle.title}*\n${topArticle.content.slice(0, 300)}...\n\n💡 Se isso não resolver, digite *"falar com atendente"* para transferirmos para nossa equipe!`;
      return {
        shouldTransferToHuman: false,
        replyText: reply
      };
    }

    return {
      shouldTransferToHuman: true,
      replyText: `Olá ${customerName}! Recebemos sua mensagem e abrimos um chamado de suporte com nossa equipe. Em breve um de nossos especialistas irá te responder!`
    };
  }
}
