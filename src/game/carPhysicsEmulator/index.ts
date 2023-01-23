import * as CANNON from 'cannon-es';
import { CarMoveSpecs, eventBusSubscriptions, eventBusTriggers } from '../../eventBus';
import { changeNumberSign } from '../../libs/utils';
import { carPhysicsMaterial } from '../physics';
import { setupCarGraphics } from '../carGraphics';
import { BALANCED_WHEEL_SETTINGS, CAR_SETTINGS } from './consts';
import { CarPhysicsEmulatorCmd } from './types';

export const carPhysicEmulator = (
	props: CarPhysicsEmulatorCmd
): {
	delete: () => void;
	vehicle: CANNON.RaycastVehicle;
	update: (specs: CarMoveSpecs) => void;
} => {
	const { id, physicWorld, isNotTriggerEvent, scene, type, balancedType } = props;
	let CAR_SPECS: CarMoveSpecs | null = null;

	const { updateHandler, deleteHandler: deleteGraphicHandler } = setupCarGraphics({ scene, type });

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

	const WHEEL_SETTINGS = BALANCED_WHEEL_SETTINGS[balancedType];

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
		if (WHEEL_SETTINGS.isFrontWheelDrive) {
			vehicle.applyEngineForce(CAR_SPECS.accelerating, CAR_SETTINGS.frontLeft);
			vehicle.applyEngineForce(CAR_SPECS.accelerating, CAR_SETTINGS.frontRight);
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

		const carMoveSpecs: CarMoveSpecs = {
			steering: CAR_SPECS.steering,
			accelerating: CAR_SPECS.accelerating,
			brake: CAR_SPECS.brake,
			type,
			chassis: {
				position: vehicle.chassisBody.position,
				quaternion: vehicle.chassisBody.quaternion,
			},
			wheels: vehicle.wheelInfos.map((_, index) => ({
				position: vehicle.wheelInfos[index].worldTransform.position,
				quaternion: vehicle.wheelInfos[index].worldTransform.quaternion,
			})),
		};
		updateHandler(carMoveSpecs);
		if (isNotTriggerEvent) return;
		eventBusTriggers.triggerOnCarMove({ id, ...carMoveSpecs });
	});

	const deleteHandler = (): void => {
		vehicle.removeFromWorld(physicWorld);
		physicWorld.removeBody(chassisBody);
		deleteGraphicHandler();
	};

	return {
		vehicle,
		update: (specs): void => {
			CAR_SPECS = specs;
		},
		delete: deleteHandler,
	};
};
