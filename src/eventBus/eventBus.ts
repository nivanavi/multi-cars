import EventEmitter from 'events';
import {
	CORE_EVENTS,
	SubscribeNotificationsCmd,
	SubscribeOnBallMoveCmd,
	SubscribeOnCarMoveCmd,
	SubscribeOnCharacterDamaged,
	SubscribeOnCharacterInterfaceUpdateCmd,
	SubscribeOnCharacterMoveCmd,
	SubscribeOnCharacterShotCmd,
	SubscribeOnCreateRootCharacterCmd,
	SubscribeOnDeleteRootCharacterCmd,
	SubscribeOnPlaySound,
	SubscribeOnResizeCmd,
	SubscribeOnTickCmd,
	SubscribeOnTickPhysicCmd,
	TriggerNotificationsCmd,
	TriggerOnBallMoveCmd,
	TriggerOnCarMoveCmd,
	TriggerOnCharacterDamagedCmd,
	TriggerOnCharacterInterfaceUpdateCmd,
	TriggerOnCharacterMoveCmd,
	TriggerOnDeleteRootCharacterCmd,
	TriggerOnPlaySound,
	TriggerOnResizeCmd,
	TriggerOnTickCmd,
} from './types';

const EVENT_EMITTER = new EventEmitter();

EVENT_EMITTER.setMaxListeners(15);

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
	subscribeOnCharacterMove: (callback: SubscribeOnCharacterMoveCmd): void => {
		EVENT_EMITTER.addListener(CORE_EVENTS.ON_CHARACTER_MOVE, callback);
	},
	subscribeOnCharacterShot: (callback: SubscribeOnCharacterShotCmd): void => {
		EVENT_EMITTER.addListener(CORE_EVENTS.ON_CHARACTER_SHOT, callback);
	},
	subscribeOnCharacterDamaged: (callback: SubscribeOnCharacterDamaged): void => {
		EVENT_EMITTER.addListener(CORE_EVENTS.ON_CHARACTER_DAMAGED, callback);
	},
	subscribeOnPlaySound: (callback: SubscribeOnPlaySound): void => {
		EVENT_EMITTER.addListener(CORE_EVENTS.ON_PLAY_SOUND, callback);
	},
	subscribeOnCharacterInterfaceUpdate: (callback: SubscribeOnCharacterInterfaceUpdateCmd): void => {
		EVENT_EMITTER.addListener(CORE_EVENTS.ON_CHARACTER_INTERFACE_UPDATE, callback);
	},
	subscribeOnDeleteRootCharacter: (callback: SubscribeOnDeleteRootCharacterCmd): void => {
		EVENT_EMITTER.addListener(CORE_EVENTS.ON_DELETE_ROOT_CHARACTER, callback);
	},
	subscribeOnCreateRootCharacter: (callback: SubscribeOnCreateRootCharacterCmd): void => {
		EVENT_EMITTER.addListener(CORE_EVENTS.ON_CREATE_ROOT_CHARACTER, callback);
	},
};

export const eventBusUnsubscribe = {
	unsubscribe: (staySubscriptions: (keyof typeof CORE_EVENTS)[]): void => {
		Object.entries(CORE_EVENTS).forEach(([key]) => {
			if (staySubscriptions.includes(key as CORE_EVENTS)) return;
			EVENT_EMITTER.removeAllListeners(key);
		});
	},
	unsubscribeOnTick: (callback: SubscribeOnTickCmd): void => {
		EVENT_EMITTER.removeListener(CORE_EVENTS.ON_TICK, callback);
	},
	unsubscribeOnTickPhysic: (callback: SubscribeOnTickPhysicCmd): void => {
		EVENT_EMITTER.removeListener(CORE_EVENTS.ON_TICK_PHYSIC, callback);
	},
	unsubscribeOnCharacterDamaged: (callback: SubscribeOnCharacterDamaged): void => {
		EVENT_EMITTER.removeListener(CORE_EVENTS.ON_CHARACTER_DAMAGED, callback);
	},
	unsubscribeOnCharacterMove: (callback: SubscribeOnCharacterMoveCmd): void => {
		EVENT_EMITTER.removeListener(CORE_EVENTS.ON_CHARACTER_MOVE, callback);
	},
	unsubscribeOnCharacterInterfaceUpdate: (callback: SubscribeOnCharacterInterfaceUpdateCmd): void => {
		EVENT_EMITTER.removeListener(CORE_EVENTS.ON_CHARACTER_INTERFACE_UPDATE, callback);
	},
	unsubscribeOnPlaySound: (callback: SubscribeOnPlaySound): void => {
		EVENT_EMITTER.removeListener(CORE_EVENTS.ON_PLAY_SOUND, callback);
	},
	unsubscribeOnDeleteRootCharacter: (callback: SubscribeOnDeleteRootCharacterCmd): void => {
		EVENT_EMITTER.removeListener(CORE_EVENTS.ON_DELETE_ROOT_CHARACTER, callback);
	},
	unsubscribeOnCreateRootCharacter: (callback: SubscribeOnCreateRootCharacterCmd): void => {
		EVENT_EMITTER.removeListener(CORE_EVENTS.ON_CREATE_ROOT_CHARACTER, callback);
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
	triggerOnCharacterMove: (payload: TriggerOnCharacterMoveCmd): void => {
		EVENT_EMITTER.emit(CORE_EVENTS.ON_CHARACTER_MOVE, payload);
	},
	triggerOnBallMove: (payload: TriggerOnBallMoveCmd): void => {
		EVENT_EMITTER.emit(CORE_EVENTS.ON_BALL_MOVE, payload);
	},
	triggerNotifications: (payload: TriggerNotificationsCmd): void => {
		EVENT_EMITTER.emit(CORE_EVENTS.ON_NOTIFICATION, payload);
	},
	triggerOnCharacterShot: (): void => {
		EVENT_EMITTER.emit(CORE_EVENTS.ON_CHARACTER_SHOT);
	},
	triggerOnCharacterInterfaceUpdate: (payload: TriggerOnCharacterInterfaceUpdateCmd): void => {
		EVENT_EMITTER.emit(CORE_EVENTS.ON_CHARACTER_INTERFACE_UPDATE, payload);
	},
	triggerOnCharacterDamaged: (payload: TriggerOnCharacterDamagedCmd): void => {
		EVENT_EMITTER.emit(CORE_EVENTS.ON_CHARACTER_DAMAGED, payload);
	},
	triggerOnPlaySound: (payload: TriggerOnPlaySound): void => {
		EVENT_EMITTER.emit(CORE_EVENTS.ON_PLAY_SOUND, payload);
	},
	triggerOnDeleteRootCharacter: (payload: TriggerOnDeleteRootCharacterCmd): void => {
		EVENT_EMITTER.emit(CORE_EVENTS.ON_DELETE_ROOT_CHARACTER, payload);
	},
	triggerOnCreateRootCharacter: (): void => {
		EVENT_EMITTER.emit(CORE_EVENTS.ON_CREATE_ROOT_CHARACTER);
	},
};
