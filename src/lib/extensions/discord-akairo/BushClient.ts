import {
	abbreviatedNumber,
	contentWithDuration,
	discordEmoji,
	duration,
	durationSeconds,
	globalUser,
	messageLink,
	permission,
	roleWithDuration,
	snowflake
} from '#args';
import type {
	BushBaseGuildEmojiManager,
	BushChannelManager,
	BushClientEvents,
	BushClientUser,
	BushGuildManager,
	BushUserManager,
	BushUserResolvable,
	Config
} from '#lib';
import { patch, type PatchedElements } from '@notenoughupdates/events-intercept';
import * as Sentry from '@sentry/node';
import { AkairoClient, ContextMenuCommandHandler, version as akairoVersion } from 'discord-akairo';
import {
	Intents,
	Options,
	Structures,
	version as discordJsVersion,
	type Awaitable,
	type If,
	type InteractionReplyOptions,
	type Message,
	type MessageEditOptions,
	type MessageOptions,
	type MessagePayload,
	type ReplyMessageOptions,
	type Snowflake,
	type WebhookEditMessageOptions
} from 'discord.js';
import EventEmitter from 'events';
import path from 'path';
import readline from 'readline';
import type { Sequelize as SequelizeType } from 'sequelize';
import { fileURLToPath } from 'url';
import UpdateCacheTask from '../../../tasks/updateCache.js';
import UpdateStatsTask from '../../../tasks/updateStats.js';
import { ActivePunishment } from '../../models/ActivePunishment.js';
import { Global } from '../../models/Global.js';
import { Guild as GuildModel } from '../../models/Guild.js';
import { Level } from '../../models/Level.js';
import { ModLog } from '../../models/ModLog.js';
import { Reminder } from '../../models/Reminder.js';
import { Stat } from '../../models/Stat.js';
import { StickyRole } from '../../models/StickyRole.js';
import { AllowedMentions } from '../../utils/AllowedMentions.js';
import { BushCache } from '../../utils/BushCache.js';
import { BushConstants } from '../../utils/BushConstants.js';
import { BushLogger } from '../../utils/BushLogger.js';
import { BushButtonInteraction } from '../discord.js/BushButtonInteraction.js';
import { BushCategoryChannel } from '../discord.js/BushCategoryChannel.js';
import { BushCommandInteraction } from '../discord.js/BushCommandInteraction.js';
import { BushDMChannel } from '../discord.js/BushDMChannel.js';
import { BushGuild } from '../discord.js/BushGuild.js';
import { BushGuildEmoji } from '../discord.js/BushGuildEmoji.js';
import { BushGuildMember } from '../discord.js/BushGuildMember.js';
import { BushMessage } from '../discord.js/BushMessage.js';
import { BushMessageReaction } from '../discord.js/BushMessageReaction.js';
import { BushNewsChannel } from '../discord.js/BushNewsChannel.js';
import { BushPresence } from '../discord.js/BushPresence.js';
import { BushRole } from '../discord.js/BushRole.js';
import { BushSelectMenuInteraction } from '../discord.js/BushSelectMenuInteraction.js';
import { BushStoreChannel } from '../discord.js/BushStoreChannel.js';
import { BushTextChannel } from '../discord.js/BushTextChannel.js';
import { BushThreadChannel } from '../discord.js/BushThreadChannel.js';
import { BushThreadMember } from '../discord.js/BushThreadMember.js';
import { BushUser } from '../discord.js/BushUser.js';
import { BushVoiceChannel } from '../discord.js/BushVoiceChannel.js';
import { BushVoiceState } from '../discord.js/BushVoiceState.js';
import { BushClientUtil } from './BushClientUtil.js';
import { BushCommandHandler } from './BushCommandHandler.js';
import { BushInhibitorHandler } from './BushInhibitorHandler.js';
import { BushListenerHandler } from './BushListenerHandler.js';
import { BushTaskHandler } from './BushTaskHandler.js';
const { Sequelize } = (await import('sequelize')).default;

export type BushReplyMessageType = string | MessagePayload | ReplyMessageOptions;
export type BushEditMessageType = string | MessageEditOptions | MessagePayload;
export type BushSlashSendMessageType = string | MessagePayload | InteractionReplyOptions;
export type BushSlashEditMessageType = string | MessagePayload | WebhookEditMessageOptions;
export type BushSendMessageType = string | MessagePayload | MessageOptions;

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * The main hub for interacting with the Discord API.
 */
