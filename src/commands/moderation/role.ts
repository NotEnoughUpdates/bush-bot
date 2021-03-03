import { User } from 'discord.js';
import { MessageEmbed } from 'discord.js';
import { GuildMember } from 'discord.js';
import { Role } from 'discord.js';
import { Message } from 'discord.js';
import { BotCommand } from '../../extensions/BotCommand';

export default class RoleCommand extends BotCommand {
	private roleMap = [
		{ name: 'no giveaways', id: '808265422334984203' },
		{ name: '*', id: '792453550768390194' },
		{ name: 'admin perms', id: '746541309853958186' },
		{ name: 'sr mod', id: '782803470205190164' },
		{ name: 'mod', id: '737308259823910992' },
		{ name: 'trial helper', id: '783537091946479636' },
		{ name: 'helper', id: '737440116230062091' },
		{ name: 'no support', id: '790247359824396319' }
	]
	private roleWhitelist: Record<string, string[]> = {
		'no giveaways': [
			'*',
			'admin perms',
			'sr mod',
			'mod',
			'helper'
		],
		'no support': [
			'*',
			'admin perms',
			'sr mod',
			'mod'
		]
	}
	constructor() {
		super('role', {
			aliases: ['role'],
			description: {
				content: 'Gives roles to users',
				usage: 'role <user> <role>',
				examples: [
					'role tyman adminperms'
				]
			},
			clientPermissions: ['MANAGE_ROLES'],
			args: [
				{
					id: 'user',
					type: 'member',
					prompt: {
						start: 'What user do you want to add the role to?',
						retry: 'Invalid answer. What user do you want to add the role to?'
					}
				},
				{
					id: 'role',
					type: 'role',
					prompt: {
						start: 'What role do you want to add?',
						retry: 'Invalid answer. What role do you want to add?'
					},
					match: 'rest'
				}
			],
			channel: 'guild',
			typing: true
		})
	}
	public async exec(message: Message, { user, role }: { user: GuildMember, role: Role }): Promise<void> {
		if (!message.member.permissions.has('MANAGE_ROLES')) {
			const mappedRole = this.roleMap.find(r => r.id === role.id)
			if (!mappedRole || !this.roleWhitelist[mappedRole.name]) {
				await message.util.send(new MessageEmbed({
					title: 'Invalid role',
					description: 'This role is not whitelisted, and you do not have manage roles permission.',
					color: this.client.consts.ErrorColor
				}))
				return
			}
			const allowedRoles = this.roleWhitelist[mappedRole.name].map(r => this.roleMap[r])
			if (!message.member.roles.cache.some(r => allowedRoles.includes(r.id))) {
				await message.util.send(new MessageEmbed({
					title: 'No permission',
					description: 'This role is whitelisted, but you do not have any of the roles required to manage it	.',
					color: this.client.consts.ErrorColor
				}))
				return
			}
			user.roles.add(role.id)
			await message.util.send('Successfully added role!')
		} else {
			user.roles.add(role.id)
			await message.util.send('Successfully added role!')
		}
	}
}