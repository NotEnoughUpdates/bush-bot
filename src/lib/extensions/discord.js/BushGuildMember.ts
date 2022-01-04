/* eslint-disable @typescript-eslint/no-unused-vars */
import {
	BushClientEvents,
	Moderation,
	ModLogType,
	type BushClient,
	type BushGuild,
	type BushGuildTextBasedChannel,
	type BushGuildTextChannelResolvable,
	type BushRole,
	type BushThreadChannelResolvable,
	type BushUser
} from '#lib';
import { GuildMember, MessageEmbed, type Partialize, type Role } from 'discord.js';
import type { RawGuildMemberData } from 'discord.js/typings/rawDataTypes';
/* eslint-enable @typescript-eslint/no-unused-vars */

/**
 * Represents a member of a guild on Discord.
 */
export class BushGuildMember extends GuildMember {
	public declare readonly client: BushClient;
	public declare guild: BushGuild;
	public declare user: BushUser;

	public constructor(client: BushClient, data: RawGuildMemberData, guild: BushGuild) {
		super(client, data, guild);
	}

	/**
	 * Send a punishment dm to the user.
	 * @param punishment The punishment that the user has received.
	 * @param reason The reason the user to be punished.
	 * @param duration The duration of the punishment.
	 * @param sendFooter Whether or not to send the guild's punishment footer with the dm.
	 * @returns Whether or not the dm was sent successfully.
	 */
	public async bushPunishDM(punishment: string, reason?: string | null, duration?: number, sendFooter = true): Promise<boolean> {
		const ending = await this.guild.getSetting('punishmentEnding');
		const dmEmbed =
			ending && ending.length && sendFooter
				? new MessageEmbed().setDescription(ending).setColor(util.colors.newBlurple)
				: undefined;
		const dmSuccess = await this.send({
			content: `You have been ${punishment} in **${this.guild.name}** ${
				duration !== null && duration !== undefined ? (duration ? `for ${util.humanizeDuration(duration)} ` : 'permanently ') : ''
				// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
			}for **${reason?.trim() || 'No reason provided'}**.`,
			embeds: dmEmbed ? [dmEmbed] : undefined
		}).catch(() => false);
		return !!dmSuccess;
	}

	/**
	 * Warn the user, create a modlog entry, and send a dm to the user.
	 * @param options Options for warning the user.
	 * @returns An object with the result of the warning, and the case number of the warn.
	 * @emits {@link BushClientEvents.bushWarn}
	 */
	public async bushWarn(options: BushPunishmentOptions): Promise<{ result: WarnResponse; caseNum: number | null }> {
		let caseID: string | undefined = undefined;
		let dmSuccessEvent: boolean | undefined = undefined;
		const moderator = (await util.resolveNonCachedUser(options.moderator ?? this.guild.me))!;

		const ret = await (async (): Promise<{ result: WarnResponse; caseNum: number | null }> => {
			// add modlog entry
			const result = await Moderation.createModLogEntry(
				{
					type: ModLogType.WARN,
					user: this,
					moderator: moderator.id,
					reason: options.reason,
					guild: this.guild,
					evidence: options.evidence
				},
				true
			);
			caseID = result.log?.id;
			if (!result || !result.log) return { result: 'error creating modlog entry', caseNum: null };

			// dm user
			const dmSuccess = await this.bushPunishDM('warned', options.reason);
			dmSuccessEvent = dmSuccess;
			if (!dmSuccess) return { result: 'failed to dm', caseNum: result.caseNum };

			return { result: 'success', caseNum: result.caseNum };
		})();
		if (!(['error creating modlog entry'] as const).includes(ret.result))
			client.emit('bushWarn', this, moderator, this.guild, options.reason ?? undefined, caseID!, dmSuccessEvent!);
		return ret;
	}

