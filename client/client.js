/* globals EV, stream:true */
/* exported stream */

Meteor.connection._stream.on('message', function(raw_msg) {
	// var msg = DDPCommon.parseDDP(raw_msg);
	console.log(raw_msg);
});

Meteor.Radio = class Radio extends EV {
	constructor(name) {
		super();

		console.log('constructor', name);

		this.name = name;
		this.subscriptions = {};
	}

	get subscriptionName() {
		return `stream-${this.name}`;
	}

	unsubscribe(eventName) {
		delete this.subscriptions[eventName];
	}

	subscribe(eventName) {
		console.log('subscribe', eventName);
		return Meteor.subscribe(this.subscriptionName, eventName, {
			onStop: () => {
				console.log('onStop');
				this.unsubscribe(eventName);
			}
		});
	}

	on(eventName, callback) {
		console.log('on', eventName);
		if (!this.subscriptions[eventName]) {
			this.subscriptions[eventName] = {
				subscription: this.subscribe(eventName)
			};
		}

		super(eventName, callback);
	}
};


stream = new Meteor.Radio('chat');

stream.on('message', function(message) {
	console.log('message: ' + message);
});

stream.on('stop', function(message) {
	console.log('stop: ' + message);
});
