import { BushClientEvents, BushGuildMember, BushListener, BushTextChannel, PartialBushGuildMember, StickyRole } from '@lib';
import { MessageEmbed, Util } from 'discord.js';

export default class GuildMemberRemoveListener extends BushListener {
	public constructor() {
		super('guildMemberRemove', {
			emitter: 'client',
			event: 'guildMemberRemove',
			category: 'guild'
		});
	}

	public override async exec(...[member]: BushClientEvents['guildMemberRemove']) {
		void this.sendWelcomeMessage(member);
		void this.stickyRoles(member);
	}

	public async sendWelcomeMessage(member: BushGuildMember | PartialBushGuildMember) {
		if (client.config.isDevelopment) return;
		const user = member.partial ? await client.users.fetch(member.id) : member.user;
		await util.sleep(0.05); // ban usually triggers after member leave
		const isBan = member.guild.bans.cache.has(member.id);
		const welcomeChannel = await member.guild.getSetting('welcomeChannel');
		if (!welcomeChannel) return;
		const welcome = client.channels.cache.get(welcomeChannel) as BushTextChannel | undefined;
		if (member.guild.id !== welcome?.guild.id) throw new Error('Welcome channel must be in the guild.');
		const embed: MessageEmbed = new MessageEmbed()
			.setDescription(
				`${util.emojis.leave} **${util.sanitizeWtlAndControl(Util.escapeBold(user.tag))}** ${
					isBan ? 'got banned from' : 'left'
				} the server. There are now ${welcome.guild.memberCount.toLocaleString()} members.`
			)
			.setColor(isBan ? util.colors.orange : util.colors.red);
		welcome
			.send({ embeds: [embed] })
			.then(() =>
				client.console.info(
					'guildMemberRemove',
					`Sent a message for <<${util.sanitizeWtlAndControl(user.tag)}>> in <<${member.guild.name}>>.`
				)
			)
			.catch(() =>
				client.console.warn(
					'guildMemberRemove',
					`Failed to send message for <<${util.sanitizeWtlAndControl(user.tag)}>> in <<${member.guild.name}>>.`
				)
			);
	}

	public async stickyRoles(member: BushGuildMember | PartialBushGuildMember) {
		if (!(await member.guild.hasFeature('stickyRoles'))) return;
		if (member.partial) {
			await member.guild.members.fetch(); // try to prevent in the future
			throw new Error(`${member.id} is a partial member, cannot save sticky roles.`);
		}
		const rolesArray = member.roles.cache.filter((role) => role.name !== '@everyone').map((role) => role.id);
		const nickname = member.nickname;
		if (rolesArray) {
			const [row, isNew] = await StickyRole.findOrBuild({
				where: {
					user: member.user.id,
					guild: member.guild.id
				},
				defaults: {
					user: member.user.id,
					guild: member.guild.id,
					roles: rolesArray
				}
			});
			row.roles = rolesArray;
			if (nickname) row.nickname = nickname;
			await row
				.save()
				.then(() =>
					client.console.info(
						'guildMemberRemove',
						`${isNew ? 'Created' : 'Updated'} info for <<${util.sanitizeWtlAndControl(member.user.tag)}>>.`
					)
				);
		}
	}
}
