import { isJsonString } from '../libs/utils';
import { BallMoveSpecs, CarMoveSpecs, eventBusSubscriptions } from '../eventBus';

type WebsocketMessages =
	| {
			action: 'CAR_MOVE';
			payload: CarMoveSpecs & { carId: string; roomId: string };
	  }
	| { action: 'CAR_DELETE'; payload: { carId: string; roomId: string } }
	| { action: 'CAR_CONNECTED'; payload: { carId: string; roomId: string } }
	| { action: 'BALL_MOVE'; payload: BallMoveSpecs & { carId: string; roomId: string } };

const WS_URL = process.env.REACT_APP_WS_URL || '';

type WebsocketProps = {
	rootCarId: string;
	roomId: string;
	onCarDelete: (id: string) => void;
	onCarUpdate: (data: { id: string } & CarMoveSpecs) => void;
	onBallMove: (data: BallMoveSpecs) => void;
};

export const setupWebsocket = (props: WebsocketProps): void => {
	const { rootCarId, roomId, onCarDelete, onCarUpdate, onBallMove } = props;
	const websocket = new WebSocket(WS_URL);

	const sendMessages = (message: WebsocketMessages): void => {
		websocket.send(JSON.stringify(message));
	};

	websocket.onopen = (): void => {
		sendMessages({
			action: 'CAR_CONNECTED',
			payload: { carId: rootCarId, roomId },
		});
	};

	eventBusSubscriptions.subscribeOnCarMove({
		callback: ({ payload: { chassis, steering, accelerating, brake, id } }) => {
			if (websocket.readyState !== 1) return;
			sendMessages({
				action: 'CAR_MOVE',
				payload: {
					chassis,
					steering,
					accelerating,
					brake,
					carId: id,
					roomId,
				},
			});
		},
	});

	eventBusSubscriptions.subscribeOnBallMove({
		callback: ({ payload: { position, quaternion } }) => {
			if (websocket.readyState !== 1) return;
			sendMessages({
				action: 'BALL_MOVE',
				payload: {
					position,
					quaternion,
					carId: rootCarId,
					roomId,
				},
			});
		},
	});

	websocket.onmessage = (message): void => {
		if (!isJsonString(message.data)) return;
		const data: WebsocketMessages = JSON.parse(message.data);
		switch (data.action) {
			case 'CAR_CONNECTED':
				console.log(`к нам присоединилась машина с id ${data.payload.carId} а наш id ${rootCarId}`);
				break;
			case 'CAR_DELETE':
				console.log(`от нас отсоединилась машина с id ${data.payload.carId} а наш id ${rootCarId}`);
				onCarDelete(data.payload.carId);
				break;
			case 'CAR_MOVE':
				// console.log(`движется машина с id ${data.payload.carId} а наш id ${rootCarId}`);
				onCarUpdate({
					...data.payload,
					id: data.payload.carId,
				});
				break;
			case 'BALL_MOVE':
				if (data.payload.carId === rootCarId) return;
				onBallMove(data.payload);
				break;
			default:
				break;
		}
	};
};