export class BushClient<Ready extends boolean = boolean> extends AkairoClient<Ready> {
	public declare channels: BushChannelManager;
	public declare readonly emojis: BushBaseGuildEmojiManager;
	public declare guilds: BushGuildManager;
	public declare user: If<Ready, BushClientUser>;
	public declare users: BushUserManager;
	public declare util: BushClientUtil;
	public declare ownerID: Snowflake[];

	/**
	 * Whether or not the client is ready.
	 */
	public customReady = false;

	/**
	 * Stats for the client.
	 */
	public stats: BushStats = { cpu: undefined, commandsUsed: 0n };

	/**
	 * The configuration for the client.
	 */
	public config: Config;

	/**
	 * The handler for the bot's listeners.
	 */
	public listenerHandler: BushListenerHandler;

	/**
	 * The handler for the bot's command inhibitors.
	 */
	public inhibitorHandler: BushInhibitorHandler;

	/**
	 * The handler for the bot's commands.
	 */
	public commandHandler: BushCommandHandler;

	/**
	 * The handler for the bot's tasks.
	 */
	public taskHandler: BushTaskHandler;

	/**
	 * The handler for the bot's context menu commands.
	 */
	public contextMenuCommandHandler: ContextMenuCommandHandler;

	/**
	 * The database connection for the bot.
	 */
	public db: SequelizeType;

	/**
	 * A custom logging system for the bot.
	 */
	public logger = BushLogger;

	/**
	 * Constants for the bot.
	 */
	public constants = BushConstants;

	/**
	 * Cached global and guild database data.
	 */
	public cache = new BushCache();

	/**
	 * Sentry error reporting for the bot.
	 */
	public sentry!: typeof Sentry;

	/**
	 * @param config The configuration for the bot.
	 */
	public constructor(config: Config) {
		super({
			ownerID: config.owners,
			intents: Object.values(Intents.FLAGS).reduce((acc, p) => acc | p, 0),
			presence: {
				activities: [
					{
						name: 'Beep Boop',
						type: 'WATCHING'
					}
				],
				status: 'online'
			},
			http: { api: 'https://canary.discord.com/api' },
			allowedMentions: AllowedMentions.users(), // No everyone or role mentions by default
			makeCache: Options.cacheWithLimits({}),
			failIfNotExists: false
		});
		patch(this);

		this.token = config.token as If<Ready, string, string | null>;
		this.config = config;
		this.listenerHandler = new BushListenerHandler(this, {
			directory: path.join(__dirname, '..', '..', '..', 'listeners'),
			automateCategories: true
		});
		this.inhibitorHandler = new BushInhibitorHandler(this, {
			directory: path.join(__dirname, '..', '..', '..', 'inhibitors'),
			automateCategories: true
		});
		this.taskHandler = new BushTaskHandler(this, {
			directory: path.join(__dirname, '..', '..', '..', 'tasks'),
			automateCategories: true
		});
		this.commandHandler = new BushCommandHandler(this, {
			directory: path.join(__dirname, '..', '..', '..', 'commands'),
			prefix: async ({ guild }: Message) => {
				if (this.config.isDevelopment) return 'dev ';
				if (!guild) return this.config.prefix;
				const prefix = await (guild as BushGuild).getSetting('prefix');
				return (prefix ?? this.config.prefix) as string;
			},
			allowMention: true,
			handleEdits: true,
			commandUtil: true,
			commandUtilLifetime: 300_000, // 5 minutes
			argumentDefaults: {
				prompt: {
					start: 'Placeholder argument prompt. If you see this please tell my developers.',
					retry: 'Placeholder failed argument prompt. If you see this please tell my developers.',
					modifyStart: (_: Message, str: string): string => `${str}\n\n Type \`cancel\` to cancel the command`,
					modifyRetry: (_: Message, str: string): string =>
						`${str.replace('{error}', this.util.emojis.error)}\n\n Type \`cancel\` to cancel the command`,
					timeout: 'You took too long the command has been cancelled',
					ended: 'You exceeded the maximum amount of tries the command has been cancelled',
					cancel: 'The command has been cancelled',
					retries: 3,
					time: 3e4
				},
				otherwise: ''
			},
			automateCategories: false,
			autoRegisterSlashCommands: true,
			skipBuiltInPostInhibitors: true,
			useSlashPermissions: true,
			aliasReplacement: /-/g
		});
		this.contextMenuCommandHandler = new ContextMenuCommandHandler(this, {
			directory: path.join(__dirname, '..', '..', '..', 'context-menu-commands'),
			automateCategories: true
		});
		this.util = new BushClientUtil(this);
		this.db = new Sequelize({
			database: this.config.isDevelopment ? 'bushbot-dev' : this.config.isBeta ? 'bushbot-beta' : 'bushbot',
			username: this.config.db.username,
			password: this.config.db.password,
			dialect: 'postgres',
			host: this.config.db.host,
			port: this.config.db.port,
			logging: this.config.logging.db ? (sql) => this.logger.debug(sql) : false,
			timezone: 'America/New_York'
		});

		// global objects
		global.client = this;
		global.util = this.util;
	}

