Package.describe({
	name: 'rocketchat:streamer',
	version: '0.7.0-alpha',
	summary: 'DB less realtime communication for meteor',
	git: 'https://github.com/RocketChat/meteor-streamer.git'
});

Npm.depends({
	'mqemitter-redis': '3.0.0'
});

Package.on_use(function(api) {
	api.use('ddp-common@1.2.2');
	api.use('ecmascript@0.1.6');
	api.use('check@1.1.0');
	api.use('tracker@1.0.9');

	api.addFiles('lib/ev.js');

	api.addFiles('client/client.js', 'client');

	api.addFiles('server/server.js', 'server');

	api.export('Streamer');
});
