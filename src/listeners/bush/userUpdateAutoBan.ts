import { AllowedMentions, BushGuildMember, BushListener, type BushClientEvents, type BushTextChannel } from '#lib';

export default class UserUpdateAutoBanListener extends BushListener {
	public constructor() {
		super('userUpdateAutoBan', {
			emitter: 'client',
			event: 'userUpdate',
			category: 'bush'
		});
	}

	public override async exec(...[_oldUser, newUser]: BushClientEvents['userUpdate']): Promise<void> {
		if (!client.config.isProduction) return;

		if (newUser.username === 'NotEnoughUpdates') {
			const member = await client.guilds.cache
				.get(client.consts.mappings.guilds.bush)
				?.members.fetch(newUser.id)
				.catch(() => undefined);
			if (!member || !(member instanceof BushGuildMember)) return;

			const guild = member.guild;

			const res = await member.bushBan({
				reason: "[AutoBan] 'NotEnoughUpdates' is a blacklisted name for this server.",
				moderator: member.guild.me!
			});

			if (!['success', 'failed to dm'].includes(res)) {
				return await guild.error(
					'nameAutoBan',
					`Failed to autoban ${util.format.input(member.user.tag)} for 'NotEnoughUpdates', with error: ${util.format.input(res)}.`
				);
			}

			await guild
				.sendLogChannel('automod', {
					embeds: [
						{
							title: 'Name Auto Ban - User Update',
							description: `**User:** ${member.user} (${member.user.tag})\n **Action:** Banned for using the blacklisted name 'NotEnoughUpdates'.`,
							color: client.consts.colors.red,
							author: {
								name: member.user.tag,
								iconURL: member.displayAvatarURL({ dynamic: true })
							}
						}
					]
				})
				.catch(() => {});

			const content =
				res === 'failed to dm'
					? `${util.emojis.warn} Banned ${util.format.input(member.user.tag)} however I could not send them a dm.`
					: `${util.emojis.success} Successfully banned ${util.format.input(member.user.tag)}.`;

			(<BushTextChannel>guild.channels.cache.find((c) => c.name === 'general'))
				?.send({ content, allowedMentions: AllowedMentions.none() })
				.catch(() => {});
		}
	}
}
