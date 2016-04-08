function memoryReadle(value) {
	return Math.round(value / 1024 / 102.4) / 10;
}

Meteor.testRocket = function(e=10, m=2000) {
	Meteor.call('memory-sample', function(err, memoryStart) {
		Meteor.call('register-rocket', e, function() {

			Meteor.radio = Meteor.radio || new Meteor.Radio('performance-rocket');

			const startTime = new Date();
			let success = 0;

			const done = function() {
				console.log('success:', success, '/', e * m);
				console.log('time:', (new Date()) - startTime);
				Meteor.call('memory-sample', function(err, memoryEnd) {
					console.log('memory:', memoryReadle(memoryEnd - memoryStart), 'start:', memoryReadle(memoryStart), 'end:', memoryReadle(memoryEnd));
				});
			};

			for (let i = 1; i <= e; i++) {
				Meteor.radio.on(`event-${i}-reply`, function(value, obj) {
					if (value === i && obj) {
						success++;
					}
					if (success % 1000 === 0) {
						console.log(success);
					}
					if (success === e * m) {
						done();
					}
				});
			}

			for (let i = 1; i <= e; i++) {
				for (let j = 1; j <= m; j++) {
					Meteor.radio.emit(`event-${i}`, i, __meteor_runtime_config__);
				}
			}
		});
	});
};

Meteor.testArunoda = function(e=10, m=2000) {
	Meteor.call('memory-sample', function(err, memoryStart) {
		Meteor.call('register-arunoda', e, function() {

			Meteor.stream = Meteor.stream || new Meteor.Stream('performance-arunoda');

			const startTime = new Date();
			let success = 0;

			const done = function() {
				console.log('success:', success, '/', e * m);
				console.log('time:', (new Date()) - startTime);
				Meteor.call('memory-sample', function(err, memoryEnd) {
					console.log('memory:', memoryReadle(memoryEnd - memoryStart), 'start:', memoryReadle(memoryStart), 'end:', memoryReadle(memoryEnd));
				});
			};

			for (let i = 1; i <= e; i++) {
				Meteor.stream.on(`event-${i}-reply`, function(value, obj) {
					if (value === i && obj) {
						success++;
					}
					if (success % 1000 === 0) {
						console.log(success);
					}
					if (success === e * m) {
						done();
					}
				});
			}

			for (let i = 1; i <= e; i++) {
				for (let j = 1; j <= m; j++) {
					Meteor.stream.emit(`event-${i}`, i, __meteor_runtime_config__);
				}
			}
		});
	});
};
