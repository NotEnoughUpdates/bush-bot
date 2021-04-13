/* eslint-disable @typescript-eslint/no-empty-function */
import { Argument } from 'discord-akairo';
import { Message, Role, GuildMember } from 'discord.js';
import { BushCommand } from '../../lib/extensions/BushCommand';
import AllowedMentions from '../../lib/utils/AllowedMentions';

export default class RoleCommand extends BushCommand {
	private roleMap = [
		{ name: '*', id: '792453550768390194' },
		{ name: 'Admin Perms', id: '746541309853958186' },
		{ name: 'Sr. Moderator', id: '782803470205190164' },
		{ name: 'Moderator', id: '737308259823910992' },
		{ name: 'Helper', id: '737440116230062091' },
		{ name: 'Trial Helper', id: '783537091946479636' },
		{ name: 'Contributor', id: '694431057532944425' },
		{ name: 'Giveaway Donor', id: '784212110263451649' },
		{ name: 'Giveaway (200m)', id: '810267756426690601' },
		{ name: 'Giveaway (100m)', id: '801444430522613802' },
		{ name: 'Giveaway (50m)', id: '787497512981757982' },
		{ name: 'Giveaway (25m)', id: '787497515771232267' },
		{ name: 'Giveaway (10m)', id: '787497518241153025' },
		{ name: 'Giveaway (5m)', id: '787497519768403989' },
		{ name: 'Giveaway (1m)', id: '787497521084891166' },
		{ name: 'Suggester', id: '811922322767609877' },
		{ name: 'Partner', id: '767324547312779274' },
		{ name: 'Level Locked', id: '784248899044769792' },
		{ name: 'No Files', id: '786421005039173633' },
		{ name: 'No Reactions', id: '786421270924361789' },
		{ name: 'No Links', id: '786421269356740658' },
		{ name: 'No Bots', id: '786804858765312030' },
		{ name: 'No VC', id: '788850482554208267' },
		{ name: 'No Giveaways', id: '808265422334984203' },
		{ name: 'No Support', id: '790247359824396319' }
	];
	// prettier-ignore
	private roleWhitelist: Record<string, string[]> = {
		'Partner': ['*', 'Admin Perms', 'Sr. Moderator', 'Moderator'],
		'Suggester': ['*', 'Admin Perms', 'Sr. Moderator', 'Moderator', 'Helper', 'Trial Helper', 'Contributor'],
		'Level Locked': ['*', 'Admin Perms', 'Sr. Moderator', 'Moderator'],
		'No Files': ['*', 'Admin Perms', 'Sr. Moderator', 'Moderator'],
		'No Reactions': ['*', 'Admin Perms', 'Sr. Moderator', 'Moderator'],
		'No Links': ['*', 'Admin Perms', 'Sr. Moderator', 'Moderator'],
		'No Bots': ['*', 'Admin Perms', 'Sr. Moderator', 'Moderator'],
		'No VC': ['*', 'Admin Perms', 'Sr. Moderator', 'Moderator'],
		'No Giveaways': ['*', 'Admin Perms', 'Sr. Moderator', 'Moderator', 'Helper'],
		'No Support': ['*', 'Admin Perms', 'Sr. Moderator', 'Moderator'],
		'Giveaway Donor': ['*', 'Admin Perms', 'Sr. Moderator', 'Moderator'],
		'Giveaway (200m)': ['*', 'Admin Perms', 'Sr. Moderator', 'Moderator'],
		'Giveaway (100m)': ['*', 'Admin Perms', 'Sr. Moderator', 'Moderator'],
		'Giveaway (50m)': ['*', 'Admin Perms', 'Sr. Moderator', 'Moderator'],
		'Giveaway (25m)': ['*', 'Admin Perms', 'Sr. Moderator', 'Moderator'],
		'Giveaway (10m)': ['*', 'Admin Perms', 'Sr. Moderator', 'Moderator'],
		'Giveaway (5m)': ['*', 'Admin Perms', 'Sr. Moderator', 'Moderator'],
		'Giveaway (1m)': ['*', 'Admin Perms', 'Sr. Moderator', 'Moderator']
	};
	constructor() {
		super('role', {
			aliases: ['role'],
			category: "Moulberry's Bush",
			description: {
				content: 'Gives roles to users',
				usage: 'role <add|remove> <user> <role>',
				examples: ['role tyman adminperms']
			},
			clientPermissions: ['MANAGE_ROLES', 'EMBED_LINKS', 'SEND_MESSAGES'],
			channel: 'guild',
			typing: true
		});
	}
	*args(): unknown{
		const action: 'add'|'remove' = yield {
			id: 'action',
			type: Argument.union('add','remove'),
			prompt: {
				start: 'Would you like to `add` or `remove` a role?',
				retry: '<:no:787549684196704257> Choose whether you would you like to `add` or `remove` a role.'
			},
			unordered: false
		}
		let action2
		if (action === 'add') action2 = 'to';
		else if (action === 'remove') action2 = 'from';
		const user = yield {
			id: 'user',
			type: 'member',
			prompt: {
				start: `What user do you want to ${action} the role ${action2}?`,
				retry: `<:no:787549684196704257> Choose a valid user to ${action} the role ${action2}.`
			},
			unordered: true
		}
		const role = yield {
			id: 'role',
			type: 'role',
			prompt: {
				start: `What role do you want to add/remove?`,
				retry: '<:no:787549684196704257> Choose a valid role.'
			},
			unordered: true
		}
		return {action, user, role}
	}

