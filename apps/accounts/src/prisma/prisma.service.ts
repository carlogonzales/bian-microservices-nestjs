import { Prisma, PrismaClient } from '@prisma/client';
import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Pool, PoolConfig } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as BianConfig from '@libs/config';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, Prisma.LogLevel>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly bianMsDbConfig: BianConfig.BianMsDatabaseConfig;

  constructor(
    private readonly logger: PinoLogger,
    @Inject(BianConfig.BIAN_MS_DATABASE_CONFIG)
    bianMsDbConfig: BianConfig.BianMsDatabaseConfig,
  ) {
    const poolConfig: PoolConfig = {
      user: bianMsDbConfig.username,
      host: bianMsDbConfig.hostname,
      database: bianMsDbConfig.database,
      password: bianMsDbConfig.password,
      port: bianMsDbConfig.port,
      max: bianMsDbConfig.maxPoolSize,
      min: bianMsDbConfig.minPoolSize,
      idleTimeoutMillis: bianMsDbConfig.idleTimeoutMillis,
      maxLifetimeSeconds: bianMsDbConfig.maxLifetimeSeconds,
    };
    const pool = new Pool(poolConfig);
    super({
      adapter: new PrismaPg(pool, {
        schema: bianMsDbConfig.schema,
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

    this.bianMsDbConfig = bianMsDbConfig;
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
