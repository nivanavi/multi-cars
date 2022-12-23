import EventEmitter from 'events';
import * as CANNON from 'cannon-es';

const EVENT_EMITTER = new EventEmitter();

enum CORE_EVENTS {
	ON_TICK = 'ON_TICK',
	ON_TICK_PHYSIC = 'ON_TICK_PHYSIC',
	ON_RESIZE = 'ON_RESIZE',
	ON_CAR_MOVE = 'ON_CAR_MOVE',
	ON_BALL_MOVE = 'ON_BALL_MOVE',
}

type SubscribeOnTickCmd = {
	callback: (payload: Pick<TriggerOnTickCmd, 'payload'>) => void;
};
type SubscribeOnResizeCmd = {
	callback: (payload: Pick<TriggerOnResizeCmd, 'payload'>) => void;
};
type SubscribeOnTickPhysicCmd = {
	callback: () => void;
};
type SubscribeOnCarMoveCmd = {
	callback: (payload: Pick<TriggerOnCarMoveCmd, 'payload'>) => void;
};
type SubscribeOnBallMoveCmd = {
	callback: (payload: Pick<TriggerOnBallMoveCmd, 'payload'>) => void;
};

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
	 * текущая сила торможения
	 */
	brake: number;
	/**
	 * текущее положение шасси
	 */
	chassis?: {
		position: CANNON.Vec3;
		quaternion: CANNON.Quaternion;
	};
	/**
	 * текущее положение колес
	 */
	wheels?: BodyInformation[];
	/**
	 * флаг того что с машиной ничего не происходит
	 */
	isNotMove: boolean;
};

export type BallMoveSpecs = {
	position: CANNON.Vec3;
	quaternion: CANNON.Quaternion;
};

type TriggerOnCarMoveCmd = {
	payload: {
		/**
		 * id движущейся машины
		 */
		id: string;
	} & CarMoveSpecs;
};
type TriggerOnBallMoveCmd = {
	payload: BallMoveSpecs;
};
type TriggerOnResizeCmd = {
	payload: {
		width: number;
		height: number;
	};
};
type TriggerOnTickCmd = {
	payload: {
		time: number;
	};
};

export const eventBusSubscriptions = {
	subscribeOnTick: (cmd: SubscribeOnTickCmd): void => {
		EVENT_EMITTER.addListener(CORE_EVENTS.ON_TICK, cmd.callback);
	},
	subscribeOnTickPhysic: (cmd: SubscribeOnTickPhysicCmd): void => {
		EVENT_EMITTER.addListener(CORE_EVENTS.ON_TICK_PHYSIC, cmd.callback);
	},
	subscribeOnResizeWithInit: (cmd: SubscribeOnResizeCmd): void => {
		cmd.callback({ payload: { width: window.innerWidth, height: window.innerHeight } });
		EVENT_EMITTER.addListener(CORE_EVENTS.ON_RESIZE, cmd.callback);
	},
	subscribeOnCarMove: (cmd: SubscribeOnCarMoveCmd): void => {
		EVENT_EMITTER.addListener(CORE_EVENTS.ON_CAR_MOVE, cmd.callback);
	},
	subscribeOnBallMove: (cmd: SubscribeOnBallMoveCmd): void => {
		EVENT_EMITTER.addListener(CORE_EVENTS.ON_BALL_MOVE, cmd.callback);
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
};
