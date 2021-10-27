import { BushCommand, BushMessage } from '@lib';
import { MessageEmbed, User } from 'discord.js';

export default class MoulHammerCommand extends BushCommand {
	public constructor() {
		super('moulHammer', {
			aliases: ['moul-hammer'],
			category: "Moulberry's Bush",
			description: {
				content: 'A command to moul hammer members.',
				usage: ['moul-hammer <user>'],
				examples: ['moul-hammer @IRONM00N']
			},
			args: [
				{
					id: 'user',
					type: 'user',
					prompt: {
						start: 'What user would you like to moul hammer?',
						retry: '{error} Choose a valid user to moul hammer'
					}
				}
			],
			restrictedGuilds: ['516977525906341928'],
			clientPermissions: (m) => util.clientSendAndPermCheck(m, ['EMBED_LINKS'], true),
			userPermissions: []
		});
	}

	public override async exec(message: BushMessage, { user }: { user: User }) {
		await message.delete();
		const embed = new MessageEmbed()
			.setTitle('L')
			.setDescription(`${user.username} got moul'ed <:wideberry1:756223352598691942><:wideberry2:756223336832303154>`)
			.setColor(util.colors.purple);
		await message.util.send({ embeds: [embed] });
	}
}
