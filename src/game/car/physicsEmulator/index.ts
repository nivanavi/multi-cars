import * as CANNON from 'cannon-es';
import { CarMoveSpecs, eventBusSubscriptions } from '../../../eventBus';
import { changeNumberSign } from '../../../libs/utils';
import { carPhysicsMaterial } from '../../physics';
import { CAR_SETTINGS, WHEEL_SETTINGS } from './consts';
import { CarPhysicsEmulatorCmd } from './types';

export const carPhysicsEmulator = (
	props: CarPhysicsEmulatorCmd
): {
	destroy: () => void;
	vehicle: CANNON.RaycastVehicle;
	update: (specs: CarMoveSpecs) => void;
} => {
	const { physicWorld } = props;

	const chassisShape = new CANNON.Box(
		new CANNON.Vec3(CAR_SETTINGS.chassisLength, CAR_SETTINGS.chassisHeight, CAR_SETTINGS.chassisWidth)
	);

	const roofShape = new CANNON.Sphere(CAR_SETTINGS.chassisHeight);

	const chassisBody = new CANNON.Body({ mass: CAR_SETTINGS.mass, material: carPhysicsMaterial });
	chassisBody.addShape(chassisShape, new CANNON.Vec3(0, 0.05, 0));
	chassisBody.allowSleep = true;
	chassisBody.addShape(
		roofShape,
		new CANNON.Vec3(CAR_SETTINGS.chassisLength / 4, CAR_SETTINGS.chassisHeight + 0.15, 0)
	);

	const vehicle = new CANNON.RaycastVehicle({
		chassisBody,
	});
	vehicle.chassisBody.position.set(0, 5, 0);

	WHEEL_SETTINGS.chassisConnectionPointLocal.set(
		-((CAR_SETTINGS.chassisLength * 60) / 100),
		0,
		CAR_SETTINGS.chassisWidth - WHEEL_SETTINGS.radius / 3
	);
	vehicle.addWheel(WHEEL_SETTINGS);

	WHEEL_SETTINGS.chassisConnectionPointLocal.set(
		-((CAR_SETTINGS.chassisLength * 60) / 100),
		0,
		changeNumberSign(CAR_SETTINGS.chassisWidth - WHEEL_SETTINGS.radius / 3)
	);
	vehicle.addWheel(WHEEL_SETTINGS);

	WHEEL_SETTINGS.chassisConnectionPointLocal.set(
		(CAR_SETTINGS.chassisLength * 65) / 100,
		0,
		CAR_SETTINGS.chassisWidth - WHEEL_SETTINGS.radius / 3
	);
	vehicle.addWheel(WHEEL_SETTINGS);

	WHEEL_SETTINGS.chassisConnectionPointLocal.set(
		(CAR_SETTINGS.chassisLength * 65) / 100,
		0,
		changeNumberSign(CAR_SETTINGS.chassisWidth - WHEEL_SETTINGS.radius / 3)
	);
	vehicle.addWheel(WHEEL_SETTINGS);

	vehicle.addToWorld(physicWorld);

	return {
		vehicle,
		update: (specs): void => {
			// обновляем поворот колес
			vehicle.setSteeringValue(specs.steering, CAR_SETTINGS.frontLeft);
			vehicle.setSteeringValue(specs.steering, CAR_SETTINGS.frontRight);

			// обновляем ускорение автомобиля
			if (WHEEL_SETTINGS.is4x4) {
				vehicle.applyEngineForce(specs.accelerating, CAR_SETTINGS.frontLeft);
				vehicle.applyEngineForce(specs.accelerating, CAR_SETTINGS.frontRight);
				vehicle.applyEngineForce(specs.accelerating, CAR_SETTINGS.backLeft);
				vehicle.applyEngineForce(specs.accelerating, CAR_SETTINGS.backRight);
			} else {
				vehicle.applyEngineForce(specs.accelerating, CAR_SETTINGS.backLeft);
				vehicle.applyEngineForce(specs.accelerating, CAR_SETTINGS.backRight);
			}

			// обновляем торможение автомобиля
			vehicle.setBrake(specs.brake, 0);
			vehicle.setBrake(specs.brake, 1);
			vehicle.setBrake(specs.brake, 2);
			vehicle.setBrake(specs.brake, 3);

			if (specs.chassis) {
				vehicle.chassisBody.position.copy(specs.chassis.position);
				vehicle.chassisBody.quaternion.copy(specs.chassis.quaternion);
			}

			// обновляем физическое положение колес
			vehicle.wheelInfos.forEach((wheel, index) => {
				vehicle.updateWheelTransform(index);
			});
		},
		destroy: (): void => {
			vehicle.removeFromWorld(physicWorld);
			physicWorld.removeBody(chassisBody);
		},
	};
};
