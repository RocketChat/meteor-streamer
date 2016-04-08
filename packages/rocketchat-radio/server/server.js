/* globals EV */

Meteor.Radio = class Radio extends EV {
	constructor(name) {
		super();

		this.name = name;
		this.subscriptions = [];
		this.subscriptionsByEventName = {};

		this.iniPublication();
		this.initMethod();

		this._allowRead = function() {
			return true;
		};

		this._allowWrite = function() {
			return true;
		};
	}

	get subscriptionName() {
		return `stream-${this.name}`;
	}

	allowRead(fn) {
		if (typeof fn === 'function') {
			this._allowRead = fn;
		}
	}

	allowWrite(fn) {
		if (typeof fn === 'function') {
			this._allowWrite = fn;
		}
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
			if (stream._allowRead.call(this, eventName) !== true) {
				this.stop();
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
		});
	}

	initMethod() {
		const stream = this;
		const method = {};

		method[this.subscriptionName] = function(eventName, ...args) {
			this.unblock();

			if (stream._allowWrite.call(this, eventName, ...args) !== true) {
				return;
			}

			// console.log(eventName);
			super.emitWithScope(eventName, this, ...args);
		};

		try {
			Meteor.methods(method);
		} catch (e) {
			console.error(e);
		}
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
	}
};
