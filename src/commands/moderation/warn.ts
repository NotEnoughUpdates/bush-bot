import { AllowedMentions, BushCommand, BushGuildMember, BushMessage, BushSlashMessage, BushUser, Moderation } from '@lib';

export default class WarnCommand extends BushCommand {
	public constructor() {
		super('warn', {
			aliases: ['warn'],
			category: 'moderation',
			description: {
				content: 'Warn a user.',
				usage: ['warn <member> [reason]'],
				examples: ['warn @Tyman being cool']
			},
			args: [
				{
					id: 'user',
					type: 'user',
					prompt: {
						start: 'What user would you like to warn?',
						retry: '{error} Choose a valid user to warn.'
					}
				},
				{
					id: 'reason',
					match: 'rest',
					prompt: {
						start: 'Why should this user be warned?',
						retry: '{error} Choose a valid warn reason.',
						optional: true
					}
				},
				{
					id: 'force',
					flag: '--force',
					match: 'flag'
				}
			],
			slash: true,
			slashOptions: [
				{
					name: 'user',
					description: 'What user would you like to warn?',
					type: 'USER',
					required: true
				},
				{
					name: 'reason',
					description: 'Why should this user be warned?',
					type: 'STRING',
					required: false
				}
			],
			channel: 'guild',
			clientPermissions: (m) => util.clientSendAndPermCheck(m),
			userPermissions: (m) => util.userGuildPermCheck(m, ['MANAGE_MESSAGES'])
		});
	}

	public override async exec(
		message: BushMessage | BushSlashMessage,
		{ user, reason, force }: { user: BushUser; reason: string; force: boolean }
	) {
		const member = message.guild!.members.cache.get(user.id) as BushGuildMember;
		if (!member) return message.util.reply(`${util.emojis.error} I cannot warn users that are not in the server.`);
		const useForce = force && message.author.isOwner();
		if (!message.member) throw new Error(`message.member is null`);
		const canModerateResponse = await Moderation.permissionCheck(message.member, member, 'warn', true, useForce);

		if (canModerateResponse !== true) {
			return message.util.reply(canModerateResponse);
		}

		const { result: response, caseNum } = await member.warn({
			reason,
			moderator: message.member
		});

		const responseMessage = () => {
			const victim = util.format.bold(member.user.tag);
			switch (response) {
				case 'error creating modlog entry':
					return `${util.emojis.error} While warning ${victim}, there was an error creating a modlog entry, please report this to my developers.`;
				case 'failed to dm':
					return `${util.emojis.warn} ${victim} has been warned for the ${util.ordinal(
						caseNum ?? 0
					)} time, however I could not send them a dm.`;
				case 'success':
					return `${util.emojis.success} Successfully warned ${victim} for the ${util.ordinal(caseNum ?? 0)} time.`;
			}
		};
		return await message.util.reply({ content: responseMessage(), allowedMentions: AllowedMentions.none() });
	}
}