	/**
	 * Add a role to the user, if it is a punishment create a modlog entry, and create a punishment entry if it is temporary or a punishment.
	 * @param options Options for adding a role to the user.
	 * @returns A status message for adding the add.
	 * @emits {@link BushClientEvents.bushPunishRole}
	 */
	public async bushAddRole(options: AddRoleOptions): Promise<AddRoleResponse> {
		const ifShouldAddRole = this.#checkIfShouldAddRole(options.role, options.moderator);
		if (ifShouldAddRole !== true) return ifShouldAddRole;

		let caseID: string | undefined = undefined;
		const moderator = (await util.resolveNonCachedUser(options.moderator ?? this.guild.me))!;

		const ret = await (async () => {
			if (options.addToModlog || options.duration) {
				const { log: modlog } = await Moderation.createModLogEntry({
					type: options.duration ? ModLogType.TEMP_PUNISHMENT_ROLE : ModLogType.PERM_PUNISHMENT_ROLE,
					guild: this.guild,
					moderator: moderator.id,
					user: this,
					reason: 'N/A',
					pseudo: !options.addToModlog,
					evidence: options.evidence
				});

				if (!modlog) return 'error creating modlog entry';
				caseID = modlog.id;

				if (options.addToModlog || options.duration) {
					const punishmentEntrySuccess = await Moderation.createPunishmentEntry({
						type: 'role',
						user: this,
						guild: this.guild,
						modlog: modlog.id,
						duration: options.duration,
						extraInfo: options.role.id
					});
					if (!punishmentEntrySuccess) return 'error creating role entry';
				}
			}

			const removeRoleSuccess = await this.roles.add(options.role, `${moderator.tag}`);
			if (!removeRoleSuccess) return 'error adding role';

			return 'success';
		})();
		if (
			!(['error adding role', 'error creating modlog entry', 'error creating role entry'] as const).includes(ret) &&
			options.addToModlog
		)
			client.emit(
				'bushPunishRole',
				this,
				moderator,
				this.guild,
				options.reason ?? undefined,
				caseID!,
				options.duration ?? 0,
				options.role as BushRole,
				options.evidence
			);
		return ret;
	}

	/**
	 * Remove a role from the user, if it is a punishment create a modlog entry, and destroy a punishment entry if it was temporary or a punishment.
	 * @param options Options for removing a role from the user.
	 * @returns A status message for removing the role.
	 * @emits {@link BushClientEvents.bushPunishRoleRemove}
	 */
	public async bushRemoveRole(options: RemoveRoleOptions): Promise<RemoveRoleResponse> {
		const ifShouldAddRole = this.#checkIfShouldAddRole(options.role, options.moderator);
		if (ifShouldAddRole !== true) return ifShouldAddRole;

		let caseID: string | undefined = undefined;
		const moderator = (await util.resolveNonCachedUser(options.moderator ?? this.guild.me))!;

		const ret = await (async () => {
			if (options.addToModlog) {
				const { log: modlog } = await Moderation.createModLogEntry({
					type: ModLogType.REMOVE_PUNISHMENT_ROLE,
					guild: this.guild,
					moderator: moderator.id,
					user: this,
					reason: 'N/A',
					evidence: options.evidence
				});

				if (!modlog) return 'error creating modlog entry';
				caseID = modlog.id;

				const punishmentEntrySuccess = await Moderation.removePunishmentEntry({
					type: 'role',
					user: this,
					guild: this.guild,
					extraInfo: options.role.id
				});

				if (!punishmentEntrySuccess) return 'error removing role entry';
			}

			const removeRoleSuccess = await this.roles.remove(options.role, `${moderator.tag}`);
			if (!removeRoleSuccess) return 'error removing role';

			return 'success';
		})();

		if (
			!(['error removing role', 'error creating modlog entry', 'error removing role entry'] as const).includes(ret) &&
			options.addToModlog
		)
			client.emit(
				'bushPunishRoleRemove',
				this,
				moderator,
				this.guild,
				options.reason ?? undefined,
				caseID!,
				options.role as BushRole,
				options.evidence
			);
		return ret;
	}

