import {spawnSync} from 'node:child_process';
import process from 'node:process';
import path from 'node:path';
import fsp, {mkdir, readFile} from 'node:fs/promises';
import fs from 'node:fs';
import {Command} from 'commander';

const ROOT = process.cwd();
const APPS_FOLDER = path.join(ROOT, 'apps');

// ----
// App Dependencies Configuration
// ----
const APP_INTERNAL_DEPENDENCIES = [
    '@libs/common-logging@workspace:*',
    '@libs/config@workspace:*',
    '@libs/platform-config@workspace:*',
    '@libs/nest-correlation@workspace:*',
    '@libs/prisma-tx@workspace:*',
]

const APP_DEPENDENCIES = [
    // DB Connection
    'pg',
    '@prisma/client',
    '@prisma/adapter-pg',
    // Utils
    '@nestjs/config',
    'nestjs-pino',
    'class-validator',
    'class-transformer',
    'decimal.js',
];

const APP_DEV_DEPENDENCIES = [
    // Add dev dependencies here if needed in the future
];

// ----
// Files to create
// ----
const FILES_TO_CREATE = [{
    'app.module.ts': {folder: 'src', overwrite: true},
    'domain-exception.filter.ts': {folder: 'src/common'},
    'health.controller.ts': {folder: 'src/health'},
    'health.module.ts': {folder: 'src/health'},
    'main.ts': {folder: 'src', overwrite: true},
    'prisma.module.ts': {folder: 'src/prisma'},
    'prisma.service.ts': {folder: 'src/prisma'},
    '{{serviceNameKebab}}.controller.ts': {folder: 'src/{{serviceNameKebab}}'},
    '{{serviceNameKebab}}.errors.ts': {folder: 'src/{{serviceNameKebab}}'},
    '{{serviceNameKebab}}.mapper.ts': {folder: 'src/{{serviceNameKebab}}'},
    '{{serviceNameKebab}}.module.ts': {folder: 'src/{{serviceNameKebab}}'},
    '{{serviceNameKebab}}.repository.ts': {folder: 'src/{{serviceNameKebab}}'},
    '{{serviceNameKebab}}.service.ts': {folder: 'src/{{serviceNameKebab}}'},
    '{{serviceNameKebab}}.types.ts': {folder: 'src/{{serviceNameKebab}}'},
    '.gitkeep': {folder: 'src/{{serviceNameKebab}}/dto', emptyFile: true},
    'tsconfig.build.json': {folder: '', overwrite: true},
    'tsconfig.json': {folder: '', overwrite: true},
    'nest-cli.json': {folder: '', overwrite: true},
    '.env': {folder: '', overwrite: true},
}];

function fail(msg) {
    console.error(`\n❌ ${msg}\n`);
    process.exit(1);
}

function run(cmd, args, opts = {}) {
    const res = spawnSync(cmd, args, {
        stdio: 'inherit',
        shell: process.platform === 'win32', // ensures pnpm/npx works on Windows
        ...opts,
    });
    if (res.status !== 0) {
        fail(`Command failed: ${cmd} ${args.join(' ')}`);
    }
}

function buildOptsParser() {
    const opts = new Command();

    opts
        .name('Bian MS App Generator')
        .description('CLI to generate a new Bian MS app with best practices and standard structure.')
        // If you have positionals, keep them explicit:
        .argument('<name>', 'Application name in kebab-case (e.g. \'order-service\')')
        .option('-p, --port <number>', 'Port number', (v) => {
            const n = Number(v);
            if (!Number.isInteger(n) || n < 1 || n > 65535) {
                throw new Error('Invalid --port. Must be an integer between 1 and 65535.');
            }
            return n;
        })
        .option('--dry-run', 'Run without making changes', false);

    return opts;
}

export function parseArgs(argv) {
    const optsParser = buildOptsParser();

    // Prevent commander from exiting the process in tests / callers:
    // REF: https://github.com/tj/commander.js#override-exit-and-output-handling
    optsParser.exitOverride();

    if (!process.argv.slice(2).length) {
        optsParser.help();
    }

    try {
        optsParser.parse(argv, {from: 'node'});
    } catch (err) {
        // Normalize commander errors so the caller can decide what to do:
        const message = err?.message ?? 'CLI parsing failed';
        const code = err?.code ?? 'CLI_PARSE_ERROR';
        throw Object.assign(new Error(message), {code, cause: err});
    }

    const [name] = optsParser.args;

    // commander returns camelCased option keys by default (dryRun)
    const opts = optsParser.opts();

    return {
        args: {name},
        options: {
            port: opts.port ?? null,
            dryRun: Boolean(opts.dryRun),
        },
    };
}

async function ensureWorkspace() {
    const ws = path.join(ROOT, 'pnpm-workspace.yaml');
    if (!fs.existsSync(ws)) fail('pnpm-workspace.yaml not found at repo root.');
    if (!fs.existsSync(APPS_FOLDER)) await fsp.mkdir(APPS_FOLDER, {recursive: true});
}

async function removeIfExists(p) {
    if (fs.existsSync(p)) {
        console.log(`Removing existing file/folder: ${p}`);
        await fsp.rm(p, {recursive: true, force: true});
    }
}

async function ensureFolder(folderPath) {
    await mkdir(folderPath, {recursive: true});
}

async function writeFileEnsured(filePath, content) {
    await fsp.mkdir(path.dirname(filePath), {recursive: true});
    await fsp.writeFile(filePath, content, 'utf-8');
}

async function readFileContent(filename) {
    try {
        return await readFile(filename, 'utf-8');
    } catch (error) {
        throw new Error(`Failed to read file "${filename}": ${error.message}`);
    }
}

