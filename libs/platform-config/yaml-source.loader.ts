import {Logger} from "@nestjs/common";
import fs from "node:fs";
import * as yaml from "js-yaml";

type PlainObject = Record<string, any>;

function isObject(value: any): value is PlainObject {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(target: PlainObject, source: PlainObject): PlainObject {
    const out: PlainObject = {...target};
    for (const [k, v] of Object.entries(source)) {
        out[k] = isObject(v) && isObject(out[k]) ? deepMerge(out[k], v) : v;
    }
    return out;
}


const logger: Logger = new Logger('YamlConfigLoader', {timestamp: true});

function toKebabCase(str: string) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2') // Add a dash between lowercase and uppercase letters
        .replace(/[\s_]+/g, '-') // Replace spaces and underscores with dashes
        .toLowerCase(); // Convert to lowercase
}

function splitCSV(str: string): string[] {
    return str.split(',').map(s => s.trim()).filter(s => s.length > 0);
}

export function loadYamlSource(): PlainObject {
    logger.log('Load YAML config');
    const env = process.env.NODE_ENV || 'dev';
    const candidateConfigList = ['global', ...splitCSV(process.env.CONFIGS || '').map(config => toKebabCase(config))];
    logger.log(`Load YAML config with env: ${env} and candidate config list: ${candidateConfigList.join(', ')}`);

    const OS_TYPE = process.platform; // 'win32' for Windows, 'darwin' for macOS, 'linux' for Linux
    logger.log(`Load YAML config with OS TYPE: ${OS_TYPE}`);

    const candidateConfigFolders: string[] = [
        `${process.cwd()}/config`,
        `${process.env.HOME || process.env.USERPROFILE}/.config/bian`,
        OS_TYPE === 'win32' ? `${process.env.APPDATA}/bian` : '/etc/bian',
    ];
    logger.log(`Load YAML config with candidate config folders: ${candidateConfigFolders.join(', ')}`);

    let finalConfig: PlainObject = {};
    for (const configName of candidateConfigList) {
        let found = false;
        for (const folder of candidateConfigFolders) {
            const filePath = `${folder}/${configName}.${env}.yaml`;
            if (!fs.existsSync(filePath)) {
                continue; // File does not exist, try the next folder
            }
            try {
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                const configData: PlainObject = yaml.load(fileContent) as unknown as PlainObject;
                finalConfig = deepMerge(finalConfig, configData);
                found = true;
                logger.log(`Configuration file for ${configName} loaded from ${filePath}`);
                break; // Stop searching after finding the first match
            } catch (error: Error | unknown) {
                if (error instanceof Error) {
                    logger.error(`Error loading configuration file for ${configName} from ${filePath}: ${error.message}`);
                } else {
                    logger.error(`Unknown error loading configuration file for ${configName} from ${filePath}`);
                }
                throw error;
            }
        }
        if (!found && configName !== 'global') {
            throw new Error(`Configuration file for ${configName} not found in any of the candidate folders.`);
        }
    }

    logger.log(`YAML configuration loaded successfully with ${Object.keys(finalConfig).length} keys.`);
    logger.verbose(`Final merged configuration: ${JSON.stringify(finalConfig)}`);
    return finalConfig;
}
