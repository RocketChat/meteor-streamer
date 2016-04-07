/* globals EV, test:true, stream:true */
/* exported stream, test */

Meteor.Radio = class Radio extends EV {
	constructor(name) {
		super();

		this.name = name;
		this.subscriptions = [];
		this.subscriptionsByEventName = {};

		this.iniPublication();
	}

	get subscriptionName() {
		return `stream-${this.name}`;
	}

	addSubscription(subscription, eventName) {
		this.subscriptions.push(subscription);

		if (!this.subscriptionsByEventName[eventName]) {
			this.subscriptionsByEventName[eventName] = [];
		}

		this.subscriptionsByEventName[eventName].push(subscription);
	}

	removeSubscription(subscription, eventName) {
		const index = this.subscriptions.indexOf(subscription);
		if (index > -1) {
			this.subscriptions.splice(index, 1);
		}

		if (this.subscriptionsByEventName[eventName]) {
			const index = this.subscriptionsByEventName[eventName].indexOf(subscription);
			if (index > -1) {
				this.subscriptionsByEventName[eventName].splice(index, 1);
			}
		}
	}

	iniPublication() {
		const stream = this;
		Meteor.publish(this.subscriptionName, function(eventName) {
			// TODO validate permissions

			if (eventName === 'stop') {
				this.stop();
				console.log('stop', eventName);
				return;
			}

			const subscription = {
				subscription: this,
				eventName: eventName
			};

			stream.addSubscription(subscription, eventName);

			this.onStop(() => {
				stream.removeSubscription(subscription, eventName);
			});

			// Collection compatibility
			this._session.sendAdded(stream.subscriptionName, 'id', {
				eventName: eventName
			});
			// END Collection compatibility

			this.ready();

			console.log('eventName', eventName);
		});
	}

	emit(eventName, ...args) {
		const subscriptions = this.subscriptionsByEventName[eventName];
		if (!Array.isArray(subscriptions)) {
			return;
		}

		subscriptions.forEach((subscription) => {
			subscription.subscription._session.sendChanged(this.subscriptionName, 'id', {
				eventName: eventName,
				args: args
			});
		});

		console.log(eventName, args);
	}
};

stream = new Meteor.Radio('chat');

// Stream.permissions.write(function(eventName) {
// 	console.log('permissions write', eventName);
// 	return true;
// });

// Stream.permissions.read(function(eventName) {
// 	console.log('permissions read', eventName);
// 	return true;
// });

test = function() {
	stream.emit('message', 'new message');
};

// Stream.on('message', function(message) {
// 	console.log('message: ' + message);
// });
