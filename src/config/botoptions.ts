export const prefix = '-';
export const owners = [
	'322862723090219008', //IRONM00N
	'464970779944157204', //TrashCan
	'487443883127472129', //Tyman
];
export const superUsers = [
	//not implemented yet
	'322862723090219008', //IRONM00N
	'464970779944157204', //TrashCan
	'487443883127472129', //Tyman
	'211288288055525376', //Moulberry
	'496409778822709251', //Bestower
];
export const errorChannel = '788231085125140480';
export const dmChannel = '783129374551572512';
export const channelBlacklist = [
	'793169920908984331', //general
	'714332750156660756', //NEU-Support-1
	'737414807250272258', //NEU-Support-2
];
export const userBlacklist = [
	'526796511309332481', // was spamming commands
	'454615922909380619', // same as above
];
export const roleBlacklist = [
	'786804858765312030', //no bot role
];
export const roleWhitelist = [
	//these roles override the channel blacklist
	'746541309853958186', //admin perms
	'737308259823910992', //mod
	'737440116230062091', //helper
];
export const autoPublishChannels = [
	//don't add every channel idiot
	'782464759165354004', //item repo github webhooks
	'693586404256645231', // neu updates i stg ironm00n if you remove this im forcing you to delete general again
];
export const generalLogChannel = '794646604887752704'; //not sure how to do this properly, currently I am getting the cache every time I have to send a message to the channel. Please lml if there is a way to do <TextChannel> this.client.channels.cache.get('794646604887752704') and make it work for the whole project.
