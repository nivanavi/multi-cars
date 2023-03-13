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
	let CAR_SPECS: CarMoveSpecs | null = null;

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

	eventBusSubscriptions.subscribeOnTickPhysic(() => {
		if (!CAR_SPECS) return;
		// обновляем поворот колес
		vehicle.setSteeringValue(CAR_SPECS.steering, CAR_SETTINGS.frontLeft);
		vehicle.setSteeringValue(CAR_SPECS.steering, CAR_SETTINGS.frontRight);

		// обновляем ускорение автомобиля
		if (WHEEL_SETTINGS.is4x4) {
			vehicle.applyEngineForce(CAR_SPECS.accelerating, CAR_SETTINGS.frontLeft);
			vehicle.applyEngineForce(CAR_SPECS.accelerating, CAR_SETTINGS.frontRight);
			vehicle.applyEngineForce(CAR_SPECS.accelerating, CAR_SETTINGS.backLeft);
			vehicle.applyEngineForce(CAR_SPECS.accelerating, CAR_SETTINGS.backRight);
		} else {
			vehicle.applyEngineForce(CAR_SPECS.accelerating, CAR_SETTINGS.backLeft);
			vehicle.applyEngineForce(CAR_SPECS.accelerating, CAR_SETTINGS.backRight);
		}

		// обновляем торможение автомобиля
		vehicle.setBrake(CAR_SPECS.brake, 0);
		vehicle.setBrake(CAR_SPECS.brake, 1);
		vehicle.setBrake(CAR_SPECS.brake, 2);
		vehicle.setBrake(CAR_SPECS.brake, 3);

		if (CAR_SPECS.chassis) {
			vehicle.chassisBody.position.copy(CAR_SPECS.chassis.position);
			vehicle.chassisBody.quaternion.copy(CAR_SPECS.chassis.quaternion);
		}

		// обновляем физическое положение колес
		vehicle.wheelInfos.forEach((wheel, index) => {
			vehicle.updateWheelTransform(index);
		});
	});

	return {
		vehicle,
		update: (specs): void => {
			CAR_SPECS = specs;
		},
		destroy: (): void => {
			vehicle.removeFromWorld(physicWorld);
			physicWorld.removeBody(chassisBody);
		},
	};
};
