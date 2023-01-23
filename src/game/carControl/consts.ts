import { CAR_BALANCE_TYPE } from './enums';

const CAR_SETTINGS = {
	/**
	 * скорость поворота колес
	 */
	steeringSpeed: 0.07,
	/**
	 * сила торможения
	 */
	brakeForce: 1,
	/**
	 * когда пробовал последний раз встать на колеса
	 */
	prevRespawnTime: 0,
	/**
	 * когда пробовал последний раз встать на колеса
	 */
	respawnCooldown: 1500,
	/**
	 * флаг бернаута
	 */
	isBurnOut: false,
	/**
	 * время начала бернаута
	 */
	startBurnOutTime: 0,
	/**
	 * продолжительность бернаута (время увеличенного ускорения)
	 */
	burnOutDelta: 300,
	/**
	 * флаг того что машина едет вперед
	 */
	isGoForward: true,
	up: false,
	left: false,
	down: false,
	right: false,
	brake: false,
	boost: false,
};

export const BALANCED_SETTINGS = {
	[CAR_BALANCE_TYPE.FAN]: {
		...CAR_SETTINGS,
		/**
		 * максимальное значение выворота колес
		 */
		maxSteeringForce: Math.PI * 0.17,
		/**
		 * максимальная скорость км.ч
		 */
		maxSpeed: 55,
		/**
		 * максимальная скорость при бусте
		 */
		boostMaxSpeed: 90,
		/**
		 * мощность ускорения (что то типа лошидиных сил)
		 */
		acceleratingSpeed: 50,
		/**
		 * мощность ускорения при бернауте (что то типа лошидиных сил)
		 */
		acceleratingSpeedBurnOut: 270,
	},
	[CAR_BALANCE_TYPE.DRIFT]: {
		...CAR_SETTINGS,
		/**
		 * максимальное значение выворота колес
		 */
		maxSteeringForce: Math.PI * 0.21,
		/**
		 * максимальная скорость
		 */
		maxSpeed: 60,
		/**
		 * максимальная скорость при бусте
		 */
		boostMaxSpeed: 90,
		/**
		 * мощность ускорения (что то типа лошидиных сил)
		 */
		acceleratingSpeed: 90,
		/**
		 * мощность ускорения при бернауте (что то типа лошидиных сил)
		 */
		acceleratingSpeedBurnOut: 90,
	},
	[CAR_BALANCE_TYPE.SPEED]: {
		...CAR_SETTINGS,
		/**
		 * максимальное значение выворота колес
		 */
		maxSteeringForce: Math.PI * 0.15,
		/**
		 * максимальная скорость
		 */
		maxSpeed: 75,
		/**
		 * максимальная скорость при бусте
		 */
		boostMaxSpeed: 110,
		/**
		 * мощность ускорения (что то типа лошидиных сил)
		 */
		acceleratingSpeed: 80,
		/**
		 * мощность ускорения при бернауте (что то типа лошидиных сил)
		 */
		acceleratingSpeedBurnOut: 80,
	},
};
