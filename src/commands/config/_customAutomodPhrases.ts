// import { BushCommand, type BushMessage, type BushSlashMessage } from '#lib';

// export default class CustomAutomodPhrasesCommand extends BushCommand {
// 	public constructor() {
// 		super('customAutomodPhrases', {
// 			aliases: ['custom-automod-phrases'],
// 			category: 'config',
// 			description: 'Configure additional phrases to be used for automod.',
// 			usage: ['custom-automod-phrases <requiredArg> [optionalArg]'],
// 			examples: ['custom-automod-phrases 1 2'],
// 			args: [
// 				{
// 					id: 'required_argument',
// 					type: 'string',
// 					description: 'This is the first argument.',
// 					prompt: 'What would you like to set your first argument to be?',
// 					retry: '{error} Pick a valid argument.',
// 					slashType: 'STRING'
// 				},
// 				{
// 					id: 'optional_argument',
// 					type: 'string',
// 					description: 'This is the second argument.',
// 					prompt: 'What would you like to set your second argument to be?',
// 					retry: '{error} Pick a valid argument.',
// 					optional: true,
// 					slashType: 'STRING'
// 				}
// 			],
// 			slash: true,
// 			channel: 'guild',
// 			clientPermissions: (m) => util.clientSendAndPermCheck(m),
// 			userPermissions: ['MANAGE_GUILD']
// 		});
// 	}

// 	public override async exec(
// 		message: BushMessage | BushSlashMessage,
// 		args: { required_argument: string; optional_argument: string }
// 	) {}
// }