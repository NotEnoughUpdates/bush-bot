import { BotCommand, PermissionLevel } from '../../extensions/BotCommand';
import { Message } from 'discord.js';

export default class SayCommand extends BotCommand {
	public constructor() {
		super('say', {
			aliases: ['say', 'dev'],
			category: 'dev',
			description: {
				content: 'A command make the bot say something.',
				usage: 'say <message>' /*[channel]'*/,
				examples: ['say hello' /*#general'*/]
			},
			args: [
				{
					id: 'say',
					type: 'string',
					match: 'content',
					prompt: {
						start: 'What would you like say',
						retry: '<:no:787549684196704257> Choose something valid to say.'
					}
				}
				/*{
					id: 'channel',
					type: 'channel',
				},*/
			],
			permissionLevel: PermissionLevel.Superuser
		});
	}
	public async exec(message: Message, { say }: { say: string }): Promise<void> {
		if (message.deletable) {
			await message.delete();
		}
		await message.util.send(say);
	}
}
