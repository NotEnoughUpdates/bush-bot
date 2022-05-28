import { BushCommand, type BushMessage } from '#lib';
import assert from 'assert';
import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import got from 'got';

assert(got);

export default class ServerStatusCommand extends BushCommand {
	public constructor() {
		super('serverStatus', {
			aliases: ['server-status', 'ss'],
			category: "Moulberry's Bush",
			description: "Gives the status of moulberry's server",
			usage: ['server-status'],
			examples: ['server-status', 'ss'],
			clientPermissions: (m) => util.clientSendAndPermCheck(m, [PermissionFlagsBits.EmbedLinks], true),
			userPermissions: [],
			slash: true
		});
	}

	public override async exec(message: BushMessage) {
		const msgEmbed = new EmbedBuilder()
			.setTitle('Server status')
			.setDescription(`Checking server:\n${util.emojis.loading}`)
			.setColor(util.colors.default)
			.setFooter({ text: 'Checking https://moulberry.codes/lowestbin.json' });
		await message.util.reply({ embeds: [msgEmbed] });
		let main;
		try {
			await got.get('https://moulberry.codes/lowestbin.json').json();
			main = util.emojis.success;
		} catch (e) {
			main = util.emojis.error;
		}
		await message.util.edit({ embeds: [msgEmbed.setDescription(`Checking server:\n${main}`)] });
		if (main == util.emojis.success) {
			await message.util.edit({
				embeds: [
					msgEmbed
						.addFields([{ name: 'Status', value: 'The server is online, all features related to prices will likely work.' }])
						.setColor(util.colors.success)
				]
			});
		} else {
			await message.util.edit({
				embeds: [
					msgEmbed
						.addFields([
							{
								name: 'Status',
								value:
									"It appears Moulberry's server is offline, this means that everything related to prices will likely not work."
							}
						])
						.setColor(util.colors.error)
				]
			});
		}
	}
}
