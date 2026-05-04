import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cors from 'cors';
import supertokens from "supertokens-node";
import { middleware, errorHandler } from "supertokens-node/framework/express";
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(middleware());
  app.use(errorHandler());

  const config = new DocumentBuilder()
  .setTitle('Authentication')
  .setVersion('1.0')
  .addBearerAuth()
  .addCookieAuth()
  .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  
  await app.init();

  app.use(
    cors({
      origin: "http://localhost:3001",
      credentials: true,
      allowedHeaders: ["content-type", ...supertokens.getAllCORSHeaders()],
      exposeHeaders: supertokens.getAllCORSHeaders(), 
    }),
  );



  await app.listen(3000);
}
bootstrap();

