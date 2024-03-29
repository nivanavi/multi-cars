import { isJsonString, uuid } from '../libs/utils';
import {
	eventBusSubscriptions,
	eventBusTriggers,
	BallMoveSpecs,
	CarMoveSpecs,
	CharacterDamaged,
	CharacterMoveSpecs,
	TriggerOnDeleteRootCharacterCmd,
	DeleteCharacterReasons,
} from '../eventBus';

type GeneralMessageProps = { id: string; roomId: string; nickname?: string };
type WebsocketMessages =
	| { action: 'DISCONNECT'; payload: GeneralMessageProps }
	| { action: 'CONNECT'; payload: GeneralMessageProps }
	| { action: 'CLIENT_SYNC'; payload: ClientData & GeneralMessageProps }
	| { action: 'CHARACTER_DELETE'; payload: GeneralMessageProps & TriggerOnDeleteRootCharacterCmd }
	| { action: 'CHARACTER_SHOT'; payload: GeneralMessageProps }
	| { action: 'CHARACTER_DAMAGED'; payload: GeneralMessageProps & CharacterDamaged };
const WS_URL = process.env.REACT_APP_WS_URL || '';

type WebsocketProps = {
	rootId: string;
	nickname: string;
	roomId: string;
	onDisconnect: (id: string) => void;
	onCarUpdate: (data: { id: string } & CarMoveSpecs) => void;
	onCharacterUpdate: (data: { id: string } & CharacterMoveSpecs) => void;
	onCharacterDamaged: (data: CharacterDamaged) => void;
	onCharacterDelete: (id: string) => void;
	onCharacterShot: (id: string) => void;
	onBallUpdate: (data: BallMoveSpecs) => void;
};

type ClientData = {
	character?: CharacterMoveSpecs;
	car?: CarMoveSpecs;
	ball?: BallMoveSpecs;
};

export const setupWebsocket = (
	props: WebsocketProps
): {
	close: () => void;
} => {
	const {
		rootId,
		roomId,
		nickname,
		onDisconnect,
		onCarUpdate,
		onBallUpdate,
		onCharacterUpdate,
		onCharacterDelete,
		onCharacterShot,
		onCharacterDamaged,
	} = props;

	const websocket = new WebSocket(WS_URL);

	const clientData: ClientData = {};

	const sendMessages = (message: WebsocketMessages): void => {
		if (websocket.readyState !== 1) return;
		websocket.send(JSON.stringify(message));
	};

	websocket.onopen = (): void => {
		sendMessages({
			action: 'CONNECT',
			payload: { id: rootId, roomId, nickname },
		});
	};

	eventBusSubscriptions.subscribeOnCarMove(({ chassis, wheels, steering, type, accelerating, brake }) => {
		clientData.car = { chassis, steering, type, accelerating, brake, wheels };
	});

	eventBusSubscriptions.subscribeOnCharacterMove(({ position, rotateY, rotateX }) => {
		clientData.character = { position, rotateY, rotateX };
	});

	eventBusSubscriptions.subscribeOnCharacterShot(() => {
		sendMessages({
			action: 'CHARACTER_SHOT',
			payload: { id: rootId, roomId, nickname },
		});
	});

	eventBusSubscriptions.subscribeOnDeleteRootCharacter(payload => {
		clientData.character = undefined;
		sendMessages({
			action: 'CHARACTER_DELETE',
			payload: {
				id: rootId,
				roomId,
				nickname,
				...payload,
			},
		});
	});

	eventBusSubscriptions.subscribeOnCharacterDamaged(data => {
		sendMessages({
			action: 'CHARACTER_DAMAGED',
			payload: {
				id: rootId,
				roomId,
				...data,
			},
		});
	});

	eventBusSubscriptions.subscribeOnBallMove(({ position, quaternion }) => {
		clientData.ball = { position, quaternion };
	});

	eventBusSubscriptions.subscribeOnTickPhysic(() => {
		sendMessages({
			action: 'CLIENT_SYNC',
			payload: {
				...clientData,
				roomId,
				nickname,
				id: rootId,
			},
		});
	});

	websocket.onmessage = (message): void => {
		if (!isJsonString(message.data)) return;
		const data: WebsocketMessages = JSON.parse(message.data);
		switch (data.action) {
			case 'CONNECT':
				eventBusTriggers.triggerNotifications({
					id: uuid(),
					text: `Встречайте: ${data.payload.nickname || data.payload.id}`,
				});
				break;
			case 'DISCONNECT':
				eventBusTriggers.triggerNotifications({
					id: uuid(),
					text: `К сожалению ${data.payload.nickname || data.payload.id} позвала мама`,
				});
				onDisconnect(data.payload.id);
				break;
			case 'CLIENT_SYNC':
				if (data.payload.ball) onBallUpdate(data.payload.ball);
				if (data.payload.character)
					onCharacterUpdate({
						id: data.payload.id,
						...data.payload.character,
					});
				if (data.payload.car) onCarUpdate({ id: data.payload.id, ...data.payload.car });
				break;
			case 'CHARACTER_DELETE':
				switch (data.payload.reason) {
					case DeleteCharacterReasons.DEAD_BY_CAR:
						eventBusTriggers.triggerNotifications({
							id: uuid(),
							text: `Игрок ${data.payload.nickname || data.payload.id} расплющен машиной`,
						});
						break;
					case DeleteCharacterReasons.DEAD_BY_PLAYER:
						eventBusTriggers.triggerNotifications({
							id: uuid(),
							text: `Игрок ${data.payload.killerNickname || 'unknown'} убил игрока ${
								data.payload.nickname || data.payload.id
							}`,
						});
						break;
					default:
						break;
				}
				onCharacterDelete(data.payload.id);
				break;
			case 'CHARACTER_DAMAGED':
				onCharacterDamaged(data.payload);
				break;
			case 'CHARACTER_SHOT':
				onCharacterShot(data.payload.id);
				break;
			default:
				break;
		}
	};

	return {
		close: () => websocket.close(),
	};
};
