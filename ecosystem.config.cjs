/* eslint-disable import/no-commonjs */
module.exports = {
	apps: [
		...['', '-beta'].map((e) => ({
			name: `bush-bot${e}`,
			script: 'yarn',
			args: 'start:raw',
			out_file: `../bushbot${e}.log`,
			error_file: `../bushbot${e}.log`,
			max_memory_restart: '1G',
			node_args: ['--max_old_space_size=2048'],
			env: { FORCE_COLOR: '3' },
			exp_backoff_restart_delay: 2500,
			wait_ready: true
		}))
	],

	deploy: {
		...Object.fromEntries(
			['production', 'beta'].map((e) => [
				e,
				{
					'user': 'pi',
					'host': '192.168.1.210',
					'ref': `origin/${e === 'production' ? 'master' : 'beta'}`,
					'repo': 'https://github.com/NotEnoughUpdates/bush-bot.git',
					'path': `/code/bush-bot${e === 'beta' ? '-beta' : ''}`,
					'post-deploy': `yarn install && yarn build:tsc && pm2 start ecosystem.config.cjs --only bush-bot${
						e === 'beta' ? '-beta' : ''
					}`
				}
			])
		)
	}
};
