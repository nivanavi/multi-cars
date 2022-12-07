import { isJsonString } from '../libs/utils';
import { CarMoveSpecs, eventBusSubscriptions } from '../eventBus';

type WebsocketMessages =
	| {
			action: 'CAR_MOVE';
			payload: Omit<CarMoveSpecs, 'isNotMove'>;
	  }
	| { action: 'CAR_DELETE'; payload: { id: string } }
	| { action: 'CAR_CONNECTED'; payload: { id: string } };

const WS_URL = process.env.REACT_APP_WS_URL || '';

export const setupWebsocket = (
	rootCarId: string,
	onDelete: (id: string) => void,
	onUpdate: (data: Omit<CarMoveSpecs, 'isNotMove'>) => void
): void => {
	const websocket = new WebSocket(WS_URL);

	const sendMessages = (message: WebsocketMessages): void => {
		websocket.send(JSON.stringify(message));
	};

	websocket.onopen = (): void => {
		sendMessages({
			action: 'CAR_CONNECTED',
			payload: { id: rootCarId },
		});
	};

	eventBusSubscriptions.subscribeOnCarMove({
		callback: ({ payload: { chassis, steering, accelerating, brake, id, isNotMove } }) => {
			if (websocket.readyState !== 1) return;
			if (isNotMove) return;
			sendMessages({
				action: 'CAR_MOVE',
				payload: {
					chassis,
					steering,
					accelerating,
					brake,
					id,
				},
			});
		},
	});

	websocket.onmessage = (message): void => {
		if (!isJsonString(message.data)) return;
		const data: WebsocketMessages = JSON.parse(message.data);
		switch (data.action) {
			case 'CAR_CONNECTED':
				console.log(`к нам присоединилась машина с id ${data.payload.id} а наш id ${rootCarId}`);
				break;
			case 'CAR_DELETE':
				console.log(`от нас отсоединилась машина с id ${data.payload.id} а наш id ${rootCarId}`);
				onDelete(data.payload.id);
				break;
			case 'CAR_MOVE':
				console.log(`движется машина с id ${data.payload.id} а наш id ${rootCarId}`);
				onUpdate(data.payload);
				break;
			default:
				break;
		}
	};
};
