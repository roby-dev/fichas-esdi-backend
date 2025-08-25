import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { LogoutUseCase } from 'src/application/use-cases/auth/logout.use-case';
import { ConfigService } from '@nestjs/config';
import { ActivateSessionUseCase } from 'src/application/use-cases/auth/active-session.use-case';

interface ClientData {
  tokenId: string;
  userId: string;
  ip?: string;
  userAgent?: string;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private connectedClients = new Map<string, ClientData>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly activateSessionUseCase: ActivateSessionUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  async handleConnection(client: any) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const clientData: ClientData = {
        tokenId: payload.jti,
        userId: payload.sub,
        ip: client.handshake.address,
        userAgent: client.handshake.headers['user-agent'] as string,
      };

      this.connectedClients.set(client.id, clientData);

      client.data = clientData;

      await this.activateSessionUseCase.execute(
        clientData.tokenId,
        clientData.ip,
        clientData.userAgent,
      );

      console.log(
        `Cliente conectado: ${payload.sub} - tokenId: ${payload.jti}`,
      );
    } catch (err) {
      console.error('Token inválido, desconectando cliente');
      client.disconnect();
    }
  }

  async handleDisconnect(client: any) {
    const clientData: ClientData = client.data as ClientData;

    if (clientData?.tokenId) {
      await this.logoutUseCase.execute(
        clientData.tokenId,
        clientData.ip,
        clientData.userAgent,
      );
      console.log(`Sesión cerrada por desconexión: ${clientData.tokenId}`);
    }

    this.connectedClients.delete(client.id);
  }

  getClientsByUserId(userId: string): ClientData[] {
    return Array.from(this.connectedClients.values()).filter(
      (c) => c.userId === userId,
    );
  }
}
