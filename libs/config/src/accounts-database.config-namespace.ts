import {CommonDBPoolConfig, ConfigNamespace, DBWithSchemaConfig} from "@libs/platform-config";
import Joi from "joi";


export const ACCOUNTS_DATABASE_CONFIG: symbol = Symbol.for('ACCOUNTS_DATABASE') as symbol;

export interface AccountsDatabaseConfig extends DBWithSchemaConfig, CommonDBPoolConfig {
}

export const accountsDatabaseConfigNamespace: ConfigNamespace<AccountsDatabaseConfig> = {
    key: 'accountsDb',
    token: ACCOUNTS_DATABASE_CONFIG,
    factory: (srcConfig, env): AccountsDatabaseConfig => {
        return {
            hostname: srcConfig.accountsDb.hostname ?? env.ACCOUNTS_DB_HOSTNAME!,
            port: srcConfig.accountsDb.port || env.ACCOUNTS_DB_PORT || 5432,
            username: srcConfig.accountsDb.username || env.ACCOUNTS_DB_USERNAME,
            password: srcConfig.accountsDb.password || env.ACCOUNTS_DB_PASSWORD,
            database: srcConfig.accountsDb.database || env.ACCOUNTS_DB_DATABASE,
            schema: srcConfig.accountsDb.schema || env.ACCOUNTS_DB_SCHEMA,

            maxPoolSize: srcConfig.accountsDb.maxPoolSize || env.ACCOUNTS_DB_MAX_POOL_SIZE || 10,
            minPoolSize: srcConfig.accountsDb.minPoolSize || env.ACCOUNTS_DB_MIN_POOL_SIZE || 1,
            connectionTimeoutMillis: srcConfig.accountsDb.connectionTimeoutMillis || env.ACCOUNTS_DB_CONNECTION_TIMEOUT_MILLIS || 30000,
            idleTimeoutMillis: srcConfig.accountsDb.idleTimeoutMillis || env.ACCOUNTS_DB_IDLE_TIMEOUT_MILLIS || 30000,
            maxLifetimeSeconds: srcConfig.accountsDb.maxLifetimeSeconds || env.ACCOUNTS_DB_MAX_LIFETIME_SECONDS || 3600,

        }
    },
    validationSchema: Joi.object<AccountsDatabaseConfig>({
        hostname: Joi.string().required(),
        port: Joi.number().default(5432),
        username: Joi.string().required(),
        password: Joi.string().required(),
        database: Joi.string().required(),
        schema: Joi.string().required(),

        maxPoolSize: Joi.number().optional(),
        minPoolSize: Joi.number().optional(),
        connectionTimeoutMillis: Joi.number().optional(),
        idleTimeoutMillis: Joi.number().optional(),
        maxLifetimeSeconds: Joi.number().optional(),
    })
}