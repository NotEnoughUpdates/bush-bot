import { Listener } from 'discord-akairo'
import { prefix } from '../../config/botoptions'

export default class ReadyListener extends Listener {
	public constructor() {
		super('ready', {
			emitter: 'client',
			event: 'ready',
			category: 'client'
		})
	}

	public exec(): void {
		console.log(`Logged in to ${this.client.user.tag}`)
		console.log('-----------------------------------------------------------------------------')
		this.client.user.setPresence({activity: {name: `My prefix is ${prefix} or just mention me`, type: 'PLAYING'}, status: 'online'})
	}
}