	/**
	 * Check whether or not a role should be added/removed from the user based on hierarchy.
	 * @param role The role to check if can be modified.
	 * @param moderator The moderator that is trying to add/remove the role.
	 * @returns `true` if the role should be added/removed or a string for the reason why it shouldn't.
	 */
	#checkIfShouldAddRole(
		role: BushRole | Role,
		moderator?: BushGuildMember
	): true | 'user hierarchy' | 'role managed' | 'client hierarchy' {
		if (moderator && moderator.roles.highest.position <= role.position && this.guild.ownerId !== this.user.id) {
			client.console.debug(`${this.roles.highest.position} <= ${role.position}`);
			return 'user hierarchy';
		} else if (role.managed) {
			return 'role managed';
		} else if (this.guild.me!.roles.highest.position <= role.position) {
			return 'client hierarchy';
		}
		return true;
	}

	/**
	 * Mute the user, create a modlog entry, creates a punishment entry, and dms the user.
	 * @param options Options for muting the user.
	 * @returns A status message for muting the user.
	 * @emits {@link BushClientEvents.bushMute}
	 */
	public async bushMute(options: BushTimedPunishmentOptions): Promise<MuteResponse> {
		// checks
		if (!this.guild.me!.permissions.has('MANAGE_ROLES')) return 'missing permissions';
		const muteRoleID = await this.guild.getSetting('muteRole');
		if (!muteRoleID) return 'no mute role';
		const muteRole = this.guild.roles.cache.get(muteRoleID);
		if (!muteRole) return 'invalid mute role';
		if (muteRole.position >= this.guild.me!.roles.highest.position || muteRole.managed) return 'mute role not manageable';

		let caseID: string | undefined = undefined;
		let dmSuccessEvent: boolean | undefined = undefined;
		const moderator = (await util.resolveNonCachedUser(options.moderator ?? this.guild.me))!;

		const ret = await (async () => {
			// add role
			const muteSuccess = await this.roles
				.add(muteRole, `[Mute] ${moderator.tag} | ${options.reason ?? 'No reason provided.'}`)
				.catch(async (e) => {
					await client.console.warn('muteRoleAddError', e);
					client.console.debug(e);
					return false;
				});
			if (!muteSuccess) return 'error giving mute role';

			// add modlog entry
			const { log: modlog } = await Moderation.createModLogEntry({
				type: options.duration ? ModLogType.TEMP_MUTE : ModLogType.PERM_MUTE,
				user: this,
				moderator: moderator.id,
				reason: options.reason,
				duration: options.duration,
				guild: this.guild,
				evidence: options.evidence
			});

			if (!modlog) return 'error creating modlog entry';
			caseID = modlog.id;

			// add punishment entry so they can be unmuted later
			const punishmentEntrySuccess = await Moderation.createPunishmentEntry({
				type: 'mute',
				user: this,
				guild: this.guild,
				duration: options.duration,
				modlog: modlog.id
			});

			if (!punishmentEntrySuccess) return 'error creating mute entry';

			// dm user
			const dmSuccess = await this.bushPunishDM('muted', options.reason, options.duration ?? 0);
			dmSuccessEvent = dmSuccess;

			if (!dmSuccess) return 'failed to dm';

			return 'success';
		})();

		if (!(['error giving mute role', 'error creating modlog entry', 'error creating mute entry'] as const).includes(ret))
			client.emit(
				'bushMute',
				this,
				moderator,
				this.guild,
				options.reason ?? undefined,
				caseID!,
				options.duration ?? 0,
				dmSuccessEvent!,
				options.evidence
			);
		return ret;
	}

	/**
	 * Unmute the user, create a modlog entry, remove the punishment entry, and dm the user.
	 * @param options Options for unmuting the user.
	 * @returns A status message for unmuting the user.
	 * @emits {@link BushClientEvents.bushUnmute}
	 */
	public async bushUnmute(options: BushPunishmentOptions): Promise<UnmuteResponse> {
		// checks
		if (!this.guild.me!.permissions.has('MANAGE_ROLES')) return 'missing permissions';
		const muteRoleID = await this.guild.getSetting('muteRole');
		if (!muteRoleID) return 'no mute role';
		const muteRole = this.guild.roles.cache.get(muteRoleID);
		if (!muteRole) return 'invalid mute role';
		if (muteRole.position >= this.guild.me!.roles.highest.position || muteRole.managed) return 'mute role not manageable';

		let caseID: string | undefined = undefined;
		let dmSuccessEvent: boolean | undefined = undefined;
		const moderator = (await util.resolveNonCachedUser(options.moderator ?? this.guild.me))!;

		const ret = await (async () => {
			// remove role
			const muteSuccess = await this.roles
				.remove(muteRole, `[Unmute] ${moderator.tag} | ${options.reason ?? 'No reason provided.'}`)
				.catch(async (e) => {
					await client.console.warn('muteRoleAddError', e?.stack || e);
					return false;
				});
			if (!muteSuccess) return 'error removing mute role';

			// add modlog entry
			const { log: modlog } = await Moderation.createModLogEntry({
				type: ModLogType.UNMUTE,
				user: this,
				moderator: moderator.id,
				reason: options.reason,
				guild: this.guild,
				evidence: options.evidence
			});

			if (!modlog) return 'error creating modlog entry';
			caseID = modlog.id;

			// remove mute entry
			const removePunishmentEntrySuccess = await Moderation.removePunishmentEntry({
				type: 'mute',
				user: this,
				guild: this.guild
			});

			if (!removePunishmentEntrySuccess) return 'error removing mute entry';

			// dm user
			const dmSuccess = await this.bushPunishDM('unmuted', options.reason, undefined, false);
			dmSuccessEvent = dmSuccess;

			if (!dmSuccess) return 'failed to dm';

			return 'success';
		})();

		if (!(['error removing mute role', 'error creating modlog entry', 'error removing mute entry'] as const).includes(ret))
			client.emit(
				'bushUnmute',
				this,
				moderator,
				this.guild,
				options.reason ?? undefined,
				caseID!,
				dmSuccessEvent!,
				options.evidence
			);
		return ret;
	}

	/**
	 * Kick the user, create a modlog entry, and dm the user.
	 * @param options Options for kicking the user.
	 * @returns A status message for kicking the user.
	 * @emits {@link BushClientEvents.bushKick}
	 */
	public async bushKick(options: BushPunishmentOptions): Promise<KickResponse> {
		// checks
		if (!this.guild.me?.permissions.has('KICK_MEMBERS') || !this.kickable) return 'missing permissions';

		let caseID: string | undefined = undefined;
		let dmSuccessEvent: boolean | undefined = undefined;
		const moderator = (await util.resolveNonCachedUser(options.moderator ?? this.guild.me))!;
		const ret = await (async () => {
			// dm user
			const dmSuccess = await this.bushPunishDM('kicked', options.reason);
			dmSuccessEvent = dmSuccess;

			// kick
			const kickSuccess = await this.kick(`${moderator?.tag} | ${options.reason ?? 'No reason provided.'}`).catch(() => false);
			if (!kickSuccess) return 'error kicking';

			// add modlog entry
			const { log: modlog } = await Moderation.createModLogEntry({
				type: ModLogType.KICK,
				user: this,
				moderator: moderator.id,
				reason: options.reason,
				guild: this.guild,
				evidence: options.evidence
			});
			if (!modlog) return 'error creating modlog entry';
			caseID = modlog.id;
			if (!dmSuccess) return 'failed to dm';
			return 'success';
		})();
		if (!(['error kicking', 'error creating modlog entry'] as const).includes(ret))
			client.emit(
				'bushKick',
				this,
				moderator,
				this.guild,
				options.reason ?? undefined,
				caseID!,
				dmSuccessEvent!,
				options.evidence
			);
		return ret;
	}

	/**
	 * Ban the user, create a modlog entry, create a punishment entry, and dm the user.
	 * @param options Options for banning the user.
	 * @returns A status message for banning the user.
	 * @emits {@link BushClientEvents.bushBan}
	 */
	public async bushBan(options: BushBanOptions): Promise<BanResponse> {
		// checks
		if (!this.guild.me!.permissions.has('BAN_MEMBERS') || !this.bannable) return 'missing permissions';

		let caseID: string | undefined = undefined;
		let dmSuccessEvent: boolean | undefined = undefined;
		const moderator = (await util.resolveNonCachedUser(options.moderator ?? this.guild.me))!;
		const ret = await (async () => {
			// dm user
			const dmSuccess = await this.bushPunishDM('banned', options.reason, options.duration ?? 0);
			dmSuccessEvent = dmSuccess;

			// ban
			const banSuccess = await this.ban({
				reason: `${moderator.tag} | ${options.reason ?? 'No reason provided.'}`,
				days: options.deleteDays
			}).catch(() => false);
			if (!banSuccess) return 'error banning';

			// add modlog entry
			const { log: modlog } = await Moderation.createModLogEntry({
				type: options.duration ? ModLogType.TEMP_BAN : ModLogType.PERM_BAN,
				user: this,
				moderator: moderator.id,
				reason: options.reason,
				duration: options.duration,
				guild: this.guild,
				evidence: options.evidence
			});
			if (!modlog) return 'error creating modlog entry';
			caseID = modlog.id;

			// add punishment entry so they can be unbanned later
			const punishmentEntrySuccess = await Moderation.createPunishmentEntry({
				type: 'ban',
				user: this,
				guild: this.guild,
				duration: options.duration,
				modlog: modlog.id
			});
			if (!punishmentEntrySuccess) return 'error creating ban entry';

			if (!dmSuccess) return 'failed to dm';
			return 'success';
		})();
		if (!(['error banning', 'error creating modlog entry', 'error creating ban entry'] as const).includes(ret))
			client.emit(
				'bushBan',
				this,
				moderator,
				this.guild,
				options.reason ?? undefined,
				caseID!,
				options.duration ?? 0,
				dmSuccessEvent!,
				options.evidence
			);
		return ret;
	}

	/**
	 * Prevents a user from speaking in a channel.
	 * @param options Options for blocking the user.
	 */
	public async bushBlock(options: BlockOptions): Promise<BlockResponse> {
		const _channel = this.guild.channels.resolve(options.channel);
		if (!_channel || (!_channel.isText() && !_channel.isThread())) return 'invalid channel';
		const channel = _channel as BushGuildTextBasedChannel;

		// checks
		if (!channel.permissionsFor(this.guild.me!)!.has('MANAGE_CHANNELS')) return 'missing permissions';

		let caseID: string | undefined = undefined;
		let dmSuccessEvent: boolean | undefined = undefined;
		const moderator = (await util.resolveNonCachedUser(options.moderator ?? this.guild.me))!;

		const ret = await (async () => {
			// change channel permissions
			const channelToUse = channel.isThread() ? channel.parent! : channel;
			const perm = channel.isThread() ? { SEND_MESSAGES_IN_THREADS: false } : { SEND_MESSAGES: false };
			const blockSuccess = await channelToUse.permissionOverwrites
				.edit(this, perm, { reason: `[Block] ${moderator.tag} | ${options.reason ?? 'No reason provided.'}` })
				.catch(() => false);
			if (!blockSuccess) return 'error blocking';

			// add modlog entry
			const { log: modlog } = await Moderation.createModLogEntry({
				type: options.duration ? ModLogType.TEMP_CHANNEL_BLOCK : ModLogType.PERM_CHANNEL_BLOCK,
				user: this,
				moderator: moderator.id,
				reason: options.reason,
				guild: this.guild,
				evidence: options.evidence
			});
			if (!modlog) return 'error creating modlog entry';
			caseID = modlog.id;

			// add punishment entry so they can be unblocked later
			const punishmentEntrySuccess = await Moderation.createPunishmentEntry({
				type: 'block',
				user: this,
				guild: this.guild,
				duration: options.duration,
				modlog: modlog.id,
				extraInfo: channel.id
			});
			if (!punishmentEntrySuccess) return 'error creating block entry';

			// dm user
			const dmSuccess = await this.send({
				content: `You have been blocked from <#${channel.id}> in **${this.guild.name}** ${
					options.duration !== null && options.duration !== undefined
						? options.duration
							? `for ${util.humanizeDuration(options.duration)} `
							: 'permanently '
						: ''
					// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
				}for **${options.reason?.trim() || 'No reason provided'}**.`
			}).catch(() => false);
			dmSuccessEvent = !!dmSuccess;

			if (!dmSuccess) return 'failed to dm';

			return 'success';
		})();

		if (!(['error creating modlog entry', 'error creating block entry', 'error blocking'] as const).includes(ret))
			client.emit(
				'bushBlock',
				this,
				moderator,
				this.guild,
				options.reason ?? undefined,
				caseID!,
				options.duration ?? 0,
				dmSuccessEvent!,
				channel,
				options.evidence
			);
		return ret;
	}

	/**
	 * Allows a user to speak in a channel.
	 * @param options Options for unblocking the user.
	 */
	public async bushUnblock(options: UnblockOptions): Promise<UnblockResponse> {
		const _channel = this.guild.channels.resolve(options.channel);
		if (!_channel || (!_channel.isText() && !_channel.isThread())) return 'invalid channel';
		const channel = _channel as BushGuildTextBasedChannel;

		// checks
		if (!channel.permissionsFor(this.guild.me!)!.has('MANAGE_CHANNELS')) return 'missing permissions';

		let caseID: string | undefined = undefined;
		let dmSuccessEvent: boolean | undefined = undefined;
		const moderator = (await util.resolveNonCachedUser(options.moderator ?? this.guild.me))!;

		const ret = await (async () => {
			// change channel permissions
			const channelToUse = channel.isThread() ? channel.parent! : channel;
			const perm = channel.isThread() ? { SEND_MESSAGES_IN_THREADS: null } : { SEND_MESSAGES: null };
			const blockSuccess = await channelToUse.permissionOverwrites
				.edit(this, perm, { reason: `[Unblock] ${moderator.tag} | ${options.reason ?? 'No reason provided.'}` })
				.catch(() => false);
			if (!blockSuccess) return 'error unblocking';

			// add modlog entry
			const { log: modlog } = await Moderation.createModLogEntry({
				type: ModLogType.CHANNEL_UNBLOCK,
				user: this,
				moderator: moderator.id,
				reason: options.reason,
				guild: this.guild,
				evidence: options.evidence
			});
			if (!modlog) return 'error creating modlog entry';
			caseID = modlog.id;

			// remove punishment entry
			const punishmentEntrySuccess = await Moderation.removePunishmentEntry({
				type: 'block',
				user: this,
				guild: this.guild,
				extraInfo: channel.id
			});
			if (!punishmentEntrySuccess) return 'error removing block entry';

			// dm user
			const dmSuccess = await this.send({
				content: `You have been unblocked from <#${channel.id}> in **${this.guild.name}** for **${
					// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
					options.reason?.trim() || 'No reason provided'
				}**.`
			}).catch(() => false);
			dmSuccessEvent = !!dmSuccess;

			if (!dmSuccess) return 'failed to dm';

			return 'success';
		})();

		if (!(['error creating modlog entry', 'error removing block entry', 'error unblocking'] as const).includes(ret))
			client.emit(
				'bushUnblock',
				this,
				moderator,
				this.guild,
				options.reason ?? undefined,
				caseID!,
				dmSuccessEvent!,
				channel,
				options.evidence
			);
		return ret;
	}

	/**
	 * Mutes a user using discord's timeout feature.
	 * @param options Options for timing out the user.
	 */
	public async bushTimeout(options: BushTimeoutOptions): Promise<TimeoutResponse> {
		// checks
		if (!this.guild.me!.permissions.has('MODERATE_MEMBERS')) return 'missing permissions';

		const twentyEightDays = client.consts.timeUnits.days.value * 28;
		if (options.duration > twentyEightDays) return 'duration too long';

		let caseID: string | undefined = undefined;
		let dmSuccessEvent: boolean | undefined = undefined;
		const moderator = (await util.resolveNonCachedUser(options.moderator ?? this.guild.me))!;

		const ret = await (async () => {
			// timeout
			const timeoutSuccess = await this.timeout(
				options.duration,
				`${moderator.tag} | ${options.reason ?? 'No reason provided.'}`
			).catch(() => false);
			if (!timeoutSuccess) return 'error timing out';

			// add modlog entry
			const { log: modlog } = await Moderation.createModLogEntry({
				type: ModLogType.TIMEOUT,
				user: this,
				moderator: moderator.id,
				reason: options.reason,
				duration: options.duration,
				guild: this.guild,
				evidence: options.evidence
			});

			if (!modlog) return 'error creating modlog entry';
			caseID = modlog.id;

			// dm user
			const dmSuccess = await this.bushPunishDM('timed out', options.reason, options.duration);
			dmSuccessEvent = dmSuccess;

			if (!dmSuccess) return 'failed to dm';

			return 'success';
		})();

		if (!(['error timing out', 'error creating modlog entry'] as const).includes(ret))
			client.emit(
				'bushTimeout',
				this,
				moderator,
				this.guild,
				options.reason ?? undefined,
				caseID!,
				options.duration ?? 0,
				dmSuccessEvent!,
				options.evidence
			);
		return ret;
	}

	/**
	 * Removes a timeout from a user.
	 * @param options Options for removing the timeout.
	 */
	public async bushRemoveTimeout(options: BushPunishmentOptions): Promise<RemoveTimeoutResponse> {
		// checks
		if (!this.guild.me!.permissions.has('MODERATE_MEMBERS')) return 'missing permissions';

		let caseID: string | undefined = undefined;
		let dmSuccessEvent: boolean | undefined = undefined;
		const moderator = (await util.resolveNonCachedUser(options.moderator ?? this.guild.me))!;

		const ret = await (async () => {
			// remove timeout
			const timeoutSuccess = await this.timeout(null, `${moderator.tag} | ${options.reason ?? 'No reason provided.'}`).catch(
				() => false
			);
			if (!timeoutSuccess) return 'error removing timeout';

			// add modlog entry
			const { log: modlog } = await Moderation.createModLogEntry({
				type: ModLogType.REMOVE_TIMEOUT,
				user: this,
				moderator: moderator.id,
				reason: options.reason,
				guild: this.guild,
				evidence: options.evidence
			});

			if (!modlog) return 'error creating modlog entry';
			caseID = modlog.id;

			// dm user
			const dmSuccess = await this.bushPunishDM('un timed out', options.reason);
			dmSuccessEvent = dmSuccess;

			if (!dmSuccess) return 'failed to dm';

			return 'success';
		})();

		if (!(['error removing timeout', 'error creating modlog entry'] as const).includes(ret))
			client.emit(
				'bushRemoveTimeout',
				this,
				moderator,
				this.guild,
				options.reason ?? undefined,
				caseID!,
				dmSuccessEvent!,
				options.evidence
			);
		return ret;
	}

	/**
	 * Whether or not the user is an owner of the bot.
	 */
	public isOwner(): boolean {
		return client.isOwner(this);
	}

	/**
	 * Whether or not the user is a super user of the bot.
	 */
	public isSuperUser(): boolean {
		return client.isSuperUser(this);
	}
}

