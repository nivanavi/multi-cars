import CANNON from 'cannon-es';
import { CarMoveSpecs } from '../../../eventBus';
import { Car } from '../graphics';

export type SetupCarControlCmd = {
	vehicle: CANNON.RaycastVehicle;
	updateSpecs: (specs: CarMoveSpecs) => void;
	/**
	 * id машины
	 */
	id: string;
	type: Car;
};
