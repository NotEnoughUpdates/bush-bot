import { AllowedMentions, BushCommand, BushMessage, BushSlashMessage, Level } from '@lib';
import { User } from 'discord.js';

export default class SetLevelCommand extends BushCommand {
	public constructor() {
		super('setLevel', {
			aliases: ['set-level'],
			category: 'leveling',
			description: {
				content: 'Sets the level of a user',
				usage: ['set-level <user> <level>'],
				examples: ['set-level @Moulberry 69'] //nice
			},
			args: [
				{
					id: 'user',
					type: 'user',
					prompt: {
						start: 'What user would you like to change the level of?',
						retry: '{error} Choose a valid user to change the level of.'
					}
				},
				{
					id: 'level',
					type: 'integer',
					prompt: {
						start: 'What level would you like to set the user to?',
						retry: '{error} Choose a valid level to set the user to.'
					}
				}
			],
			slashOptions: [
				{
					name: 'user',
					description: 'What user would you like to change the level of?',
					type: 'USER',
					required: true
				},
				{
					name: 'level',
					description: 'What level would you like to set the user to?',
					type: 'INTEGER',
					required: true
				}
			],
			slash: true,
			channel: 'guild',
			clientPermissions: (m) => util.clientSendAndPermCheck(m),
			userPermissions: ['ADMINISTRATOR']
		});
	}

	public override async exec(message: BushMessage | BushSlashMessage, { user, level }: { user: User; level: number }) {
		if (!message.guild) return await message.util.reply(`${util.emojis.error} This command can only be run in a guild.`);
		if (!user.id) throw new Error('user.id is null');

		if (isNaN(level))
			return await message.util.reply(`${util.emojis.error} Provide a valid number to set the user's level to.`);
		if (level > 6553 || level < 0)
			return await message.util.reply(`${util.emojis.error} You cannot set a level higher than \`6553\`.`);

		const [levelEntry] = await Level.findOrBuild({
			where: {
				user: user.id,
				guild: message.guild.id
			},
			defaults: {
				user: user.id,
				guild: message.guild.id,
				xp: 0
			}
		});
		await levelEntry.update({ xp: Level.convertLevelToXp(level), user: user.id, guild: message.guild.id });
		return await message.util.send({
			content: `Successfully set level of <@${
				user.id
			}> to \`${level.toLocaleString()}\` (\`${levelEntry.xp.toLocaleString()}\` XP)`,
			allowedMentions: AllowedMentions.none()
		});
	}
}
