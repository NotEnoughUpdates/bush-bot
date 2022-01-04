import type {
	BushBaseGuildVoiceChannel,
	BushClient,
	BushMessageManager,
	BushTextBasedChannel,
	BushThreadChannel,
	BushUser
} from '#lib';
import { DMChannel } from 'discord.js';
import type { RawDMChannelData } from 'discord.js/typings/rawDataTypes';

/**
 * Represents a direct message channel between two users.
 */
export class BushDMChannel extends DMChannel {
	public declare readonly client: BushClient;
	public declare messages: BushMessageManager;
	public declare recipient: BushUser;

	public constructor(client: BushClient, data?: RawDMChannelData) {
		super(client, data);
	}
}

export interface BushDMChannel extends DMChannel {
	isText(): this is BushTextBasedChannel;
	isVoice(): this is BushBaseGuildVoiceChannel;
	isThread(): this is BushThreadChannel;
}
