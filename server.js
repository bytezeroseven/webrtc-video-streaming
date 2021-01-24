import express from 'express';
import WebSocket from 'ws';

import path from 'path';

import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname( fileURLToPath( import.meta.url ) );

const app = express();

app.use( express.static( path.join( __dirname, 'public' ) ) );

const port = process.env.PORT || 3000;

const server = app.listen( port, function () {

	console.log( 'Server running on port ' + port + '...' );

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

				console.log( message );

				sendMessage( message.id, {
					...message, 
					id: socket.id
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