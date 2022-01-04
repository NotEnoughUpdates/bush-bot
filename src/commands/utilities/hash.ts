import { BushCommand, type BushMessage } from '#lib';
import assert from 'assert';
import crypto from 'crypto';
import got from 'got';
assert(crypto);
assert(got);

export default class HashCommand extends BushCommand {
	public constructor() {
		super('hash', {
			aliases: ['hash'],
			category: 'utilities',
			description: 'Gets the file hash of the given discord link',
			usage: ['hash <fileUrl>'],
			examples: ['hash https://cdn.discordapp.com/emojis/782630946435366942.png?v=1'], //nice
			args: [
				{
					id: 'url',
					description: 'The url of the discord link to find the hash of.',
					type: 'url',
					prompt: 'What url would you like to find the hash of?',
					retry: '{error} Enter a valid url.',
					slashType: 'STRING'
				}
			],
			clientPermissions: (m) => util.clientSendAndPermCheck(m),
			userPermissions: []
		});
	}

	public override async exec(message: BushMessage, { url }: { url: string }) {
		try {
			const req = await got.get(url);
			const rawHash = crypto.createHash('md5');
			rawHash.update(req.rawBody.toString('binary'));
			const hash = rawHash.digest('hex');
			await message.util.reply(`\`${hash}\``);
		} catch {
			await message.util.reply('Unable to calculate hash.');
		}
	}
}
