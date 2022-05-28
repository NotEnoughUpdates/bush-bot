import { BushListener } from '#lib';
import { Severity } from '@sentry/node';
import CommandErrorListener from '../commands/commandError.js';

export default class WarningListener extends BushListener {
	public constructor() {
		super('warning', {
			emitter: 'process',
			event: 'warning'
		});
	}

	public override async exec(error: Error) {
		if (error.name === 'ExperimentalWarning') return;

		client.sentry.captureException(error, {
			level: Severity.Warning
		});

		void client.console.warn('warning', `A warning occurred:\n${util.formatError(error)}`, false);
		void client.console.channelError({
			embeds: [
				(await CommandErrorListener.generateErrorEmbed({ type: 'unhandledRejection', error: error }))
					.setColor(util.colors.warn)
					.setTitle('A Warning Occurred')
			]
		});
	}
}
