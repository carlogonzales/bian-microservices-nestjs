import { Prisma, PrismaClient } from '@prisma/client';
import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Pool, PoolConfig } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { ACCOUNTS_DATABASE_CONFIG, AccountsDatabaseConfig } from '@libs/config';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, Prisma.LogLevel>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly accountsDbConfig: AccountsDatabaseConfig;

  constructor(
    private readonly logger: PinoLogger,
    @Inject(ACCOUNTS_DATABASE_CONFIG)
    accountsDbConfig: AccountsDatabaseConfig,
  ) {
    const poolConfig: PoolConfig = {
      user: accountsDbConfig.username,
      host: accountsDbConfig.hostname,
      database: accountsDbConfig.database,
      password: accountsDbConfig.password,
      port: accountsDbConfig.port,
      max: 5,
      min: 1,
      idleTimeoutMillis: 30000, // 30 seconds
    };
    const pool = new Pool(poolConfig);
    super({
      adapter: new PrismaPg(pool, {
        schema: accountsDbConfig.schema,
      }),
      log: [
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
        ...(process.env.NODE_ENV !== 'prod'
          ? [{ level: 'query', emit: 'event' } as const]
          : []),
      ],
    });
    this.$on('error', (e: Prisma.LogEvent) =>
      this.logger.error({ prisma: true, ...e }, 'Prisma error'),
    );

    this.$on('warn', (e: Prisma.LogEvent) =>
      this.logger.warn({ prisma: true, ...e }, 'Prisma warning'),
    );

    this.$on('query', (e: Prisma.QueryEvent) =>
      this.logger.debug(
        {
          prisma: true,
          query: e.query,
          params: e.params,
          duration: e.duration,
        },
        'Prisma query',
      ),
    );

    this.accountsDbConfig = accountsDbConfig;
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
