const WebSocket = require('ws');
const { v4 } = require('uuid');

const wsServer = new WebSocket.Server({ port: 1337 });
const clients = new Map();
const connectHandler = ws => {
	const id = v4();
	const color = Math.floor(Math.random() * 360);
	const initialMetadata = { id, color };

	clients.set(ws, initialMetadata);

	ws.on('message', rawMessage => {
		const message = JSON.parse(String(rawMessage));
		const metadata = clients.get(ws);
		message.sender = metadata.id;

		const outbound = JSON.stringify(message);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		[...clients.keys()].forEach(client => {
			client.send(outbound);
		});
	});

	ws.on('close', () => {
		const metadata = clients.get(ws);
		const message = JSON.stringify({
			action: 'CAR_DELETE',
			data: JSON.stringify({
				id: metadata.id,
			}),
		});
		[...clients.keys()].forEach(client => {
			client.send(message);
		});
		clients.delete(ws);
	});
};

wsServer.on('connection', connectHandler);
console.log('Сервер запущен на 1337 порту');