async function fileExists(p) {
    try {
        await access(p, FS_CONSTANTS.F_OK);
        return true;
    } catch {
        return false;
    }
}

// Convert kebab or snake case to PascalCase for app naming
function toPascalCase(str) {
    return str
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}

function toSnakeCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1_$2') // handle camelCase to snake_case
        .replace(/[-\s]+/g, '_') // handle kebab-case and spaces to snake_case
        .toLowerCase();
}

function replacePlaceholders(str, dict) {
    return str.replace(/\{\{(\w+)\}\}/g, (m, key) =>
        Object.prototype.hasOwnProperty.call(dict, key) ? String(dict[key]) : m,
    );
}

async function installDeps(serviceName) {
    // Install only what the app needs (scoped), not workspace root - keeps ownership clear.
    if (APP_DEPENDENCIES.length > 0) {
        run('pnpm', ['--filter', serviceName, 'add', ...APP_DEPENDENCIES]);
    }

    if (APP_DEV_DEPENDENCIES.length > 0) {
        run('pnpm', ['--filter', serviceName, 'add', '-D', ...APP_DEV_DEPENDENCIES]);
    }

    if (APP_INTERNAL_DEPENDENCIES.length > 0) {
        run('pnpm', ['--filter', serviceName, 'add', ...APP_INTERNAL_DEPENDENCIES]);
    }
}

async function createBaselineFiles(appFolder, templateFolder, templateVars) {
    const placeholderDictionary = {
        // Leave emtpy for now, but this allows us to easily add more placeholders in the future if needed.
        ...templateVars,
    };

    const entries = FILES_TO_CREATE.flatMap((group) => Object.entries(group));

    const results = {
        created: [],
        skipped: [],
    };


    for (const [rawFilename, meta] of entries) {
        const resolvedFilename = replacePlaceholders(rawFilename, placeholderDictionary);
        const resolvedFolder = replacePlaceholders(meta.folder, placeholderDictionary);

        const targetFolder = path.join(appFolder, resolvedFolder);
        const targetPath = path.join(targetFolder, resolvedFilename);

        await ensureFolder(targetFolder);

        // XXX: For future me. :D Should we place an override incase the file exists?
        if (await fileExists(targetPath) && meta.overwrite !== true) {
            results.skipped.push(targetPath);
            continue;
        }

        // Create empty file if configured
        if (meta.emptyFile) {
            await writeFileEnsured(targetPath, '', 'utf8');
            results.created.push(targetPath);
            continue;
        }

        // Otherwise, try to read a template and apply placeholders
        const templatePath = path.join(templateFolder, rawFilename + '.tmp');
        const tpl = await readFileContent(templatePath);

        const content =
            tpl === null
                ? '' // safe fallback if template missing
                : replacePlaceholders(tpl, placeholderDictionary);

        await writeFileEnsured(targetPath, content, 'utf8');
        results.created.push(targetPath);
    }

    console.log('Baseline generation result:');
    console.log('Created files:');
    results.created.forEach(f => console.log(`  ✓ ${f}`));

    console.log('\nSkipped files (already existed):');
    results.skipped.forEach(f => console.log(`  - ${f}`));
}

async function main() {
    const {args, options} = parseArgs(process.argv);

    const serviceName = args.name;
    const serviceNameKebab = serviceName.toLowerCase();
    const serviceNamePascal = toPascalCase(serviceNameKebab);
    const serviceNameSnake = toSnakeCase(serviceNameKebab);
    const servicePort = options.port || 3000;

    const appFolder = path.join(APPS_FOLDER, serviceNameKebab);
    const templateFolder = path.join(ROOT, 'scripts', 'templates');

    console.log(`Generated service name: ${serviceName} (${serviceNameKebab}, ${serviceNamePascal})`);
    console.log(`Generated service port: ${servicePort}`);
    console.log(`Service folder: ${appFolder}`);
    console.log(`Template folder: ${templateFolder}`);

    if (fs.existsSync(appFolder)) fail(`apps/${serviceName} already exists`);

    // 0. Ensure we're in the right place and have the workspace file
    await ensureWorkspace();

    // 1. Create Nest app (skip git + skip install to avoid app-local node_modules)
    console.log(`\nCreating Nest app using @nestjs/cli...`);
    run('pnpm', [
        'dlx',
        '@nestjs/cli',
        'new',
        `apps/${serviceNameKebab}`,
        '--package-manager',
        'pnpm',
        '--skip-git',
        '--skip-install',
    ]);

    // 2. Clean monorepo artifacts (just in case). We need to be paranoid. lol
    console.log(`\nCleaning up generated app files/folders...`);
    await removeIfExists(path.join(appFolder, 'node_modules'));
    await removeIfExists(path.join(appFolder, 'pnpm-lock.yaml'));
    await removeIfExists(path.join(appFolder, 'package-lock.json'));
    await removeIfExists(path.join(appFolder, 'yarn.lock'));

    // 3. Install deps (scoped to service)
    console.log(`\nInstalling dependencies for ${serviceNameKebab}...`);
    await installDeps(serviceNameKebab);

    // 4. Create baseline files from templates
    console.log(`\nGenerating baseline files from templates...`);
    await createBaselineFiles(appFolder, templateFolder, {
        serviceName,
        serviceNameKebab,
        serviceNamePascal,
        serviceNameSnake,
        servicePort,
    });

    // 5. Final message
    console.log(`\nGenerated service: apps/${serviceNameKebab}`);
    console.log(`\nNext:\n  pnpm --filter ${serviceNameKebab} start:dev\n`);
}

main().catch((e) => fail(e?.stack || String(e)));