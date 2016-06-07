/* globals EV */
/* eslint new-cap: false */

class StreamerCentral extends EV {
	constructor() {
		super();

		this.instances = {};
	}
}

Meteor.StreamerCentral = new StreamerCentral;


Meteor.Streamer = class Streamer extends EV {
	constructor(name, {retransmit = true, retransmitToSelf = false} = {}) {
		if (Meteor.StreamerCentral.instances[name]) {
			console.warn('Streamer instance already exists:', name);
			return Meteor.StreamerCentral.instances[name];
		}

		super();

		Meteor.StreamerCentral.instances[name] = this;

		this.name = name;
		this.retransmit = retransmit;
		this.retransmitToSelf = retransmitToSelf;

		this.subscriptions = [];
		this.subscriptionsByEventName = {};
		this.transformers = {};

		this.iniPublication();
		this.initMethod();

		this._allowRead = {};
		this._allowEmit = {};
		this._allowWrite = {};

		this.allowRead('none');
		this.allowEmit('all');
		this.allowWrite('none');
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

	get retransmit() {
		return this._retransmit;
	}

	set retransmit(retransmit) {
		check(retransmit, Boolean);
		this._retransmit = retransmit;
	}

	get retransmitToSelf() {
		return this._retransmitToSelf;
	}

	set retransmitToSelf(retransmitToSelf) {
		check(retransmitToSelf, Boolean);
		this._retransmitToSelf = retransmitToSelf;
	}

	allowRead(eventName, fn) {
		if (fn === undefined) {
			fn = eventName;
			eventName = '__all__';
		}

		if (typeof fn === 'function') {
			return this._allowRead[eventName] = fn;
		}

		if (typeof fn === 'string' && ['all', 'none', 'logged'].indexOf(fn) === -1) {
			console.error(`allowRead shortcut '${fn}' is invalid`);
		}

		if (fn === 'all' || fn === true) {
			return this._allowRead[eventName] = function() {
				return true;
			};
		}

		if (fn === 'none' || fn === false) {
			return this._allowRead[eventName] = function() {
				return false;
			};
		}

		if (fn === 'logged') {
			return this._allowRead[eventName] = function() {
				return Boolean(this.userId);
			};
		}
	}

	allowEmit(eventName, fn) {
		if (fn === undefined) {
			fn = eventName;
			eventName = '__all__';
		}

		if (typeof fn === 'function') {
			return this._allowEmit[eventName] = fn;
		}

		if (typeof fn === 'string' && ['all', 'none', 'logged'].indexOf(fn) === -1) {
			console.error(`allowRead shortcut '${fn}' is invalid`);
		}

		if (fn === 'all' || fn === true) {
			return this._allowEmit[eventName] = function() {
				return true;
			};
		}

		if (fn === 'none' || fn === false) {
			return this._allowEmit[eventName] = function() {
				return false;
			};
		}

		if (fn === 'logged') {
			return this._allowEmit[eventName] = function() {
				return Boolean(this.userId);
			};
		}
	}

	allowWrite(eventName, fn) {
		if (fn === undefined) {
			fn = eventName;
			eventName = '__all__';
		}

		if (typeof fn === 'function') {
			return this._allowWrite[eventName] = fn;
		}

		if (typeof fn === 'string' && ['all', 'none', 'logged'].indexOf(fn) === -1) {
			console.error(`allowWrite shortcut '${fn}' is invalid`);
		}

		if (fn === 'all' || fn === true) {
			return this._allowWrite[eventName] = function() {
				return true;
			};
		}

		if (fn === 'none' || fn === false) {
			return this._allowWrite[eventName] = function() {
				return false;
			};
		}

		if (fn === 'logged') {
			return this._allowWrite[eventName] = function() {
				return Boolean(this.userId);
			};
		}
	}

	isReadAllowed(scope, eventName) {
		if (this._allowRead[eventName]) {
			return this._allowRead[eventName].call(scope, eventName);
		}

		return this._allowRead['__all__'].call(scope, eventName);
	}

	isEmitAllowed(scope, eventName, ...args) {
		if (this._allowEmit[eventName]) {
			return this._allowEmit[eventName].call(scope, eventName, ...args);
		}

		return this._allowEmit['__all__'].call(scope, eventName, ...args);
	}

	isWriteAllowed(scope, eventName, args) {
		if (this._allowWrite[eventName]) {
			return this._allowWrite[eventName].call(scope, eventName, ...args);
		}

		return this._allowWrite['__all__'].call(scope, eventName, ...args);
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

	transform(eventName, fn) {
		if (typeof eventName === 'function') {
			fn = eventName;
			eventName = '__all__';
		}

		if (!this.transformers[eventName]) {
			this.transformers[eventName] = [];
		}

		this.transformers[eventName].push(fn);
	}

	applyTransformers(methodScope, eventName, args) {
		if (this.transformers['__all__']) {
			this.transformers['__all__'].forEach((transform) => {
				args = transform.call(methodScope, eventName, args);
				methodScope.tranformed = true;
				if (!Array.isArray(args)) {
					args = [args];
				}
			});
		}

		if (this.transformers[eventName]) {
			this.transformers[eventName].forEach((transform) => {
				args = transform.call(methodScope, ...args);
				methodScope.tranformed = true;
				if (!Array.isArray(args)) {
					args = [args];
				}
			});
		}

		return args;
	}

	iniPublication() {
		const stream = this;
		Meteor.publish(this.subscriptionName, function(eventName, useCollection) {
			check(eventName, String);
			check(useCollection, Match.Optional(Boolean));

			if (eventName.length === 0) {
				this.stop();
				return;
			}

			if (stream.isReadAllowed(this, eventName) !== true) {
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

			if (useCollection === true) {
				// Collection compatibility
				this._session.sendAdded(stream.subscriptionName, 'id', {
					eventName: eventName
				});
			}

			this.ready();
		});
	}

	initMethod() {
		const stream = this;
		const method = {};

		method[this.subscriptionName] = function(eventName, ...args) {
			check(eventName, String);
			check(args, Array);

			this.unblock();

			if (stream.isWriteAllowed(this, eventName, args) !== true) {
				return;
			}

			const methodScope = {
				userId: this.userId,
				connection: this.connection,
				originalParams: args,
				tranformed: false
			};

			args = stream.applyTransformers(methodScope, eventName, args);

			stream.emitWithScope(eventName, methodScope, ...args);

			if (stream.retransmit === true) {
				stream._emit(eventName, args, this.connection, true);
			}
		};

		try {
			Meteor.methods(method);
		} catch (e) {
			console.error(e);
		}
	}

	_emit(eventName, args, origin, broadcast) {
		if (broadcast === true) {
			Meteor.StreamerCentral.emit('broadcast', this.name, eventName, args);
		}

		const subscriptions = this.subscriptionsByEventName[eventName];
		if (!Array.isArray(subscriptions)) {
			return;
		}

		subscriptions.forEach((subscription) => {
			if (this.retransmitToSelf === false && origin && origin === subscription.subscription.connection) {
				return;
			}

			if (this.isEmitAllowed(subscription.subscription, eventName, ...args)) {
				subscription.subscription._session.sendChanged(this.subscriptionName, 'id', {
					eventName: eventName,
					args: args
				});
			}
		});
	}

	emit(eventName, ...args) {
		this._emit(eventName, args, undefined, true);
	}

	emitWithoutBroadcast(eventName, ...args) {
		this._emit(eventName, args, undefined, false);
	}
};
