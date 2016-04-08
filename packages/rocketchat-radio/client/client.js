/* globals DDPCommon, EV */

class RadioStation extends EV {
	constructor() {
		super();

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
		super();

		// TODO allow only one instance by name

		this.name = name;
		this.useCollection = useCollection;
		this.subscriptions = {};

		Meteor.RadioStation.on(this.subscriptionName, (...args) => {
			if (this.subscriptions[args[0]]) {
				super.emit.apply(this, args);
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
