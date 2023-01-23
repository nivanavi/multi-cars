import * as CANNON from 'cannon-es';
import { CAR_BALANCE_TYPE } from '../carControl/enums';

export const CAR_SETTINGS = {
	chassisWidth: 1.4,
	chassisHeight: 0.6,
	chassisLength: 3,
	mass: 20,
	frontLeft: 0,
	frontRight: 1,
	backLeft: 2,
	backRight: 3,
};

const WHEEL_SETTINGS = {
	/**
	 * радиус колеса
	 */
	radius: 0.6,
	/**
	 * высота прикрепления колес
	 */
	directionLocal: new CANNON.Vec3(0, -1, 0),
	/**
	 * расположение колес относительно мира
	 */
	axleLocal: new CANNON.Vec3(0, 0, 1),
	/**
	 * расположение колеса меняется для каждого индивидуально
	 */
	chassisConnectionPointLocal: new CANNON.Vec3(-1, 0, 1),
	/**
	 * сила отскока от поверхности
	 */
	dampingRelaxation: 3,
	/**
	 * сила отскока от поверхности
	 */
	dampingCompression: 3,
	/**
	 * на какое расстояние может двигаться подвеска
	 */
	suspensionRestLength: 0.7,
	/**
	 * сила подвески
	 */
	maxSuspensionForce: 100000,
	/**
	 * максимальный ход подвески вниз\вверх
	 */
	maxSuspensionTravel: 0.6,
};

export const BALANCED_WHEEL_SETTINGS = {
	[CAR_BALANCE_TYPE.FAN]: {
		...WHEEL_SETTINGS,
		/**
		 * флаг переднего привода
		 */
		isFrontWheelDrive: false,
		/**
		 * жесткость подвески
		 */
		suspensionStiffness: 30,
		/**
		 * отвечает за проскальзывание колес чем ниже тем более скользко
		 */
		frictionSlip: 3,
		/**
		 * боковая качка от поворота
		 */
		rollInfluence: 0.37,
	},
	[CAR_BALANCE_TYPE.DRIFT]: {
		...WHEEL_SETTINGS,
		/**
		 * флаг переднего привода
		 */
		isFrontWheelDrive: true,
		/**
		 * жесткость подвески
		 */
		suspensionStiffness: 30,
		/**
		 * отвечает за проскальзывание колес чем ниже тем более скользко
		 */
		frictionSlip: 2.5,
		/**
		 * боковая качка от поворота
		 */
		rollInfluence: 0.3,
	},
	[CAR_BALANCE_TYPE.SPEED]: {
		...WHEEL_SETTINGS,
		/**
		 * флаг переднего привода
		 */
		isFrontWheelDrive: false,
		/**
		 * жесткость подвески
		 */
		suspensionStiffness: 30,
		/**
		 * отвечает за проскальзывание колес чем ниже тем более скользко
		 */
		frictionSlip: 4,
		/**
		 * боковая качка от поворота
		 */
		rollInfluence: 0.2,
	},
};