/**
 * Options for punishing a user.
 */
export interface BushPunishmentOptions {
	/**
	 * The reason for the punishment.
	 */
	reason?: string | null;

	/**
	 * The moderator who punished the user.
	 */
	moderator?: BushGuildMember;

	/**
	 * Evidence for the punishment.
	 */
	evidence?: string;
}

/**
 * Punishment options for punishments that can be temporary.
 */
export interface BushTimedPunishmentOptions extends BushPunishmentOptions {
	/**
	 * The duration of the punishment.
	 */
	duration?: number;
}

/**
 * Options for a role add punishment.
 */
export interface AddRoleOptions extends BushTimedPunishmentOptions {
	/**
	 * The role to add to the user.
	 */
	role: BushRole | Role;

	/**
	 * Whether to create a modlog entry for this punishment.
	 */
	addToModlog: boolean;
}

/**
 * Options for a role remove punishment.
 */
export interface RemoveRoleOptions extends BushTimedPunishmentOptions {
	/**
	 * The role to remove from the user.
	 */
	role: BushRole | Role;

	/**
	 * Whether to create a modlog entry for this punishment.
	 */
	addToModlog: boolean;
}

/**
 * Options for banning a user.
 */
export interface BushBanOptions extends BushTimedPunishmentOptions {
	/**
	 * The number of days to delete the user's messages for.
	 */
	deleteDays?: number;
}

