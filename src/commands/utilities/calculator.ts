import { AllowedMentions, BushCommand, type BushMessage, type BushSlashMessage } from '#lib';
import assert from 'assert';
import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import { evaluate } from 'mathjs';

assert(evaluate);

export default class CalculatorCommand extends BushCommand {
	public constructor() {
		super('calculator', {
			aliases: ['calculator', 'calc', 'math'],
			category: 'utilities',
			description: 'Calculates math expressions.',
			usage: ['calculator <expression>'],
			examples: ['calculator 9+10'],
			args: [
				{
					id: 'expression',
					description: 'The expression to calculate.',
					type: 'string',
					match: 'rest',
					prompt: 'What would you like to calculate?',
					retry: '{error} Pick something to calculate.',
					slashType: ApplicationCommandOptionType.String
				}
			],
			slash: true,
			clientPermissions: (m) => util.clientSendAndPermCheck(m),
			userPermissions: []
		});
	}

	public override async exec(message: BushMessage | BushSlashMessage, args: { expression: string }) {
		const decodedEmbed = new EmbedBuilder().addFields([
			{
				name: '📥 Input',
				value: await util.inspectCleanRedactCodeblock(args.expression, 'mma')
			}
		]);
		try {
			const calculated = /^(9\s*?\+\s*?10)|(10\s*?\+\s*?9)$/.test(args.expression) ? '21' : evaluate(args.expression);
			decodedEmbed
				.setTitle(`${util.emojis.successFull} Successfully Calculated Expression`)
				.setColor(util.colors.success)
				.addFields([{ name: '📤 Output', value: await util.inspectCleanRedactCodeblock(calculated.toString(), 'mma') }]);
		} catch (error) {
			decodedEmbed
				.setTitle(`${util.emojis.errorFull} Unable to Calculate Expression`)
				.setColor(util.colors.error)
				.addFields([
					{ name: `📤 Error`, value: await util.inspectCleanRedactCodeblock(`${error.name}: ${error.message}`, 'js') }
				]);
		}
		return await message.util.reply({ embeds: [decodedEmbed], allowedMentions: AllowedMentions.none() });
	}
}