	/**
	 * A custom logging system for the bot.
	 */
	public get console(): typeof BushLogger {
		return this.logger;
	}

	/**
	 * Constants for the bot.
	 */
	public get consts(): typeof BushConstants {
		return this.constants;
	}

	/**
	 * Extends discord.js structures before the client is instantiated.
	 */
	public static extendStructures(): void {
		Structures.extend('GuildEmoji', () => BushGuildEmoji);
		Structures.extend('DMChannel', () => BushDMChannel);
		Structures.extend('TextChannel', () => BushTextChannel);
		Structures.extend('VoiceChannel', () => BushVoiceChannel);
		Structures.extend('CategoryChannel', () => BushCategoryChannel);
		Structures.extend('NewsChannel', () => BushNewsChannel);
		Structures.extend('StoreChannel', () => BushStoreChannel);
		Structures.extend('ThreadChannel', () => BushThreadChannel);
		Structures.extend('GuildMember', () => BushGuildMember);
		Structures.extend('ThreadMember', () => BushThreadMember);
		Structures.extend('Guild', () => BushGuild);
		Structures.extend('Message', () => BushMessage);
		Structures.extend('MessageReaction', () => BushMessageReaction);
		Structures.extend('Presence', () => BushPresence);
		Structures.extend('VoiceState', () => BushVoiceState);
		Structures.extend('Role', () => BushRole);
		Structures.extend('User', () => BushUser);
		Structures.extend('CommandInteraction', () => BushCommandInteraction);
		Structures.extend('ButtonInteraction', () => BushButtonInteraction);
		Structures.extend('SelectMenuInteraction', () => BushSelectMenuInteraction);
	}

	/**
	 * Initializes the bot.
	 */
	async init() {
		if (!process.version.startsWith('v17.')) {
			void (await this.console.error('version', `Please use node <<v17.x.x>>, not <<${process.version}>>.`, false));
			process.exit(2);
		}

		this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
		this.commandHandler.useListenerHandler(this.listenerHandler);
		this.commandHandler.useTaskHandler(this.taskHandler);
		this.commandHandler.useContextMenuCommandHandler(this.contextMenuCommandHandler);
		this.commandHandler.ignorePermissions = this.config.owners;
		this.commandHandler.ignoreCooldown = [...new Set([...this.config.owners, ...this.cache.global.superUsers])];
		this.listenerHandler.setEmitters({
			client: this,
			commandHandler: this.commandHandler,
			inhibitorHandler: this.inhibitorHandler,
			listenerHandler: this.listenerHandler,
			taskHandler: this.taskHandler,
			contextMenuCommandHandler: this.contextMenuCommandHandler,
			process,
			stdin: rl,
			gateway: this.ws
		});
		this.commandHandler.resolver.addTypes({
			duration,
			contentWithDuration,
			permission,
			snowflake,
			discordEmoji,
			roleWithDuration,
			abbreviatedNumber,
			durationSeconds,
			globalUser,
			messageLink
		});

		this.sentry = Sentry;
		this.sentry.setTag('process', process.pid.toString());
		this.sentry.setTag('discord.js', discordJsVersion);
		this.sentry.setTag('discord-akairo', akairoVersion);
		void this.logger.success('startup', `Successfully connected to <<Sentry>>.`, false);

		// loads all the handlers
		const handlers = {
			commands: this.commandHandler,
			contextMenuCommands: this.contextMenuCommandHandler,
			listeners: this.listenerHandler,
			inhibitors: this.inhibitorHandler,
			tasks: this.taskHandler
		};
		const handlerPromises = Object.entries(handlers).map(([handlerName, handler]) =>
			handler
				.loadAll()
				.then(() => {
					void this.logger.success('startup', `Successfully loaded <<${handlerName}>>.`, false);
				})
				.catch((e) => {
					void this.logger.error('startup', `Unable to load loader <<${handlerName}>> with error:\n${e?.stack || e}`, false);
					if (process.argv.includes('dry')) process.exit(1);
				})
		);
		await Promise.allSettled(handlerPromises);
	}

