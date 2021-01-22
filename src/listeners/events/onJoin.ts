import { TextChannel } from 'discord.js';
import { GuildMember, MessageEmbed } from 'discord.js';
import { BotListener } from '../../extensions/BotListener';

export default class OnJoinListener extends BotListener {
	public constructor() {
		super('OnJoinListener', {
			emitter: 'client',
			event: 'guildMemberAdd',
			category: 'client',
		});
	}

	public async exec(member: GuildMember): Promise<void> {
		member.roles.add('783794633129197589', 'Auto Join Role')
		member.roles.add('801976603772321796', 'Auto Join Role')

		const memberCount = <TextChannel>this.client.channels.cache.get('785281831788216364')
		try{
			// eslint-disable-next-line no-irregular-whitespace
			memberCount.setName(`Members: ${memberCount.guild.memberCount}`)
		}catch(e){
			console.log(e)
		}
		const welcome = <TextChannel>this.client.channels.cache.get('737460457375268896')
		const embed: MessageEmbed = new MessageEmbed()
			.setDescription(`:slight_smile: \`${member.user.tag}\` joined the server. There are now ${welcome.guild.memberCount.toLocaleString()} members.`)
			.setColor('7ed321')
		welcome.send(embed)
	}
}
