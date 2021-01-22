import { Message, MessageEmbed, TextChannel } from 'discord.js';
import { BotListener } from '../../extensions/BotListener';

export default class AutoResponderListener extends BotListener {
	public constructor() {
		super('AutoResponderListener', {
			emitter: 'client',
			event: 'message',
			category: 'message',
		});
	}

	public async exec(message: Message): Promise<void> {
		const exemptRoles = [
			'782803470205190164', //Sr. Mod
			'737308259823910992', //Mod
			'746541309853958186', //admin perms
			'742165914148929536', //moul
			'737440116230062091', //helper
			'802173969821073440' //no auto respond
		]
		
		if (!message.guild) return;
		if (message.author.bot) return;
		if (message.content.toLowerCase().includes('broken') 
		|| message.content.toLowerCase().includes('not work') 
		|| message.content.toLowerCase().includes('working') 
		|| message.content.toLowerCase().includes('neu') 
		|| message.content.toLowerCase().includes('mod') 
		|| message.content.toLowerCase().includes('patch')) {
			if(message.member?.roles.cache.some(r => exemptRoles.includes(r.id))){
				return
			}else{
				await message.reply('Please download the latest patch from <#693586404256645231>.');
				return
			}
		} else if(message.content.toLowerCase().includes('sba')){
			if(!message.member?.roles.cache.some(r => exemptRoles.includes(r.id))){
				await message.reply('Please download sba\'s latest patch from <#783869135086944306>.');
				return
			}
		}else{
			return;
		}
	}
}
