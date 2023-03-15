import CANNON from 'cannon-es';
import { Car } from '../graphics';

export type SetupCarControlCmd = {
	vehicle: CANNON.RaycastVehicle;
	/**
	 * id машины
	 */
	id: string;
	type: Car;
};
