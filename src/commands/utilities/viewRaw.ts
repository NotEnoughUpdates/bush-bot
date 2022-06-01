import { BushCommand, type ArgType, type BushMessage, type BushSlashMessage, type OptArgType } from '#lib';
import assert from 'assert';
import { ApplicationCommandOptionType, ChannelType, EmbedBuilder, Message, PermissionFlagsBits } from 'discord.js';

export default class ViewRawCommand extends BushCommand {
	public constructor() {
		super('view-raw', {
			aliases: ['view-raw', 'vr'],
			category: 'utilities',
			description: 'Shows raw information about a message.',
			usage: ['viewraw <message id> <channel>'],
			examples: ['viewraw 322862723090219008'],
			args: [
				{
					id: 'message',
					description: 'The message to view the raw content of.',
					type: util.arg.union('message', 'messageLink'),
					readableType: 'message|messageLink',
					prompt: 'What message would you like to view?',
					retry: '{error} Choose a valid message.',
					slashType: ApplicationCommandOptionType.String
				},
				{
					id: 'channel',
					description: 'The channel that the message is in.',
					type: util.arg.union('textChannel', 'newsChannel', 'threadChannel'),
					prompt: 'What channel is the message in?',
					retry: '{error} Choose a valid channel.',
					optional: true,
					slashType: ApplicationCommandOptionType.Channel,
					channelTypes: [
						ChannelType.GuildText,
						ChannelType.DM,
						ChannelType.GuildNews,
						ChannelType.GuildNewsThread,
						ChannelType.GuildPublicThread,
						ChannelType.GuildPrivateThread
					]
				},
				{
					id: 'json',
					description: 'Whether or not to view the raw JSON message data.',
					match: 'flag',
					flag: '--json',
					prompt: 'Would you like to view the raw JSON message data?',
					slashType: ApplicationCommandOptionType.Boolean,
					optional: true
				},
				{
					id: 'js',
					description: 'Whether or not to view the raw message data.',
					match: 'flag',
					flag: '--js',
					prompt: 'Would you like to view the raw message data?',
					slashType: ApplicationCommandOptionType.Boolean,
					optional: true
				}
			],
			slash: true,
			channel: 'guild',
			clientPermissions: (m) => util.clientSendAndPermCheck(m, [PermissionFlagsBits.EmbedLinks], true),
			userPermissions: []
		});
	}

	public override async exec(
		message: BushMessage | BushSlashMessage,
		args: {
			message: ArgType<'message'> | ArgType<'messageLink'>;
			channel: OptArgType<'textChannel'> | OptArgType<'newsChannel'> | OptArgType<'threadChannel'>;
			json: boolean;
			js: boolean;
		}
	) {
		assert(message.inGuild());

		args.channel ??= message.channel;

		const newMessage =
			args.message instanceof Message ? args.message : await args.channel!.messages.fetch(`${args.message}`).catch(() => null);
		if (!newMessage)
			return await message.util.reply(
				`${util.emojis.error} There was an error fetching that message, make sure that is a valid id and if the message is not in this channel, please provide a channel.`
			);

		const Embed = await ViewRawCommand.getRawData(newMessage, { json: args.json, js: args.js });

		return await message.util.reply({ embeds: [Embed] });
	}

	public static async getRawData(message: BushMessage, options: { json?: boolean; js: boolean }): Promise<EmbedBuilder> {
		const content =
			options.json || options.js
				? options.json
					? JSON.stringify(message.toJSON(), undefined, 2)
					: util.inspect(message.toJSON()) || '[No Content]'
				: message.content || '[No Content]';
		const lang = options.json ? 'json' : options.js ? 'js' : undefined;
		return new EmbedBuilder()
			.setFooter({ text: message.author.tag, iconURL: message.author.avatarURL() ?? undefined })
			.setTimestamp(message.createdTimestamp)
			.setColor(message.member?.roles?.color?.color ?? util.colors.default)
			.setTitle('Raw Message Information')
			.setDescription(await util.codeblock(content, 2048, lang));
	}
}
