import { BushListener, type BushClientEvents } from '#lib';
import { type TextChannel } from 'discord.js';

export default class BushLevelUpdateListener extends BushListener {
	public constructor() {
		super('bushLevelUpdate', {
			emitter: 'client',
			event: 'bushLevelUpdate',
			category: 'member-custom'
		});
	}

	public override async exec(...[member, _oldLevel, newLevel, _currentXp, message]: BushClientEvents['bushLevelUpdate']) {
		if (await message.guild.hasFeature('sendLevelUpMessages')) {
			void (async () => {
				const channel = ((await message.guild.channels
					.fetch((await message.guild.getSetting('levelUpChannel')) ?? message.channelId)
					.catch(() => null)) ?? message.channel) as TextChannel;

				const success = await channel
					.send(`${util.format.input(member.user.tag)} leveled up to level ${util.format.input(`${newLevel}`)}.`)
					.catch(() => null);

				if (!success) await client.console.warn('bushLevelUpdate', `Could not send level up message in ${message.guild}`);
			})();
		}
	}
}
