import { BushListener, BushMessage } from '@lib';
import { ClientEvents, Message } from 'discord.js';

export default class AutomodMessageUpdateListener extends BushListener {
	public constructor() {
		super('automodUpdate', {
			emitter: 'client',
			event: 'messageUpdate',
			category: 'message'
		});
	}

	async exec(...[message]: ClientEvents['messageUpdate']): Promise<void> {
		const fullMessage = message.partial ? await message.fetch() : (message as Message);
		return await this.client.util.automod(fullMessage as BushMessage);
	}
}