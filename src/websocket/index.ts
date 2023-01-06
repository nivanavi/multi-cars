import {isJsonString, uuid} from '../libs/utils';
import { BallMoveSpecs, CarMoveSpecs, eventBusSubscriptions, eventBusTriggers } from '../eventBus';

export type GeneralMessageProps = { carId: string; roomId: string; nickname?: string };
type WebsocketMessages =
	| {
			action: 'CAR_MOVE';
			payload: CarMoveSpecs & GeneralMessageProps;
	  }
	| { action: 'CAR_DELETE'; payload: GeneralMessageProps }
	| { action: 'CAR_CONNECTED'; payload: GeneralMessageProps }
	| { action: 'BALL_MOVE'; payload: BallMoveSpecs & GeneralMessageProps };

const WS_URL = process.env.REACT_APP_WS_URL || '';

type WebsocketProps = {
	rootCarId: string;
	nickname: string;
	roomId: string;
	onCarDelete: (id: string) => void;
	onCarUpdate: (data: GeneralMessageProps & CarMoveSpecs) => void;
	onBallMove: (data: BallMoveSpecs) => void;
};

export const setupWebsocket = (
	props: WebsocketProps
): {
	close: () => void;
} => {
	const { rootCarId, roomId, nickname, onCarDelete, onCarUpdate, onBallMove } = props;

	const websocket = new WebSocket(WS_URL);

	const sendMessages = (message: WebsocketMessages): void => {
		websocket.send(JSON.stringify(message));
	};

	websocket.onopen = (): void => {
		sendMessages({
			action: 'CAR_CONNECTED',
			payload: { carId: rootCarId, roomId, nickname },
		});
	};

	eventBusSubscriptions.subscribeOnCarMove(({ chassis, steering, type, accelerating, brake, id }) => {
		if (websocket.readyState !== 1) return;
		sendMessages({
			action: 'CAR_MOVE',
			payload: {
				chassis,
				steering,
				accelerating,
				type,
				brake,
				carId: id,
				roomId,
			},
		});
	});

	eventBusSubscriptions.subscribeOnBallMove(({ position, quaternion }) => {
		if (websocket.readyState !== 1) return;
		sendMessages({
			action: 'BALL_MOVE',
			payload: {
				position,
				quaternion,
				carId: rootCarId,
				roomId,
				nickname,
			},
		});
	});

	websocket.onmessage = (message): void => {
		if (!isJsonString(message.data)) return;
		const data: WebsocketMessages = JSON.parse(message.data);
		switch (data.action) {
			case 'CAR_CONNECTED':
				eventBusTriggers.triggerNotifications({
					id: uuid(),
					text: `Встречайте: ${data.payload.nickname || data.payload.carId}`,
				});
				break;
			case 'CAR_DELETE':
				eventBusTriggers.triggerNotifications({
					id: uuid(),
					text: `К сожалению ${data.payload.nickname || data.payload.carId} позвала мама`,
				});
				onCarDelete(data.payload.carId);
				break;
			case 'CAR_MOVE':
				onCarUpdate(data.payload);
				break;
			case 'BALL_MOVE':
				if (data.payload.carId === rootCarId) return;
				onBallMove(data.payload);
				break;
			default:
				break;
		}
	};

	return {
		close: () => websocket.close(),
	};
};
