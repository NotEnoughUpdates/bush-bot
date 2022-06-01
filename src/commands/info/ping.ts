import { BushCommand, type BushMessage, type BushSlashMessage } from '#lib';
import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default class PingCommand extends BushCommand {
	public constructor() {
		super('ping', {
			aliases: ['ping'],
			category: 'info',
			description: 'Gets the latency of the bot',
			usage: ['ping'],
			examples: ['ping'],
			slash: true,
			clientPermissions: (m) => util.clientSendAndPermCheck(m, [PermissionFlagsBits.EmbedLinks], true),
			userPermissions: []
		});
	}

	public override async exec(message: BushMessage) {
		const timestamp1 = message.editedTimestamp ? message.editedTimestamp : message.createdTimestamp;
		const msg = await message.util.reply('Pong!');
		const timestamp2 = msg.editedTimestamp ? msg.editedTimestamp : msg.createdTimestamp;
		void this.command(message, timestamp2 - timestamp1);
	}

	public override async execSlash(message: BushSlashMessage) {
		const timestamp1 = message.createdTimestamp;
		const msg = (await message.util.reply({ content: 'Pong!', fetchReply: true })) as BushMessage;
		const timestamp2 = msg.editedTimestamp ? msg.editedTimestamp : msg.createdTimestamp;
		void this.command(message, timestamp2 - timestamp1);
	}

	private command(message: BushMessage | BushSlashMessage, msgLatency: number) {
		const botLatency = util.format.codeBlock(`${Math.round(msgLatency)}ms`);
		const apiLatency = util.format.codeBlock(`${Math.round(message.client.ws.ping)}ms`);
		const embed = new EmbedBuilder()
			.setTitle('Pong!  🏓')
			.addFields([
				{ name: 'Bot Latency', value: botLatency, inline: true },
				{ name: 'API Latency', value: apiLatency, inline: true }
			])
			.setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL() })
			.setColor(util.colors.default)
			.setTimestamp();
		return message.util.reply({
			content: null,
			embeds: [embed]
		});
	}
}
