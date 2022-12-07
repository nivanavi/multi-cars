import EventEmitter from 'events';
import * as CANNON from 'cannon-es';

const EVENT_EMITTER = new EventEmitter();

/* subscribeOnce: (cmd) => {
    EVENT_EMITTER.once(cmd.name, cmd.callback);
},
    subscribeNotifications: (cmd) => {
    EVENT_EMITTER.addListener(CORE_EVENTS.SHOW_NOTIFICATION, cmd.callback);
},
    unsubscribeNotifications: (cmd) => {
    EVENT_EMITTER.removeListener(CORE_EVENTS.SHOW_NOTIFICATION, cmd.callback);
},
    subscribeUserChange: (cmd) => {
    EVENT_EMITTER.addListener(CORE_EVENTS.CHANGE_USER, cmd.callback);
},
    subscribeUserChangeInit: (cmd) => {
    cmd.callback({ payload: userSelectors.getUser(store.getState().user) });
    EVENT_EMITTER.addListener(CORE_EVENTS.CHANGE_USER, cmd.callback);
}, */

enum CORE_EVENTS {
	ON_TICK = 'ON_TICK',
	ON_TICK_PHYSIC = 'ON_TICK_PHYSIC',
	ON_RESIZE = 'ON_RESIZE',
	ON_CAR_MOVE = 'ON_CAR_MOVE',
}

type SubscribeOnTickCmd = {
	callback: () => void;
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

type BodyInformation = {
	position: CANNON.Vec3;
	quaternion: CANNON.Quaternion;
};

export type CarMoveSpecs = {
	/**
	 * id движущейся машины
	 */
	id: string;
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

type TriggerOnCarMoveCmd = {
	payload: CarMoveSpecs;
};
type TriggerOnResizeCmd = {
	payload: {
		width: number;
		height: number;
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
};

export const eventBusTriggers = {
	triggerOnTick: (): void => {
		EVENT_EMITTER.emit(CORE_EVENTS.ON_TICK);
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
};