/**
 * Options for blocking a user from a channel.
 */
export interface BlockOptions extends BushTimedPunishmentOptions {
	/**
	 * The channel to block the user from.
	 */
	channel: BushGuildTextChannelResolvable | BushThreadChannelResolvable;
}

/**
 * Options for unblocking a user from a channel.
 */
export interface UnblockOptions extends BushPunishmentOptions {
	/**
	 * The channel to unblock the user from.
	 */
	channel: BushGuildTextChannelResolvable | BushThreadChannelResolvable;
}

/**
 * Punishment options for punishments that can be temporary.
 */
export interface BushTimeoutOptions extends BushPunishmentOptions {
	/**
	 * The duration of the punishment.
	 */
	duration: number;
}

export type PunishmentResponse = 'success' | 'error creating modlog entry' | 'failed to dm';

/**
 * Response returned when warning a user.
 */
export type WarnResponse = PunishmentResponse;

/**
 * Response returned when adding a role to a user.
 */
export type AddRoleResponse =
	| Exclude<PunishmentResponse, 'failed to dm'>
	| 'user hierarchy'
	| 'role managed'
	| 'client hierarchy'
	| 'error creating role entry'
	| 'error adding role';

/**
 * Response returned when removing a role from a user.
 */
export type RemoveRoleResponse =
	| Exclude<PunishmentResponse, 'failed to dm'>
	| 'user hierarchy'
	| 'role managed'
	| 'client hierarchy'
	| 'error removing role entry'
	| 'error removing role';

