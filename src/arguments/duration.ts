import { BushArgumentTypeCaster } from '../lib/extensions/BushArgumentTypeCaster';
import { BushMessage } from '../lib/extensions/BushMessage';
import { BushConstants } from '../lib/utils/BushConstants';

export const durationTypeCaster: BushArgumentTypeCaster = async (_message: BushMessage, phrase): Promise<number> => {
	if (!phrase) return null;

	const regexString = Object.entries(BushConstants.TimeUnits)
		.map(([name, { label }]) => String.raw`(?:(?<${name}>-?(?:\d+)?\.?\d+) *${label})?`)
		.join('\\s*');
	const match = new RegExp(`^${regexString}$`, 'i').exec(phrase);
	if (!match) return null;

	let milliseconds = 0;
	for (const key in match.groups) {
		const value = Number(match.groups[key] || 0);
		milliseconds += value * BushConstants.TimeUnits[key].value;
	}

	return milliseconds;
};