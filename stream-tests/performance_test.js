function memoryReadle(value) {
	return Math.round(value / 1024 / 102.4) / 10;
}

Meteor.rocket = new Meteor.Streamer('performance-rocket');
Meteor.arunoda = new Meteor.Stream('performance-arunoda');

if (Meteor.isClient) {
	const done = function(startTime, memoryStart, success, e, m) {
		console.log('success:', success, '/', e * m);
		console.log('time:', (new Date()) - startTime);
		Meteor.call('memory-sample', function(err, memoryEnd) {
			console.log('memory:', memoryReadle(memoryEnd - memoryStart), 'start:', memoryReadle(memoryStart), 'end:', memoryReadle(memoryEnd));
		});
	};

	const test = function(platform, e=2000, m=10) {
		Meteor.call('memory-sample', function(err, memoryStart) {
			Meteor.call('register', platform, e, function() {
				console.log('testing platform:', platform);
				console.log('events:', e, 'messages:', m);

				const startTime = new Date();
				let success = 0;

				for (let i = 1; i <= e; i++) {
					Meteor[platform].on(`event-${i}-reply`, function(value, obj) {
						if (value === i && obj) {
							success++;
						}
						if (success % 1000 === 0) {
							console.log(success);
						}
						if (success === e * m) {
							done(startTime, memoryStart, success, e, m);
						}
					});
				}

				for (let i = 1; i <= e; i++) {
					for (let j = 1; j <= m; j++) {
						Meteor[platform].emit(`event-${i}`, i, __meteor_runtime_config__);
					}
				}
			});
		});
	};

	Meteor.testRocket = function(e, m) {
		test('rocket', e, m);
	};

	Meteor.testArunoda = function(e, m) {
		test('arunoda', e, m);
	};
}

if (Meteor.isServer) {
	Meteor.rocket.allowRead('all');
	Meteor.rocket.allowWrite('all');

	Meteor.arunoda.permissions.read(function() {
		return true;
	});

	Meteor.arunoda.permissions.write(function() {
		return true;
	});

	Meteor.methods({
		'memory-sample'() {
			return process.memoryUsage().rss;
		},

		'register'(platform, n) {
			for (let i = 1; i <= n; i++) {
				Meteor[platform].on(`event-${i}`, function(value, obj) {
					Meteor[platform].emit(`event-${i}-reply`, value, obj);
				});
			}
		}
	});
}
