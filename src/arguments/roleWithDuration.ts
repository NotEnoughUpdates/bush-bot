import { type BushArgumentTypeCaster } from '#lib';
import { type Role } from 'discord.js';

export const roleWithDuration: BushArgumentTypeCaster<Promise<RoleWithDuration | null>> = async (message, phrase) => {
	// eslint-disable-next-line prefer-const
	let { duration, content } = client.util.parseDuration(phrase);
	if (content === null || content === undefined) return null;
	content = content.trim();
	const role = await util.arg.cast('role', message, content);
	if (!role) return null;
	return { duration, role };
};

export interface RoleWithDuration {
	duration: number | null;
	role: Role | null;
}
