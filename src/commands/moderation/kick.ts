import { CommandInteraction, GuildMember, Message } from 'discord.js';
import { BushCommand } from '../../lib/extensions/discord-akairo/BushCommand';
import { BushSlashMessage } from '../../lib/extensions/discord-akairo/BushSlashMessage';
import { Guild, ModLog, ModLogType } from '../../lib/models';

export default class KickCommand extends BushCommand {
	public constructor() {
		super('kick', {
			aliases: ['kick'],
			category: 'moderation',
			args: [
				{
					id: 'user',
					type: 'member',
					prompt: {
						start: 'What user would you like to kick?',
						retry: '{error} Choose a valid user to kick.'
					}
				},
				{
					id: 'reason',
					type: 'string',
					match: 'restContent'
				}
			],
			clientPermissions: ['KICK_MEMBERS'],
			userPermissions: ['KICK_MEMBERS'],
			description: {
				content: 'Kick a member from the server.',
				usage: 'kick <member> <reason>',
				examples: ['kick @Tyman being cool']
			},
			slashOptions: [
				{
					type: 'USER',
					name: 'user',
					description: 'The user to kick',
					required: true
				},
				{
					type: 'STRING',
					name: 'reason',
					description: 'The reason to show in modlogs and audit log',
					required: false
				}
			],
			slash: true
		});
	}

	private async *genResponses(
		message: Message | CommandInteraction,
		user: GuildMember,
		reason?: string
	): AsyncIterable<string> {
		let modlogEnry: ModLog;
		// Create guild entry so postgres doesn't get mad when I try and add a modlog entry
		await Guild.findOrCreate({
			where: {
				id: message.guild.id
			},
			defaults: {
				id: message.guild.id
			}
		});
		try {
			modlogEnry = ModLog.build({
				user: user.id,
				guild: message.guild.id,
				moderator: message instanceof Message ? message.author.id : message.user.id,
				type: ModLogType.KICK,
				reason
			});
			await modlogEnry.save();
		} catch (e) {
			this.client.console.error(`KickCommand`, `Error saving to database. ${e?.stack}`);
			yield `${this.client.util.emojis.error} Error saving to database. Please report this to a developer.`;
			return;
		}
		try {
			await user.send(`You were kicked in ${message.guild.name} with reason \`${reason || 'No reason given'}\``);
		} catch (e) {
			yield `${this.client.util.emojis.warn} Unable to dm user`;
		}
		try {
			await user.kick(
				`Kicked by ${message instanceof Message ? message.author.tag : message.user.tag} with ${
					reason ? `reason ${reason}` : 'no reason'
				}`
			);
		} catch {
			yield `${this.client.util.emojis.error} Error kicking :/`;
			await modlogEnry.destroy();
			return;
		}
		yield `${this.client.util.emojis.success} Kicked <@!${user.id}> with reason \`${reason || 'No reason given'}\``;
	}

	async exec(message: Message, { user, reason }: { user: GuildMember; reason?: string }): Promise<void> {
		for await (const response of this.genResponses(message, user, reason)) {
			await message.util.send(response);
		}
	}

	async execSlash(message: BushSlashMessage, { user, reason }: { user: GuildMember; reason?: string }): Promise<void> {
		for await (const response of this.genResponses(message.interaction, user, reason)) {
			await message.interaction.reply(response);
		}
	}
}
