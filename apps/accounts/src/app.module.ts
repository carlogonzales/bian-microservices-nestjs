import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AccountsModule } from './accounts/accounts.module';
import { LoggerModule } from 'nestjs-pino';
import { LoggerOptions } from 'pino';
import { PlatformConfigModule } from '@libs/platform-config';
import { accountsDatabaseConfigNamespace } from '@libs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PlatformConfigModule.forRoot({
      namespaces: [accountsDatabaseConfigNamespace],
    }),
    PrismaModule,
    AccountsModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'prod' ? 'info' : 'debug',
        redact: ['req.headers.authorization'], // redact sensitive data
        ...({
          transport:
            process.env.NODE_ENV === 'prod'
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: { singleLine: false },
                },
        } as LoggerOptions),
      },
    }),
  ],
})
export class AppModule implements OnModuleInit {
  onModuleInit(): any {
    // No-op for now
    return;
  }
}
