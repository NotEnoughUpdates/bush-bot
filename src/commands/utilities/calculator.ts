import { AllowedMentions, BushCommand, type BushMessage, type BushSlashMessage } from '#lib';
import assert from 'assert';
import { MessageEmbed } from 'discord.js';
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
					slashType: 'STRING'
				}
			],
			slash: true,
			clientPermissions: (m) => util.clientSendAndPermCheck(m),
			userPermissions: []
		});
	}
	public override async exec(message: BushMessage | BushSlashMessage, args: { expression: string }) {
		const decodedEmbed = new MessageEmbed().addField('📥 Input', await util.inspectCleanRedactCodeblock(args.expression, 'mma'));
		try {
			const calculated = /^(9\s*?\+\s*?10)|(10\s*?\+\s*?9)$/.test(args.expression) ? '21' : evaluate(args.expression);
			decodedEmbed
				.setTitle(`${util.emojis.successFull} Successfully Calculated Expression`)
				.setColor(util.colors.success)
				.addField('📤 Output', await util.inspectCleanRedactCodeblock(calculated.toString(), 'mma'));
		} catch (error) {
			decodedEmbed
				.setTitle(`${util.emojis.errorFull} Unable to Calculate Expression`)
				.setColor(util.colors.error)
				.addField(`📤 Error`, await util.inspectCleanRedactCodeblock(`${error.name}: ${error.message}`, 'js'));
		}
		return await message.util.reply({ embeds: [decodedEmbed], allowedMentions: AllowedMentions.none() });
	}
}
