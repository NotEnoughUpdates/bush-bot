import chalk from 'chalk';
import { BotListener } from '../../extensions/BotListener';
export default class ReadyListener extends BotListener {
	public constructor() {
		super('ready', {
			emitter: 'client',
			event: 'ready',
			category: 'client',
		});
	}

	public exec(): void {
		console.log(chalk.red(`Logged in to ${this.client.user.tag}`));
		console.log(chalk.blue('-----------------------------------------------------------------------------'));
		this.client.user.setPresence({
			activity: {
				name: 'Moulberry',
				type: 'WATCHING',
				//url: 'https://discord.gg/moulberry',
			},
			status: 'online',
		});
		
	}
}
