/* globals test, DDPCommon, EV, radio:true */
/* exported radio, test */

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
	constructor(name) {
		super();

		// console.log('constructor', name);

		this.name = name;
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
		console.log('subscribe', eventName);
		return Meteor.subscribe(this.subscriptionName, eventName, {
			onStop: () => {
				console.log('onStop');
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
		// console.log('on', eventName);
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


radio = new Meteor.Radio('chat');
let testResult = [];
const testResultReactive = new ReactiveVar();

function addTestResult(text, ok) {
	testResult.push({
		type: ok === true ? 'success' : 'failure',
		sign: ok === true ? '√' : 'X',
		text: text
	});

	testResultReactive.set(testResult);
}

function call(eventName, params, paramsReply) {
	radio.once(eventName+'-reply', (serverReply, ...args) => {
		addTestResult(eventName + ' - ' + JSON.stringify(paramsReply), serverReply === 'server-reply' && JSON.stringify(args) === JSON.stringify(paramsReply));
	});
	radio.emit(eventName, ...params);
}

function test() {
	testResult = [];
	call('hi', [1, 2, 3], [1, 2, 3]);
	call('sum', [2, 3], [5]);
	call('logged', [], [!!Meteor.userId()]);
	call('userId', [], [Meteor.userId()]);
}

Template.body.events({
	'click .start-test'() {
		test();
	}
});

Template.body.helpers({
	testResult() {
		return testResultReactive.get();
	}
});

setTimeout(test, 1000);
