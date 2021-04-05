import { Message, GuildMember } from 'discord.js';
import { BushCommand } from '../../lib/extensions/BushCommand';

export default class KickCommand extends BushCommand {
	public constructor() {
		super('kick', {
			aliases: ['kick'],
			category: 'moderation',
			description: {
				content: 'A command kick members.',
				usage: 'kick <user> [reason]',
				examples: ['kick @user bad smh']
			},
			clientPermissions: ['KICK_MEMBERS', 'EMBED_LINKS', 'SEND_MESSAGES'],
			userPermissions: ['KICK_MEMBERS'],
			args: [
				{
					id: 'member',
					type: 'member',
					prompt: {
						start: 'What user would you like to kick?',
						retry: '<:no:787549684196704257> Choose a valid user to kick.'
					}
				},
				{
					id: 'reason',
					type: 'string',
					prompt: {
						start: 'Why is the user getting kicked?',
						retry: '<:no:787549684196704257> Choose a valid kick reason.',
						optional: true
					},
					default: 'No reason specified.'
				}
			],
			channel: 'guild'
		});
	}
	public async exec(
		message: Message,
		{ member, reason }: { member: GuildMember; reason: string }
	): Promise<Message> {
		let reason1: string;
		if (reason == 'No reason specified.')
			reason1 = `No reason specified. Responsible moderator: ${message.author.username}`;
		else
			reason1 = `${reason}. Responsible moderator: ${message.author.username}`;
		if (
			message.member.roles.highest.position <= member.roles.highest.position &&
			!this.client.config.owners.includes(message.author.id)
		) {
			return message.util.reply(
				`<:no:787549684196704257> \`${member.user.tag}\` has higher role hierarchy than you.`
			);
		}
		if (!member?.kickable)
			return message.util.reply(
				`<:no:787549684196704257> \`${member.user.tag}\` has higher role hierarchy than me.`
			);
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		const kicked = await member.kick(reason1).catch(() => {});
		if (!kicked)
			return message.util.reply(
				`<:no:787549684196704257> There was an error kicking \`${member.user.tag}\`.`
			);
		else
			return message.util.reply(
				`<:yes:787549618770149456> \`${member.user.tag}\` has been kicked.`
			);
	}
}
