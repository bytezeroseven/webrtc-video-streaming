import express from 'express';
import WebSocket from 'ws';

import path from 'path';

import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname( fileURLToPath( import.meta.url ) );

const app = express();

app.use( express.static( path.join( __dirname, 'public' ) ) );

const server = app.listen( 3000, function () {

	console.log( 'Server running on port 3000...' );

} );

const webSocketServer = new WebSocket.Server( {
	server, 
	perMessageDeflate: false
} );

const sockets = {};

webSocketServer.on( 'connection', function ( socket ) {

	socket.id = 'ID_' + Math.random() * 10E15;
	sockets[ socket.id ] = socket;

	broadcastMessage( {
		type: 'new-connection', 
		id: socket.id
	} );

	socket.on( 'message', function ( message ) {

		message = JSON.parse( message );

		switch ( message.type ) {

			case 'call' : 

				sendMessage( message.id, {
					type: 'call', 
					id: socket.id
				} );

				break;

			case 'signal' : 

				sendMessage( message.id, {
					type: 'signal', 
					id: socket.id, 
					sdp: message.sdp, 
					ice: message.ice
				} );

				break;

		}

	} );

	socket.on( 'close', function () {

		broadcastMessage( {
			type: 'user-disconnected', 
			id: socket.id
		} );

		delete sockets[ socket.id ];

	} );

	function broadcastMessage( message ) {

		for ( let id in sockets ) {

			if ( id == socket.id ) {

				continue;

			}

			sendMessage( id, message );

		}

	}

} );

function sendMessage( id, message ) {

	sockets[ id ] && sockets[ id ].send( JSON.stringify( message ) );

}