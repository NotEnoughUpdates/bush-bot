import { BushInhibitor, type BushCommand, type BushMessage, type BushSlashMessage } from '#lib';

export default class DMInhibitor extends BushInhibitor {
	public constructor() {
		super('dm', {
			reason: 'dm',
			category: 'command',
			type: 'post',
			priority: 75
		});
	}

	public override async exec(message: BushMessage | BushSlashMessage, command: BushCommand): Promise<boolean> {
		if (command.channel === 'dm' && message.guild) {
			void client.console.verbose('dm', `Blocked message with id <<${message.id}>> from <<${message.author.tag}>> in <<${message.guild.name}>>.`)
			return true;
		}
		return false;
	}
}
