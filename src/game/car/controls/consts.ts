export const CAR_SETTINGS = {
	/**
	 * скорость поворота колес
	 */
	steeringSpeed: 0.07,
	/**
	 * сила торможения
	 */
	brakeForce: 1,
	/**
	 * сила торможения
	 */
	slowDownBrakeForce: 0.1,
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
	/**
	 * флаг управления вводом пользователя
	 */
	isNowControlled: true,
	up: false,
	left: false,
	down: false,
	right: false,
	brake: false,
	boost: false,
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
};

export const DEFAULT_CAR_SPECS = {
	accelerating: 0,
	brake: 0,
	steering: 0,
};
