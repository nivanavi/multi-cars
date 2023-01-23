import CANNON from 'cannon-es';
import { CAR_BALANCE_TYPE } from '../carControl/enums';
import { CarGraphicsCmd } from '../carGraphics';

export type CarPhysicsEmulatorCmd = {
	/**
	 * физический "мир"
	 */
	physicWorld: CANNON.World;
	/**
	 * id машины
	 */
	id: string;
	/**
	 * машина не будет тригерить событие движения
	 */
	isNotTriggerEvent?: boolean;
	/**
	 * тип предустановленных настроек машины
	 */
	balancedType: CAR_BALANCE_TYPE;
} & CarGraphicsCmd;
