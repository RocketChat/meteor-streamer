Package.describe({
	name: 'rocketchat:streamer',
	version: '0.1.0',
	summary: 'DB less realtime communication for meteor'
});

Package.on_use(function (api) {
	api.use('ddp-common');
	api.use('ecmascript');

	api.addFiles('lib/ev.js');

	api.addFiles('client/client.js', 'client');

	api.addFiles('server/server.js', 'server');

	api.export('Streamer');
});
