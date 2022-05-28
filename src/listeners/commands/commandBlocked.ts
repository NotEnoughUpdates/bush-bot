import { BushListener, type BushCommand, type BushCommandHandlerEvents, type BushMessage, type BushSlashMessage } from '#lib';
import { type InteractionReplyOptions, type Message, type MessagePayload, type ReplyMessageOptions } from 'discord.js';

export default class CommandBlockedListener extends BushListener {
	public constructor() {
		super('commandBlocked', {
			emitter: 'commandHandler',
			event: 'commandBlocked',
			category: 'commands'
		});
	}

	public override async exec(...[message, command, reason]: BushCommandHandlerEvents['commandBlocked']) {
		return await CommandBlockedListener.handleBlocked(message, command, reason);
	}

	public static async handleBlocked(
		message: Message | BushMessage | BushSlashMessage,
		command: BushCommand | null,
		reason?: string
	) {
		const isSlash = !!command && !!message.util?.isSlash;

		void client.console.info(
			`${isSlash ? 'SlashC' : 'c'}ommandBlocked`,
			`<<${message.author.tag}>>${
				command ? ` tried to run <<${command}>> but` : "'s message"
			} was blocked because <<${reason}>>.`,
			true
		);
		const reasons = client.consts.BlockedReasons;

		switch (reason) {
			case reasons.OWNER: {
				return await respond({
					content: `${util.emojis.error} Only my developers can run the ${util.format.input(command!.id)} command.`,
					ephemeral: true
				});
			}
			case reasons.SUPER_USER: {
				return await respond({
					content: `${util.emojis.error} You must be a superuser to run the ${util.format.input(command!.id)} command.`,
					ephemeral: true
				});
			}
			case reasons.DISABLED_GLOBAL: {
				return await respond({
					content: `${util.emojis.error} My developers disabled the ${util.format.input(command!.id)} command.`,
					ephemeral: true
				});
			}
			case reasons.DISABLED_GUILD: {
				return await respond({
					content: `${util.emojis.error} The ${util.format.input(
						command!.id
					)} command is currently disabled in ${util.format.input(message.guild!.name)}.`,
					ephemeral: true
				});
			}
			case reasons.CHANNEL_GLOBAL_BLACKLIST:
			case reasons.CHANNEL_GUILD_BLACKLIST:
				return isSlash
					? await respond({
							content: `${util.emojis.error} You cannot use this bot in this channel.`,
							ephemeral: true
					  })
					: await (message as BushMessage).react(util.emojis.cross);
			case reasons.USER_GLOBAL_BLACKLIST:
			case reasons.USER_GUILD_BLACKLIST:
				return isSlash
					? await respond({
							content: `${util.emojis.error} You are blacklisted from using this bot.`,
							ephemeral: true
					  })
					: await (message as BushMessage).react(util.emojis.cross);
			case reasons.ROLE_BLACKLIST: {
				return isSlash
					? await respond({
							content: `${util.emojis.error} One of your roles blacklists you from using this bot.`,
							ephemeral: true
					  })
					: await (message as BushMessage).react(util.emojis.cross);
			}
			case reasons.RESTRICTED_CHANNEL: {
				if (!command) break;
				const channels = command.restrictedChannels;
				const names: string[] = [];
				channels!.forEach((c) => {
					names.push(`<#${c}>`);
				});
				const pretty = util.oxford(names, 'and');
				return await respond({
					content: `${util.emojis.error} ${util.format.input(command!.id)} can only be run in ${pretty}.`,
					ephemeral: true
				});
			}
			case reasons.RESTRICTED_GUILD: {
				if (!command) break;
				const guilds = command.restrictedGuilds;
				const names = guilds!.map((g) => util.format.input(client.guilds.cache.get(g)?.name ?? g));
				const pretty = util.oxford(names, 'and');
				return await respond({
					content: `${util.emojis.error} ${util.format.input(command!.id)} can only be run in ${pretty}.`,
					ephemeral: true
				});
			}
			default: {
				return await respond({
					content: `${util.emojis.error} Command blocked with reason ${util.format.input(reason ?? 'unknown')}.`,
					ephemeral: true
				});
			}
		}

		// some inhibitors do not have message.util yet
		function respond(content: string | MessagePayload | ReplyMessageOptions | InteractionReplyOptions) {
			return message.util
				? message.util.reply(<string | MessagePayload | ReplyMessageOptions>content)
				: message.reply(<string | MessagePayload | (ReplyMessageOptions & InteractionReplyOptions)>content);
		}
	}
}
