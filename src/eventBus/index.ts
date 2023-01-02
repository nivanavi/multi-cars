import EventEmitter from 'events';
import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { Car } from '../game/carGraphics';

const EVENT_EMITTER = new EventEmitter();

enum CORE_EVENTS {
	ON_TICK = 'ON_TICK',
	ON_TICK_PHYSIC = 'ON_TICK_PHYSIC',
	ON_RESIZE = 'ON_RESIZE',
	ON_CAR_MOVE = 'ON_CAR_MOVE',
	ON_BALL_MOVE = 'ON_BALL_MOVE',
	ON_NOTIFICATION = 'ON_NOTIFICATION',
}

type BodyInformation = {
	position: CANNON.Vec3;
	quaternion: CANNON.Quaternion;
};

export type CarMoveSpecs = {
	/**
	 * текущее значение повернутости колес
	 */
	steering: number;
	/**
	 * текущее ускорение машины
	 */
	accelerating: number;
	/**
	 * текущее положение шасси
	 */
	brake: number;
	/**
	 * текущее положение шасси
	 */
	/**
	 * тип модели авто
	 */
	type?: Car;
	chassis?: {
		position: CANNON.Vec3;
		quaternion: CANNON.Quaternion;
	};
	/**
	 * текущее положение колес
	 */
	wheels?: BodyInformation[];
};

export type BallMoveSpecs = {
	position: CANNON.Vec3;
	quaternion: CANNON.Quaternion;
};

export type NotificationMessage = {
	id: string;
	text: string;
};

export type SubscribeOnTickCmd = (payload: TriggerOnTickCmd) => void;
export type SubscribeNotificationsCmd = (payload: TriggerNotificationsCmd) => void;
export type SubscribeOnResizeCmd = (payload: TriggerOnResizeCmd) => void;
export type SubscribeOnTickPhysicCmd = () => void;
export type SubscribeOnCarMoveCmd = (payload: TriggerOnCarMoveCmd) => void;
export type SubscribeOnBallMoveCmd = (payload: TriggerOnBallMoveCmd) => void;

export type TriggerOnCarMoveCmd = {
	/**
	 * id движущейся машины
	 */
	id: string;
} & CarMoveSpecs;

export type TriggerOnBallMoveCmd = BallMoveSpecs;
export type TriggerOnResizeCmd = {
	width: number;
	height: number;
};
export type TriggerOnTickCmd = {
	time: number;
};
export type TriggerNotificationsCmd = NotificationMessage;

export const eventBusSubscriptions = {
	subscribeOnTick: (callback: SubscribeOnTickCmd): void => {
		EVENT_EMITTER.addListener(CORE_EVENTS.ON_TICK, callback);
	},
	subscribeOnTickPhysic: (callback: SubscribeOnTickPhysicCmd): void => {
		EVENT_EMITTER.addListener(CORE_EVENTS.ON_TICK_PHYSIC, callback);
	},
	subscribeOnResizeWithInit: (callback: SubscribeOnResizeCmd): void => {
		callback({ width: window.innerWidth, height: window.innerHeight });
		EVENT_EMITTER.addListener(CORE_EVENTS.ON_RESIZE, callback);
	},
	subscribeOnCarMove: (callback: SubscribeOnCarMoveCmd): void => {
		EVENT_EMITTER.addListener(CORE_EVENTS.ON_CAR_MOVE, callback);
	},
	subscribeOnBallMove: (callback: SubscribeOnBallMoveCmd): void => {
		EVENT_EMITTER.addListener(CORE_EVENTS.ON_BALL_MOVE, callback);
	},
	subscribeNotifications: (callback: SubscribeNotificationsCmd): void => {
		EVENT_EMITTER.addListener(CORE_EVENTS.ON_NOTIFICATION, callback);
	},
	unsubscribe: (staySubscriptions: (keyof typeof CORE_EVENTS)[]): void => {
		Object.entries(CORE_EVENTS).forEach(([key]) => {
			if (staySubscriptions.includes(key as CORE_EVENTS)) return;
			EVENT_EMITTER.removeAllListeners(key);
		});
	},
};

export const eventBusTriggers = {
	triggerOnTick: (payload: TriggerOnTickCmd): void => {
		EVENT_EMITTER.emit(CORE_EVENTS.ON_TICK, payload);
	},
	triggerOnResize: (payload: TriggerOnResizeCmd): void => {
		EVENT_EMITTER.emit(CORE_EVENTS.ON_RESIZE, payload);
	},
	triggerOnTickPhysic: (): void => {
		EVENT_EMITTER.emit(CORE_EVENTS.ON_TICK_PHYSIC);
	},
	triggerOnCarMove: (payload: TriggerOnCarMoveCmd): void => {
		EVENT_EMITTER.emit(CORE_EVENTS.ON_CAR_MOVE, payload);
	},
	triggerOnBallMove: (payload: TriggerOnBallMoveCmd): void => {
		EVENT_EMITTER.emit(CORE_EVENTS.ON_BALL_MOVE, payload);
	},
	triggerNotifications: (payload: TriggerNotificationsCmd): void => {
		EVENT_EMITTER.emit(CORE_EVENTS.ON_NOTIFICATION, payload);
	},
};

setInterval(() => {
	console.log(
		'listeners',
		Object.entries(CORE_EVENTS).reduce<string[]>((prev, [key]) => {
			prev.push(`${key} - ${EVENT_EMITTER.listenerCount(key)}`);
			return prev;
		}, [])
	);
}, 1000);

const CLOCK = new THREE.Clock();
const updateSize = (): void => {
	eventBusTriggers.triggerOnResize({
		width: window.innerWidth,
		height: window.innerHeight,
	});
};

window.addEventListener('resize', updateSize);

const tick = (): void => {
	const time = CLOCK.getElapsedTime();
	eventBusTriggers.triggerOnTick({ time });

	window.requestAnimationFrame(tick);
};
window.requestAnimationFrame(tick);
