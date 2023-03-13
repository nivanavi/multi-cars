import CANNON from 'cannon-es';
import { Car } from '../game/car/graphics';
import { soundTypes } from '../sounds';

export enum CORE_EVENTS {
	ON_TICK = 'ON_TICK',
	ON_TICK_PHYSIC = 'ON_TICK_PHYSIC',
	ON_RESIZE = 'ON_RESIZE',
	ON_CAR_MOVE = 'ON_CAR_MOVE',
	ON_CHARACTER_MOVE = 'ON_CHARACTER_MOVE',
	ON_CHARACTER_SHOT = 'ON_CHARACTER_SHOT',
	ON_BALL_MOVE = 'ON_BALL_MOVE',
	ON_EXIT_CAR = 'ON_EXIT_CAR',
	ON_ENTER_CAR = 'ON_ENTER_CAR',
	ON_NOTIFICATION = 'ON_NOTIFICATION',
	ON_CHARACTER_DAMAGED = 'ON_CHARACTER_DAMAGED',
	ON_PLAY_SOUND = 'ON_PLAY_SOUND',
}

export type BodyInformation = {
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
	 * текущее торможение
	 */
	brake: number;
	/**
	 * тип модели авто
	 */
	type?: Car;
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
};

export type CharacterMoveSpecs = {
	/**
	 * текущая позиция персонажа
	 */
	position: CANNON.Vec3;
	/**
	 * текущий поворот персонажа
	 */
	quaternion: CANNON.Quaternion;
	/**
	 * наклон персонажа
	 */
	rotateX: number;
};

export type CharacterDamaged = {
	/**
	 * id персонажа получившего урон
	 */
	idDamaged: string;
	/**
	 * id персонажа нанесшего урон
	 */
	idDamaging: string;
	/**
	 * количество урона
	 */
	damage: number;
};

export type BallMoveSpecs = {
	position: CANNON.Vec3;
	quaternion: CANNON.Quaternion;
};

export type NotificationMessage = {
	id: string;
	text: string;
};

export type SubscribeOnCharacterDamaged = (payload: TriggerOnCharacterDamagedCmd) => void;
export type SubscribeOnPlaySound = (payload: TriggerOnPlaySound) => void;
export type SubscribeOnTickCmd = (payload: TriggerOnTickCmd) => void;
export type SubscribeNotificationsCmd = (payload: TriggerNotificationsCmd) => void;
export type SubscribeOnResizeCmd = (payload: TriggerOnResizeCmd) => void;
export type SubscribeOnTickPhysicCmd = () => void;
export type SubscribeOnEnterCarCmd = () => void;
export type SubscribeOnCharacterShotCmd = () => void;
export type SubscribeOnExitCarCmd = (payload: TriggerOnExitCarCmd) => void;
export type SubscribeOnCarMoveCmd = (payload: TriggerOnCarMoveCmd) => void;
export type SubscribeOnBallMoveCmd = (payload: TriggerOnBallMoveCmd) => void;
export type SubscribeOnCharacterMoveCmd = (payload: TriggerOnCharacterMoveCmd) => void;

export type TriggerOnCarMoveCmd = {
	/**
	 * id движущейся машины
	 */
	id: string;
} & CarMoveSpecs;

export type TriggerOnCharacterMoveCmd = {
	/**
	 * id движущегося персонажа
	 */
	id: string;
} & CharacterMoveSpecs;

export type TriggerOnBallMoveCmd = BallMoveSpecs;
export type TriggerOnResizeCmd = {
	width: number;
	height: number;
};
export type TriggerOnPlaySound = {
	sound: soundTypes;
	velocity: number;
};
export type TriggerOnCharacterDamagedCmd = CharacterDamaged;
export type TriggerOnExitCarCmd = {
	/**
	 * позиция где производится выход
	 */
	position: CANNON.Vec3;
};
export type TriggerOnTickCmd = {
	time: number;
	delta: number;
};

export type TriggerNotificationsCmd = NotificationMessage;
