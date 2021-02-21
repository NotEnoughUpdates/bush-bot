import { BotCommand, PermissionLevel } from '../../extensions/BotCommand';
import { Message, User } from 'discord.js';
import functions from '../../constants/functions';

export default class SuperUserCommand extends BotCommand {
	public constructor() {
		super('superuser', {
			aliases: ['superuser', 'unsuperuser'],
			category: 'dev',
			description: {
				content: 'A command to add/remove superusers.',
				usage: 'superuser <user>',
				examples: ['superuser IRONM00N'],
			},
			args: [
				{
					id: 'user',
					type: 'user',
					match: 'content',
					prompt: {
						start: 'Which user would you like to change the superuser status of?',
					},
				},
			],
			permissionLevel: PermissionLevel.Owner,
		});
	}
	public async exec(message: Message, { user }: { user: User }): Promise<Message> {
		if (!(this.client.config.owners.includes(message.author.id))){ 
			return await message.channel.send('Only owners can use this command.')
		} 
		const superUsers: string[] = await functions.dbGet('global', 'superUsers') as string[];
		let action: string;
		if (superUsers.includes(user.id)){
			superUsers.splice(superUsers.indexOf(user.id), 1)
			await functions.dbUpdate('global', 'superUsers', superUsers)
			action = 'removed'
		} else {
			superUsers.push(user.id)
			await functions.dbUpdate('global', 'superUsers', superUsers)
			action = 'added'
		}
		let action2
		if (action == 'removed'){
			action2 = 'from'
		} else{
			action2 = 'to'
		}
		return await message.channel.send(`Successfully ${action} \`${user.tag}\` ${action2} the super users list.`)
	}
}
