/* globals DDPCommon, EV */
/* eslint-disable new-cap */
/* this code runs on server */

const NonEmptyString = Match.Where(function (x) {
    check(x, String);
    return x.length > 0;
});

class SvrStreamerCentral extends EV {
    constructor() {
        super();

        this.instances = {};
        this.ddpConnections = {};		// since each Streamer instance can provide its own ddp connection, store them by streamer name

    }

    setupDdpConnection(name, url) {

        ddpConnection = DDP.connect(url);

        // make sure we only setup event listeners for each ddp connection once
        if (ddpConnection.hasMeteorStreamerEventListeners) {
            return;
        }
        ddpConnection._stream.on('message', (raw_msg) => {
            const msg = DDPCommon.parseDDP(raw_msg);
            if (msg && msg.msg === 'changed' && msg.collection && msg.fields && msg.fields.eventName && msg.fields.args) {
                msg.fields.args.unshift(msg.fields.eventName);
                msg.fields.args.unshift(msg.collection);
                this.emit.apply(this, msg.fields.args);
            }
        });
        // store ddp connection
        this.storeDdpConnection(name, ddpConnection);

    }

    storeDdpConnection(name, ddpConnection) {
        // mark the connection as setup for Streamer, and store it
        ddpConnection.hasMeteorStreamerEventListeners = true;
        this.ddpConnections[name] = ddpConnection;
    }
}

Meteor.SvrStreamerCentral = new SvrStreamerCentral;

Meteor.SvrStreamer = class SvrStreamer extends EV {
    constructor(name, {useCollection = false, url = '127.0.0.1' } = {}) {
        if (Meteor.SvrStreamerCentral.instances[name]) {
            console.warn('Streamer instance already exists:', name);
            return Meteor.SvrStreamerCentral.instances[name];
        }
        Meteor.SvrStreamerCentral.setupDdpConnection(name, url);

        super();

        this.ddpConnection = ddpConnection || Meteor.connection;

        Meteor.SvrStreamerCentral.instances[name] = this;

        this.name = name;
        this.useCollection = useCollection;
        this.subscriptions = {};

        Meteor.SvrStreamerCentral.on(this.subscriptionName, (eventName, ...args) => {
            if (this.subscriptions[eventName]) {
                this.subscriptions[eventName].lastMessage = args;
                super.emit.call(this, eventName, ...args);
            }
        });

        this.ddpConnection._stream.on('reset', () => {
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

    stop(eventName) {
        if (this.subscriptions[eventName] && this.subscriptions[eventName].subscription) {
            this.subscriptions[eventName].subscription.stop();
        }
        this.unsubscribe(eventName);
    }

    stopAll() {
        for (let eventName in this.subscriptions) {
            if (this.subscriptions.hasOwnProperty(eventName)) {
                this.stop(eventName);
            }
        }
    }

    unsubscribe(eventName) {
        this.removeAllListeners(eventName);
        delete this.subscriptions[eventName];
    }

    subscribe(eventName) {
        let subscribe;
        //Tracker.autorun & Tracker.nonreactive are documented as client-side only. They do work server-side however (for now).
       Tracker.nonreactive(() => {
            subscribe = this.ddpConnection.subscribe(this.subscriptionName, eventName, this.useCollection, {
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
        check(eventName, NonEmptyString);
        check(callback, Function);

        if (!this.subscriptions[eventName]) {
            this.subscriptions[eventName] = {
                subscription: this.subscribe(eventName)
            };
        }

        super.once(eventName, callback);
    }

    on(eventName, callback) {
        check(eventName, NonEmptyString);
        check(callback, Function);

        if (!this.subscriptions[eventName]) {
            this.subscriptions[eventName] = {
                subscription: this.subscribe(eventName)
            };
        }

        super.on(eventName, callback);
    }

    emit(...args) {
        this.ddpConnection.call(this.subscriptionName, ...args);
    }
};