	/**
	 * Connects to the database, initializes models, and creates tables if they do not exist.
	 */
	private async dbPreInit() {
		try {
			await this.db.authenticate();
			Global.initModel(this.db);
			GuildModel.initModel(this.db, this);
			ModLog.initModel(this.db);
			ActivePunishment.initModel(this.db);
			Level.initModel(this.db);
			StickyRole.initModel(this.db);
			Stat.initModel(this.db);
			Reminder.initModel(this.db);
			await this.db.sync({ alter: true }); // Sync all tables to fix everything if updated
			await this.console.success('startup', `Successfully connected to <<database>>.`, false);
		} catch (e) {
			await this.console.error(
				'startup',
				`Failed to connect to <<database>> with error:\n${util.inspect(e, { colors: true, depth: 1 })}`,
				false
			);
			process.exit(2);
		}
	}

	/**
	 * Starts the bot
	 */
	public async start() {
		this.intercept('ready', async (arg, done) => {
			await this.guilds.fetch();
			const promises = this.guilds.cache.map((guild) => {
				return guild.members.fetch();
			});
			await Promise.all(promises);
			this.customReady = true;
			this.taskHandler.startAll();
			return done(null, `intercepted ${arg}`);
		});

		try {
			await this.dbPreInit();
			await UpdateCacheTask.init(this);
			void this.console.success('startup', `Successfully created <<cache>>.`, false);
			this.stats.commandsUsed = await UpdateStatsTask.init();
			await this.login(this.token!);
		} catch (e) {
			await this.console.error('start', util.inspect(e, { colors: true, depth: 1 }), false);
			process.exit(1);
		}
	}

	/**
	 * Logs out, terminates the connection to Discord, and destroys the client.
	 */
	public override destroy(relogin = false): void | Promise<string> {
		super.destroy();
		if (relogin) {
			return this.login(this.token!);
		}
	}

	public override isOwner(user: BushUserResolvable): boolean {
		return this.config.owners.includes(this.users.resolveId(user!)!);
	}

	public override isSuperUser(user: BushUserResolvable): boolean {
		const userID = this.users.resolveId(user)!;
		return !!client.cache?.global?.superUsers?.includes(userID) || this.config.owners.includes(userID);
	}
}

export interface BushClient extends EventEmitter, PatchedElements {
	on<K extends keyof BushClientEvents>(event: K, listener: (...args: BushClientEvents[K]) => Awaitable<void>): this;
	// on<S extends string | symbol>(event: Exclude<S, keyof BushClientEvents>, listener: (...args: any[]) => Awaitable<void>): this;

	once<K extends keyof BushClientEvents>(event: K, listener: (...args: BushClientEvents[K]) => Awaitable<void>): this;
	// once<S extends string | symbol>(event: Exclude<S, keyof BushClientEvents>, listener: (...args: any[]) => Awaitable<void>): this;

	emit<K extends keyof BushClientEvents>(event: K, ...args: BushClientEvents[K]): boolean;
	// emit<S extends string | symbol>(event: Exclude<S, keyof BushClientEvents>, ...args: unknown[]): boolean;

	off<K extends keyof BushClientEvents>(event: K, listener: (...args: BushClientEvents[K]) => Awaitable<void>): this;
	// off<S extends string | symbol>(event: Exclude<S, keyof BushClientEvents>, listener: (...args: any[]) => Awaitable<void>): this;

	removeAllListeners<K extends keyof BushClientEvents>(event?: K): this;
	// removeAllListeners<S extends string | symbol>(event?: Exclude<S, keyof BushClientEvents>): this;
}

export interface BushStats {
	/**
	 * The average cpu usage of the bot from the past 60 seconds.
	 */
	cpu: number | undefined;

	/**
	 * The total number of times any command has been used.
	 */
	commandsUsed: bigint;
}
