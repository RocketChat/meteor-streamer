# RocketChat:Streamer
2 way communication over DDP with better performance.

## Installation
```shell
not added to Atmosphere
```

## Documentation
2 way communication over DDP with better performance.
 - this version adds server-to-server streaming capability, with one server to act as 'client' in the communication.

Installation


Why

DDP subscriptions keeps track of all data each client has, it's called MergeBox, this is a lighter solution.

Use subscriptions to send data to client is not always easy to do, with streamer you can send data as simple as calling events.

Use case

You should use this library when you want to send data from server to client of from client to server and prevent the server to keep track off data all clients have.

You can send a lot of data without performance problems, like notifications.

Server-server streaming may be required for interprocess communication or for when a device is attached to the computer, say via a USB port, and the Meteor App is required to access it via a local server running as a background process.

Downsides

Since the library don't keep track of data, you will not receive lost data while offline after reconnection. But we have an event to notify you on reconnections passing the latest record received so you can call a method to verify and get the missing data.

Compatibility

Since streamer is based on DDP, we use subscriptions and methods to send data, it's 100% compatible with all DDP clients, more details below.

Advantages over Arunoda's stream library

Faster and use less memory
For 2000 events and 10 messages (40 thousand operations - send and reply)
rocketchat:streamer: ~34 seconds, increase of ~68mb of RAM
arunoda:meteor-stream: ~41 seconds, increase of ~76mb of RAM
For 10 events and 2000 messages (40 thousand operations - send and reply)
rocketchat:streamer: ~32 seconds, increase of ~35mb of RAM
arunoda:meteor-stream: ~43 seconds, increase of ~80mb of RAM
Read permission cached by event name by client at subscription time
Don't use collection at client side (there is a compatible mode if you need)
Last message cache and reconnection event
Keep the last message on client for each event name
You can get the last message and send to the server to verify if you lost messages
How to use

A simple console chat

const streamer = new Meteor.Streamer('chat');

if(Meteor.isClient) {
  sendMessage = function(message) {
    streamer.emit('message', message);
    console.log('me: ' + message);
  };

  streamer.on('message', function(message) {
    console.log('user: ' + message);
  });
}

if (Meteor.isServer) {
  streamer.allowRead('all');
  streamer.allowWrite('all');
}
Now you can open 2 browser tabs/windows and chat using sendMessage("text") at your browser's console Every message will travel from your client to server and retransmited to all other clients.

new Meteor.Streamer('name')


For server to server communication we have two instances to run.

First instance: meteor --settings serverServer.json
Second instance: meteor --settings clientServer.json
The web address or IP address of the serverServer instance needs to manually entered into the code so that the clientServer instance can remotely connect to the serverServer instance. See below: 'remote = 'http://192.168.1.11:3000';'

Note that for server-server, the packages exports two globals:
    - Streamer
    - svrStreamer
The second global 'svrStreamer' is required for the instance running on clientServer and communicates with 'Streamers' running on serverServer. svrStreamers can co-exist with Streamers running client-server on clientServer.


if (Meteor.isServer) {
    if (Meteor.settings.public.function === "clientServer") {

        remote = 'http://192.168.1.11:3000';
        networkStreamer = new Meteor.SvrStreamer('network', remote);

        sendMessage = function(text) {
            networkStreamer.emit('networkMessage', text);
        };

        networkStreamer.on('networkMessage', function(message) {
            console.log('received by clientServer', message);
        });

        Meteor.setInterval(function (){
            console.log('sent by clientServer ');
            sendMessage('sent by clientServer');

        }, 2000)


    } else if (Meteor.settings.public.function === "serverServer") {

        networkStreamer = new Meteor.Streamer('network');

        networkStreamer.allowRead('all');
        networkStreamer.allowWrite('all');

            sendMessage = function(text) {
                networkStreamer.emit('networkMessage', text);
            };

            networkStreamer.on('networkMessage', function(message) {
                console.log('received bt serverServer', message.text);
            });

                Meteor.setInterval(function (){
                    console.log('sent by serverServer ');
                    sendMessage('sent by serverServer');
                }, 2000);
    }
    }

Client

new Meteor.Streamer(name, [options])
name - String REQUIRED Unique name to identify stream between server and client
options - Object OPTIONAL
useCollection - Boolean Set to true to enable the compatible mode default false
ddpConnection - Object The DDP connection to be used default Meteor.connection
Server

