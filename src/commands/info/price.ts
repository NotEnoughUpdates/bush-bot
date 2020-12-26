import { Command } from 'discord-akairo'
import { Message/*, MessageEmbed*/ } from 'discord.js'
import got from 'got/dist/source'

export default class PriceCommand extends Command {
	public constructor() {
		super('price', {
			aliases: ['price'],
			category: 'info',
			description: {
				usage: 'price [item id]',
				examples: [
					'price ASPECT_OF_THE_END'
				],
				content: 'Finds the lowest bin of an item.'
			},
			ratelimit: 4,
			cooldown: 4000,
			args : [
				{
					id: 'item',
					match: 'content',
					type: 'string',
					prompt: {
						start: 'What item would you like look up'
					}
				}
			],
			ownerOnly: true,
		})
	}
	public async exec(message: Message, { item }: { item: Command }): Promise<void> {
		
		try {
			JSON.parse((await got.get('http://51.75.78.252/lowestbin.json')).body)
			
		} catch(e){
			message.channel.send('error')
		}
		

		message.channel.send('.' + item)
		

	}
/**     
	public async exec(message: Message, { command }: { command: Command }): Promise<Message | Message[]> {

	} */
}