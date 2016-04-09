/* globals DDPCommon, EV */

class RadioStation extends EV {
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

Meteor.RadioStation = new RadioStation;


Meteor.Radio = class Radio extends EV {
	constructor(name, {useCollection} = {useCollection: false}) {
		if (Meteor.RadioStation.instances[name]) {
			console.warn('Radio instance already exists:', name);
			return Meteor.RadioStation.instances[name];
		}

		super();

		Meteor.RadioStation.instances[name] = this;

		this.name = name;
		this.useCollection = useCollection;
		this.subscriptions = {};

		Meteor.RadioStation.on(this.subscriptionName, (eventName, ...args) => {
			if (this.subscriptions[eventName]) {
				this.subscriptions[eventName].lastMessage = args;
				super.emit.call(this, eventName, ...args);
			}
		});
	}

	get subscriptionName() {
		return `stream-${this.name}`;
	}

	unsubscribe(eventName) {
		delete this.subscriptions[eventName];
	}

	subscribe(eventName) {
		return Meteor.subscribe(this.subscriptionName, eventName, this.useCollection, {
			onStop: () => {
				this.unsubscribe(eventName);
			}
		});
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
