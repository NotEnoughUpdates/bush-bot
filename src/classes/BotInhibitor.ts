import { Inhibitor } from 'discord-akairo'
import BotClient from '../client/BotClient'

export class BotInhibitor extends Inhibitor {
    public client = <BotClient> super.client;
}