const streamer = new Meteor.Streamer(name, [options]);
name - String REQUIRED Unique name to identify stream between server and client
options - Object OPTIONAL
retransmit - Boolean Set to false to prevent streaming "client to client" default true
retransmitToSelf - Boolean Set to true if you want to receive messages you've sent via retransmit default false
.emit('eventName', ...args)

With emit you send data from client to server or from server to clients.

streamer.emit(eventName, arg1, arg2, ...);
eventName - String REQUIRED The event name to send data
args - Mixed OPTIONAL You can pass 0 or more arguments to your event
If you emit an event from client you will receive that event on server and if you emit an event on your server you will receive the event in all connected clients.

If retransmit is enabled, you will receive the event emitted on client on your server and on all other connected clients.

The default permission deny all communication, you should define a new permission! See allowRead and allowWrite bellow

// Example
streamer.emit('message', {text: 'My new message', user: 'User1'}); // Send one object
streamer.emit('message', 'My new message', 'User1'); // Send 2 strings
streamer.emit('message'); // Just call the event without params
.on('eventName', fn)

With on you listen for data sent from client to server or from server to clients.

streamer.on(eventName, fn);
eventName - String REQUIRED The event name to receive data
fn - Function REQUIRED Function to receive and process the data for the event
The default permission deny all communication, you should define a new permission! See allowRead and allowWrite bellow

// Example
streamer.on('message', function(message) {
  console.log(message);
});
.allowRead('eventName', 'all') (Server only)

This permission will be evaluate only 1 time per client, so you decide if the connections is allowed or not, you can't manage permissions based on data.

streamer.allowRead([eventName], permission);
eventName - String OPTIONAL The event name to apply permissions, if not informed will apply the permission for all events
permission - Function/String REQUIRED
Function(eventName) The function should return true to allow read
Param eventName The event name, useful when use one function to manage permissions for all events
Scope this.userId The id of the logged user
Scope this.connection The connection between client and server
String There are shortcuts for permissions
all Allow read for everyone
none Deny read for everyone
logged Allow read for logged users
//Examples

streamer.allowRead('all'); // Everyone can read all events

streamer.allowRead('chat', 'logged'); // Only logged users can read chat events

streamer.allowRead('notifications', function() { // Only admin users can read notificaiton events
  if (this.userId) {
    const user = Meteor.users.findOne(this.userId);
    if (user && user.admin === true) {
      return true;
    }
  }

  return false;
});
.allowEmit('eventName', 'all') (Server only)

This permission will be evaluate (executed) for each data for each client subscribed, this is much more expensive then allowRead but you can manage permissions based on each data.

streamer.allowEmit([eventName], permission);
eventName - String OPTIONAL The event name to apply permissions, if not informed will apply the permission for all events
permission - Function/String REQUIRED
Function(eventName, ...args) The function should return true to allow emite
Param eventName The event name, useful when use one function to manage permissions for all events
Scope this.userId The id of the logged user
Scope this.connection The connection between client and server
String There are shortcuts for permissions
all Allow emit for everyone [default]
none Deny emit for everyone
logged Allow emit for logged users
//Examples

streamer.allowEmit('all'); // Everyone can emit all events

streamer.allowEmit('chat', 'logged'); // Only emit for logged users
.allowWrite('eventName', 'all') (Server only)

streamer.allowWrite([eventName], permission);
eventName - String OPTIONAL The event name to apply permissions, if not informed will apply the permission for all events
permission - Function/String REQUIRED
Function(eventName, ...args) The function should return true to allow write
Param eventName The event name, useful when use one function to manage permissions for all events
Scope this.userId The id of the logged user
Scope this.connection The connection between client and server
String There are shortcuts for permissions
all Allow write for everyone
none Deny write for everyone
logged Allow write for logged users
//Examples

streamer.allowWrite('all'); // Everyone can write all events

streamer.allowWrite('chat', 'logged'); // Only logged users can write chat events

streamer.allowWrite('notifications', function(eventName, type) { // Only admin users can write notificaiton events
  if (this.userId && type === 'new-message') {                   // and only if the first param is 'new-message'
    const user = Meteor.users.findOne(this.userId);
    if (user && user.admin === true) {
      return true;
    }
  }

  return false;
});
History

0.5.0 (2016-06-07)

Add a new method to control data flow allowEmit
0.4.0 (2016-05-21)

Added optional ddpConnection to Streamer constructor
0.3.5 (2016-05-02)

Fix some ES6 errors
0.3.4 (2016-05-01)

Remove all listeners on unsubscribe
