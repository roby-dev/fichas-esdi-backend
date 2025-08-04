import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './infrastructure/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = Number(process.env.PORT || 3000);

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);
  app.enableCors({
    origin: configService
      .get<string>('CORS_ORIGIN', 'http://localhost:3000')
      .split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Fichas ESDI API')
    .setDescription('API documentation for Fichas ESDI')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  const env = configService.get<string>('NODE_ENV', 'development');

  if (env === 'development') {
    await app.listen(port, () => {
      console.log(`🚀 App escuchando en puerto ${port}`);
    });
  } else {
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 App escuchando en http://0.0.0.0:${port}`);
  }
}
bootstrap();
