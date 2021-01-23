import { BotCommand } from '../../extensions/BotCommand';
import { Message } from 'discord.js';

export default class PurgeCommand extends BotCommand {
	public constructor() {
		super('Purge', {
			aliases: ['Purge'],
			category: 'moderation',
			description: {
				content: 'A command to mass delete messages.',
				usage: 'Purge <messages>',
				examples: ['Purge'],
			},
			clientPermissions: ['MANAGE_MESSAGES'],
			userPermissions: ['MANAGE_MESSAGES'],
			args: [
				{
					id: 'messages',
					type: 'number',
				},
			],
			ownerOnly: true,
		});
	}
	public async exec(message: Message /*, { number }: {number: number}*/): Promise<void> {
		/*if(number > 100)
			number = 100*/
		await message.util.send('Not done, smh.');
	}
}
