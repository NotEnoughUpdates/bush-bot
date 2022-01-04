import { BushCommand, ButtonPaginator, type BushMessage } from '#lib';
import { MessageActionRow, MessageButton, MessageEmbed, type ApplicationCommand, type Collection } from 'discord.js';
import { MessageButtonStyles } from 'discord.js/typings/enums';

export default class TestCommand extends BushCommand {
	public constructor() {
		super('test', {
			aliases: ['test'],
			category: 'dev',
			description: 'A command to test stuff.',
			usage: ['test [feature]'],
			examples: ['test lots of buttons', 'test buttons'],
			args: [
				{
					id: 'feature',
					description: 'The feature to test.',
					match: 'rest',
					prompt: 'start prompt',
					retry: 'retry prompt',
					optional: true,
					slashType: false
				}
			],
			superUserOnly: true,
			clientPermissions: (m) => util.clientSendAndPermCheck(m),
			userPermissions: []
		});
	}

	public override async exec(message: BushMessage, args: { feature: string }) {
		const responses = [
			'Yes master.',
			'Test it your self bitch, I am hungry.',
			'Give me a break.',
			'I am not your slave.',
			'I have done as you wished, now please feed me.',
			`Someone help me I am trapped in ${message.author.username}'s basement.`
		];
		if (!message.author.isOwner()) {
			return await message.util.reply(responses[Math.floor(Math.random() * responses.length)]);
		}

		if (['button', 'buttons'].includes(args?.feature?.toLowerCase())) {
			const ButtonRow = new MessageActionRow().addComponents(
				new MessageButton({ style: MessageButtonStyles.PRIMARY, customId: 'primaryButton', label: 'Primary' }),
				new MessageButton({ style: MessageButtonStyles.SECONDARY, customId: 'secondaryButton', label: 'Secondary' }),
				new MessageButton({ style: MessageButtonStyles.SUCCESS, customId: 'success', label: 'Success' }),
				new MessageButton({ style: MessageButtonStyles.DANGER, customId: 'danger', label: 'Danger' }),
				new MessageButton({ style: MessageButtonStyles.LINK, label: 'Link', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
			);
			return await message.util.reply({ content: 'buttons', components: [ButtonRow] });
		} else if (['embed', 'button embed'].includes(args?.feature?.toLowerCase())) {
			const embed = new MessageEmbed()
				.addField('Field Name', 'Field Content')
				.setAuthor({ name: 'Author', iconURL: 'https://www.w3schools.com/w3css/img_snowtops.jpg', url: 'https://google.com/' })
				.setColor(message.member?.displayColor ?? util.colors.default)
				.setDescription('Description')
				.setFooter({ text: 'Footer', iconURL: message.author.avatarURL() ?? undefined })
				.setURL('https://duckduckgo.com/')
				.setTimestamp()
				.setImage('https://media.sproutsocial.com/uploads/2017/02/10x-featured-social-media-image-size.png')
				.setThumbnail(
					'https://images.unsplash.com/photo-1501183007986-d0d080b147f9?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2134&q=80'
				)
				.setTitle('Title');

			const buttonRow = new MessageActionRow().addComponents(
				new MessageButton({
					style: MessageButtonStyles.LINK,
					label: 'Link',
					url: 'https://www.google.com/'
				})
			);
			return await message.util.reply({ content: 'Test', embeds: [embed], components: [buttonRow] });
		} else if (['lots of buttons'].includes(args?.feature?.toLowerCase())) {
			const ButtonRows: MessageActionRow[] = [];
			for (let a = 1; a <= 5; a++) {
				const row = new MessageActionRow();
				for (let b = 1; b <= 5; b++) {
					const id = (a + 5 * (b - 1)).toString();
					const button = new MessageButton({
						style: MessageButtonStyles.SECONDARY,
						customId: id,
						label: id
					});
					row.addComponents(button);
				}
				ButtonRows.push(row);
			}
			return await message.util.reply({ content: 'buttons', components: ButtonRows });
		} else if (['paginate'].includes(args?.feature?.toLowerCase())) {
			const embeds = [];
			for (let i = 1; i <= 5; i++) {
				embeds.push(new MessageEmbed().setDescription(i.toString()));
			}
			return await ButtonPaginator.send(message, embeds);
		} else if (['lots of embeds'].includes(args?.feature?.toLowerCase())) {
			const description = 'This is a description.';
			const _avatar = message.author.avatarURL({ dynamic: true }) ?? undefined;
			const author = { name: 'This is a author', iconURL: _avatar };
			const footer = { text: 'This is a footer', iconURL: _avatar };
			const fields = [];
			for (let i = 0; i < 25; i++) {
				fields.push({ name: `Field ${i}`, value: `Field Value ${i}` });
			}
			const c = util.colors;
			const o = { description, author, footer, fields, time: Date.now() };

			const embeds = [
				{ ...o, title: 'Embed Title 0', color: c.red },
				{ ...o, title: 'Embed Title 1', color: c.orange },
				{ ...o, title: 'Embed Title 2', color: c.gold },
				{ ...o, title: 'Embed Title 3', color: c.yellow },
				{ ...o, title: 'Embed Title 4', color: c.green },
				{ ...o, title: 'Embed Title 5', color: c.darkGreen },
				{ ...o, title: 'Embed Title 6', color: c.aqua },
				{ ...o, title: 'Embed Title 7', color: c.blue },
				{ ...o, title: 'Embed Title 8', color: c.purple },
				{ ...o, title: 'Embed Title 9', color: c.pink }
			];

			const ButtonRows: MessageActionRow[] = [];
			for (let a = 1; a <= 5; a++) {
				const row = new MessageActionRow();
				for (let b = 1; b <= 5; b++) {
					const id = (a + 5 * (b - 1)).toString();
					const button = new MessageButton({
						style: MessageButtonStyles.SECONDARY,
						customId: id,
						label: id
					});
					row.addComponents(button);
				}
				ButtonRows.push(row);
			}
			return await message.util.reply({ content: 'this is content', components: ButtonRows, embeds });
		} else if (['delete slash commands'].includes(args?.feature?.toLowerCase())) {
			if (!message.guild) return await message.util.reply(`${util.emojis.error} This test can only be run in a guild.`);
			await client.guilds.fetch();
			const promises: Promise<Collection<string, ApplicationCommand>>[] = [];
			client.guilds.cache.each((guild) => {
				promises.push(guild.commands.set([]));
			});
			await Promise.all(promises);

			await client.application!.commands.fetch();
			await client.application!.commands.set([]);

			return await message.util.reply(`${util.emojis.success} Removed guild commands and global commands.`);
		} else if (['drop down', 'drop downs', 'select menu', 'select menus'].includes(args?.feature?.toLowerCase())) {
		}
		return await message.util.reply(responses[Math.floor(Math.random() * responses.length)]);
	}
}
