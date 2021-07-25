const roleMap = [
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

const roleWhitelist: Record<string, string[]> = {
	Partner: ['*', 'Admin Perms', 'Sr. Moderator', 'Moderator'],
	Suggester: ['*', 'Admin Perms', 'Sr. Moderator', 'Moderator', 'Helper', 'Trial Helper', 'Contributor'],
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

export = {
	roleMap,
	roleWhitelist
};