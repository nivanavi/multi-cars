import CANNON from 'cannon-es';
import { CarMoveSpecs } from '../../eventBus';
import { CAR_BALANCE_TYPE } from './enums';

export type SetupCarControlCmd = {
	vehicle: CANNON.RaycastVehicle;
	updateSpecs: (specs: CarMoveSpecs) => void;
	balancedType: CAR_BALANCE_TYPE;
};
