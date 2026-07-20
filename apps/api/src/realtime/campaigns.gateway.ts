import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CampaignsService } from '../campaigns/campaigns.service';

interface JwtPayload {
  sub: string;
}

/**
 * Substitui o polling de 1.5s do frontend (GET /campaigns/:id/live-state) por
 * push em tempo real. Cada cliente entra na sala da campanha só depois de
 * provar acesso (mesma checagem usada pelas rotas HTTP), então o servidor
 * confia no socket para os eventos seguintes daquela sala.
 */
@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: '/realtime'
})
export class CampaignsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(CampaignsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly campaignsService: CampaignsService
  ) {}

  handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET')
      });
      client.data.userId = payload.sub;
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect() {
    // Nada a limpar: socket.io remove o socket de todas as salas automaticamente.
  }

  @SubscribeMessage('campaign:join')
  async handleJoin(@ConnectedSocket() client: Socket, @MessageBody() campaignId: unknown) {
    const userId = client.data.userId as string | undefined;
    if (!userId || typeof campaignId !== 'string' || !campaignId) return;

    try {
      await this.campaignsService.ensureAccess(userId, campaignId);
      await client.join(this.room(campaignId));
    } catch (error) {
      this.logger.debug(`Acesso negado a ${client.id} para a campanha ${campaignId}: ${(error as Error).message}`);
    }
  }

  @SubscribeMessage('campaign:leave')
  async handleLeave(@ConnectedSocket() client: Socket, @MessageBody() campaignId: unknown) {
    if (typeof campaignId === 'string' && campaignId) await client.leave(this.room(campaignId));
  }

  /**
   * Rolagem de dados é só um efeito colateral cosmético compartilhado com a
   * mesa: o servidor apenas retransmite para quem já está na sala (não há
   * dado sensível nem persistência aqui).
   */
  @SubscribeMessage('dice:roll')
  handleDiceRoll(@ConnectedSocket() client: Socket, @MessageBody() payload: unknown) {
    if (!payload || typeof payload !== 'object') return;
    const { campaignId, notation, total, rolls, rolledBy } = payload as Record<string, unknown>;
    if (typeof campaignId !== 'string' || !client.rooms.has(this.room(campaignId))) return;
    if (typeof notation !== 'string' || typeof total !== 'number' || !Array.isArray(rolls)) return;

    this.server.to(this.room(campaignId)).emit('dice:rolled', {
      campaignId,
      notation: notation.slice(0, 40),
      total,
      rolls,
      rolledBy: typeof rolledBy === 'string' ? rolledBy.slice(0, 60) : 'Alguém',
      at: new Date().toISOString()
    });
  }

  /** Notifica todos na sala que a campanha mudou; o cliente decide se refaz o fetch. */
  emitCampaignChanged(campaignId: string, reason: string) {
    this.server?.to(this.room(campaignId)).emit('campaign:changed', { campaignId, reason, at: new Date().toISOString() });
  }

  private room(campaignId: string) {
    return `campaign:${campaignId}`;
  }

  private extractToken(client: Socket): string {
    const authToken = client.handshake.auth?.token as string | undefined;
    const headerValue = client.handshake.headers.authorization;
    const headerToken = headerValue?.startsWith('Bearer ') ? headerValue.slice(7) : undefined;
    const token = authToken || headerToken;
    if (!token) throw new Error('Token ausente.');
    return token;
  }
}
