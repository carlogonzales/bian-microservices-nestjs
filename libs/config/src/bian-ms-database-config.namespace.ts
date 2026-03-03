import {CommonDBPoolConfig, ConfigNamespace, DBWithSchemaConfig} from "@libs/platform-config";
import Joi from "joi";


export const BIAN_MS_DATABASE_CONFIG: symbol = Symbol.for('BIAN_MS_DATABASE_CONFIG') as symbol;

export interface BianMsDatabaseConfig extends DBWithSchemaConfig, CommonDBPoolConfig {
}

export const bianMsDatabaseConfigNamespace: ConfigNamespace<BianMsDatabaseConfig> = {
    key: 'bianMsDb',
    token: BIAN_MS_DATABASE_CONFIG,
    factory: (srcConfig, env): BianMsDatabaseConfig => {
        return {
            hostname: srcConfig.bianMsDb.hostname ?? env.BIAN_MS_DB_HOSTNAME!,
            port: srcConfig.bianMsDb.port || env.BIAN_MS_DB_PORT || 5432,
            username: srcConfig.bianMsDb.username || env.BIAN_MS_DB_USERNAME,
            password: srcConfig.bianMsDb.password || env.BIAN_MS_DB_PASSWORD,
            database: srcConfig.bianMsDb.database || env.BIAN_MS_DB_DATABASE,
            schema: srcConfig.bianMsDb.schema || env.BIAN_MS_DB_SCHEMA,

            maxPoolSize: srcConfig.bianMsDb.maxPoolSize || env.BIAN_MS_DB_MAX_POOL_SIZE || 10,
            minPoolSize: srcConfig.bianMsDb.minPoolSize || env.BIAN_MS_DB_MIN_POOL_SIZE || 1,
            connectionTimeoutMillis: srcConfig.bianMsDb.connectionTimeoutMillis || env.BIAN_MS_DB_CONNECTION_TIMEOUT_MILLIS || 30000,
            idleTimeoutMillis: srcConfig.bianMsDb.idleTimeoutMillis || env.BIAN_MS_DB_IDLE_TIMEOUT_MILLIS || 30000,
            maxLifetimeSeconds: srcConfig.bianMsDb.maxLifetimeSeconds || env.BIAN_MS_DB_MAX_LIFETIME_SECONDS || 3600,

        }
    },
    validationSchema: Joi.object<BianMsDatabaseConfig>({
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