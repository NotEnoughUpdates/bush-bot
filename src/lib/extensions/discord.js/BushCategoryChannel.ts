import { BushNonThreadGuildBasedChannel, type BushClient, type BushGuild, type BushGuildMember } from '#lib';
import { CategoryChannel, type Collection, type Snowflake } from 'discord.js';
import { type RawGuildChannelData } from 'discord.js/typings/rawDataTypes';

/**
 * Represents a guild category channel on Discord.
 */
export class BushCategoryChannel extends CategoryChannel {
	public declare readonly client: BushClient;
	public declare readonly children: Collection<Snowflake, Exclude<BushNonThreadGuildBasedChannel, BushCategoryChannel>>;
	public declare guild: BushGuild;
	public declare readonly members: Collection<Snowflake, BushGuildMember>;
	public declare readonly parent: CategoryChannel | null;

	public constructor(guild: BushGuild, data?: RawGuildChannelData, client?: BushClient, immediatePatch?: boolean) {
		super(guild, data, client, immediatePatch);
	}
}