/**
 * Response returned when muting a user.
 */
export type MuteResponse =
	| PunishmentResponse
	| 'missing permissions'
	| 'no mute role'
	| 'invalid mute role'
	| 'mute role not manageable'
	| 'error giving mute role'
	| 'error creating mute entry';

/**
 * Response returned when unmuting a user.
 */
export type UnmuteResponse =
	| PunishmentResponse
	| 'missing permissions'
	| 'no mute role'
	| 'invalid mute role'
	| 'mute role not manageable'
	| 'error removing mute role'
	| 'error removing mute entry';

/**
 * Response returned when kicking a user.
 */
export type KickResponse = PunishmentResponse | 'missing permissions' | 'error kicking';

/**
 * Response returned when banning a user.
 */
export type BanResponse = PunishmentResponse | 'missing permissions' | 'error creating ban entry' | 'error banning';

/**
 * Response returned when blocking a user.
 */
export type BlockResponse =
	| PunishmentResponse
	| 'invalid channel'
	| 'error creating block entry'
	| 'missing permissions'
	| 'error blocking';

/**
 * Response returned when unblocking a user.
 */
export type UnblockResponse =
	| PunishmentResponse
	| 'invalid channel'
	| 'error removing block entry'
	| 'missing permissions'
	| 'error unblocking';

/**
 * Response returned when timing out a user.
 */
export type TimeoutResponse = PunishmentResponse | 'missing permissions' | 'duration too long' | 'error timing out';

/**
 * Response returned when removing a timeout from a user.
 */
export type RemoveTimeoutResponse = PunishmentResponse | 'missing permissions' | 'duration too long' | 'error removing timeout';

export type PartialBushGuildMember = Partialize<BushGuildMember, 'joinedAt' | 'joinedTimestamp'>;

/**
 * @typedef {BushClientEvents} VSCodePleaseDontRemove
 */
