import {
	Arg,
	BushCommand,
	ButtonPaginator,
	chunk,
	clientSendAndPermCheck,
	colors,
	emojis,
	humanizeDuration,
	ModLog,
	timestamp,
	userGuildPermCheck,
	type ArgType,
	type CommandMessage,
	type SlashMessage
} from '#lib';
import assert from 'assert';
import { ApplicationCommandOptionType, escapeMarkdown, PermissionFlagsBits, User } from 'discord.js';

export default class ModlogCommand extends BushCommand {
	public static separator = '\n━━━━━━━━━━━━━━━\n';

	public constructor() {
		super('modlog', {
			aliases: ['modlog', 'modlogs'],
			category: 'moderation',
			description: "View a user's modlogs, or view a specific case.",
			usage: ['modlogs <search> [--hidden]'],
			examples: ['modlogs @Tyman'],
			args: [
				{
					id: 'search',
					description: 'The case id or user to search for modlogs by.',
					type: Arg.union('user', 'string'),
					prompt: 'What case id or user would you like to see?',
					retry: '{error} Choose a valid case id or user.',
					slashType: ApplicationCommandOptionType.String
				},
				{
					id: 'hidden',
					description: 'Show hidden modlogs.',
					prompt: 'Would you like to see hidden modlogs?',
					match: 'flag',
					flag: ['--hidden', '-h'],
					default: false,
					optional: true,
					slashType: ApplicationCommandOptionType.Boolean
				}
			],
			slash: true,
			channel: 'guild',
			clientPermissions: (m) => clientSendAndPermCheck(m),
			userPermissions: (m) => userGuildPermCheck(m, [PermissionFlagsBits.ManageMessages])
		});
	}

	public override async exec(
		message: CommandMessage | SlashMessage,
		{ search, hidden }: { search: ArgType<'user'> | string; hidden: ArgType<'flag'> }
	) {
		assert(message.inGuild());

		const foundUser = search instanceof User ? search : await this.client.utils.resolveUserAsync(search);
		if (foundUser) {
			const logs = await ModLog.findAll({
				where: {
					guild: message.guild.id,
					user: foundUser.id
				},
				order: [['createdAt', 'ASC']]
			});
			const niceLogs = logs
				.filter((log) => !log.pseudo)
				.filter((log) => !(log.hidden && hidden))
				.map((log) => ModlogCommand.generateModlogInfo(log, false));
			if (!logs.length || !niceLogs.length)
				return message.util.reply(`${emojis.error} **${foundUser.tag}** does not have any modlogs.`);
			const chunked: string[][] = chunk(niceLogs, 4);
			const embedPages = chunked.map((chunk) => ({
				title: `${foundUser.tag}'s Mod Logs`,
				description: chunk.join(ModlogCommand.separator),
				color: colors.default
			}));
			return await ButtonPaginator.send(message, embedPages, undefined, true);
		} else if (search) {
			const entry = await ModLog.findByPk(search as string);
			if (!entry || entry.pseudo || (entry.hidden && !hidden))
				return message.util.send(`${emojis.error} That modlog does not exist.`);
			if (entry.guild !== message.guild.id) return message.util.reply(`${emojis.error} This modlog is from another server.`);
			const embed = {
				title: `Case ${entry.id}`,
				description: ModlogCommand.generateModlogInfo(entry, true),
				color: colors.default
			};
			return await ButtonPaginator.send(message, [embed]);
		}
	}

	public static generateModlogInfo(log: ModLog, showUser: boolean): string {
		const trim = (str: string): string => (str.endsWith('\n') ? str.substring(0, str.length - 1).trim() : str.trim());
		const modLog = [`**Case ID:** ${escapeMarkdown(log.id)}`, `**Type:** ${log.type.toLowerCase()}`];
		if (showUser) modLog.push(`**User:** <@!${log.user}>`);
		modLog.push(`**Moderator:** <@!${log.moderator}>`);
		if (log.duration) modLog.push(`**Duration:** ${humanizeDuration(log.duration)}`);
		modLog.push(`**Reason:** ${trim(log.reason ?? 'No Reason Specified.')}`);
		modLog.push(`**Date:** ${timestamp(log.createdAt)}`);
		if (log.evidence) modLog.push(`**Evidence:** ${trim(log.evidence)}`);
		return modLog.join(`\n`);
	}
}
