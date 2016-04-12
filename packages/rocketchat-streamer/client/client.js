/* globals DDPCommon, EV */

class StreamerCentral extends EV {
	constructor() {
		super();

		this.instances = {};

		Meteor.connection._stream.on('message', (raw_msg) => {
			const msg = DDPCommon.parseDDP(raw_msg);
			if (msg && msg.msg === 'changed' && msg.collection && msg.fields && msg.fields.eventName && msg.fields.args) {
				// console.log(raw_msg);
				msg.fields.args.unshift(msg.fields.eventName);
				msg.fields.args.unshift(msg.collection);
				this.emit.apply(this, msg.fields.args);
			}
		});
	}
}

Meteor.StreamerCentral = new StreamerCentral;


Meteor.Streamer = class Streamer extends EV {
	constructor(name, {useCollection = false} = {}) {
		if (Meteor.StreamerCentral.instances[name]) {
			console.warn('Streamer instance already exists:', name);
			return Meteor.StreamerCentral.instances[name];
		}

		super();

		Meteor.StreamerCentral.instances[name] = this;

		this.name = name;
		this.useCollection = useCollection;
		this.subscriptions = {};

		Meteor.StreamerCentral.on(this.subscriptionName, (eventName, ...args) => {
			if (this.subscriptions[eventName]) {
				this.subscriptions[eventName].lastMessage = args;
				super.emit.call(this, eventName, ...args);
			}
		});

		Meteor.connection._stream.on('reset', () => {
			super.emit.call(this, '__reconnect__');
		});
	}

	get name() {
		return this._name;
	}

	set name(name) {
		check(name, String);
		this._name = name;
	}

	get subscriptionName() {
		return `stream-${this.name}`;
	}

	get useCollection() {
		return this._useCollection;
	}

	set useCollection(useCollection) {
		check(useCollection, Boolean);
		this._useCollection = useCollection;
	}

	unsubscribe(eventName) {
		delete this.subscriptions[eventName];
	}

	subscribe(eventName) {
		let subscribe;
		Tracker.nonreactive(() => {
			subscribe = Meteor.subscribe(this.subscriptionName, eventName, this.useCollection, {
				onStop: () => {
					this.unsubscribe(eventName);
				}
			});
		});
		return subscribe;
	}

	onReconnect(fn) {
		if (typeof fn === 'function') {
			super.on('__reconnect__', fn);
		}
	}

	getLastMessageFromEvent(eventName) {
		const subscription = this.subscriptions[eventName];
		if (subscription && subscription.lastMessage) {
			return subscription.lastMessage;
		}
	}

	once(eventName, callback) {
		if (!this.subscriptions[eventName]) {
			this.subscriptions[eventName] = {
				subscription: this.subscribe(eventName)
			};
		}

		super(eventName, callback);
	}

	on(eventName, callback) {
		if (!this.subscriptions[eventName]) {
			this.subscriptions[eventName] = {
				subscription: this.subscribe(eventName)
			};
		}

		super(eventName, callback);
	}

	emit(...args) {
		Meteor.call(this.subscriptionName, ...args);
	}
};
