import { Command } from 'discord-akairo';
// eslint-disable-next-line no-unused-vars
import { Message} from 'discord.js';

export default class Test2Command extends Command {
	public constructor() {
		super('test2', {
			aliases: ['test2'],
			category: 'owner',
			clientPermissions: ['EMBED_LINKS'],
			description: {
				content: 'Another testing command',
				usage: 'test2',
				examples: ['test2'],
			},
			ownerOnly: true,
		});
	}
	public async exec(message: Message): Promise<void> {
		await message.channel.send('owo');
	}
}
