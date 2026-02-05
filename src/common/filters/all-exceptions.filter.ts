import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { DiscordLogger } from '../services/logger-discord.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Solo envía a Discord si es un error interno del servidor (500)
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      const msg = `⚠️ ERROR 500 en ${request.method} ${request.url}: ${exception.message || 'Error Desconocido'}`;
      DiscordLogger.sendError(msg);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}