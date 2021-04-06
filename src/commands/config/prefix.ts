import { BushCommand } from '../../lib/extensions/BushCommand';
import { Message } from 'discord.js';
import db from '../../constants/db';

export default class PrefixCommand extends BushCommand {
	constructor() {
		super('prefix', {
			aliases: ['prefix'],
			category: 'config',
			description: {
				content: "A command to change the bot's prefix.",
				usage: 'prefix [prefix]',
				examples: ['prefix ?']
			},
			args: [
				{
					id: 'prefix',
					match: 'content',
					prompt: {
						start: 'What would you like the new prefix to be?',
						retry: '<:no:787549684196704257> Choose a valid prefix',
						optional: true
					},
					default: '-'
				}
			],
			channel: 'guild',
			userPermissions: ['MANAGE_GUILD'],
			clientPermissions: ['SEND_MESSAGES']
		});
	}

	public async exec(message: Message, { prefix }: { prefix: string }): Promise<void> {
		const oldPrefix = await db.guildGet('prefix', message.guild.id, null);
		await db.guildUpdate('prefix', prefix, message.guild.id);
		if (oldPrefix) {
			message.util.reply(`Prefix changed from \`${oldPrefix}\` to \`${prefix}\``);
		} else {
			message.util.reply(`Prefix set to \`${prefix}\``);
		}
	}
}