	public async exec(message: Message, { action, user, role }: {action: 'add'|'remove', user: GuildMember; role: Role }): Promise<unknown> {
		if (!message.member.permissions.has('MANAGE_ROLES')) {
			let mappedRole: { name: string; id: string };
			for (let i = 0; i < this.roleMap.length; i++) {
				const a = this.roleMap[i];
				if (a.id == role.id) {
					mappedRole = a;
				}
			}
			if (!mappedRole || !this.roleWhitelist[mappedRole.name]) {
				await message.util.reply(`<:no:787549684196704257> <@&${role.id}> is not whitelisted, and you do not have manage roles permission.`, {
					allowedMentions: AllowedMentions.none()
				});
				return;
			}
			const allowedRoles = this.roleWhitelist[mappedRole.name].map(r => {
				for (let i = 0; i < this.roleMap.length; i++) {
					if (this.roleMap[i].name == r) {
						return this.roleMap[i].id;
					}
				}
				return;
			});
			if (!message.member.roles.cache.some(role => allowedRoles.includes(role.id))) {
				await message.util.reply(`<:no:787549684196704257> <@&${role.id}> is whitelisted, but you do not have any of the roles required to manage it.`, {
					allowedMentions: AllowedMentions.none()
				});
				return;
			}
			////if (message.member.roles.cache.some(r => r.id == role.id))
		} 
		if (action == 'remove') return removeRole();
		else if (action == 'add') return addRole();
		async function addRole(): Promise<Message> {
			const success = await user.roles.add(role.id).catch(() => {});
			if (success) return message.util.reply(`<:yes:787549618770149456> Successfully added <@&${role.id}> to <@!${user.id}>!`, { allowedMentions: AllowedMentions.none() });
			else return message.util.reply(`<:no:787549684196704257> Could not add <@&${role.id}> to <@&${user.id}>.`, { allowedMentions: AllowedMentions.none() });
		}
		async function removeRole(): Promise<Message> {
			const success = await user.roles.remove(role.id).catch(() => {});
			if (success)
				return message.util.reply(`<:yes:787549618770149456> Successfully removed <@&${role.id}> from <@!${user.id}>!`, { allowedMentions: AllowedMentions.none() });
			else return message.util.reply(`<:no:787549684196704257> Could not remove <@&${role.id}> from <@!${user.id}>.`, { allowedMentions: AllowedMentions.none() });
		}
	}
}
