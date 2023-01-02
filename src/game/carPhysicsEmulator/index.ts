import * as CANNON from 'cannon-es';
import { CarMoveSpecs, eventBusSubscriptions, eventBusTriggers } from '../../eventBus';
import { changeNumberSign } from '../../libs/utils';
import { carPhysicsMaterial } from '../physics';
import { CarGraphicsCmd, setupCarGraphics } from '../carGraphics';

type CarPhysicsEmulatorCmd = {
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
} & CarGraphicsCmd;

const CAR_SETTINGS = {
	chassisWidth: 1.4,
	chassisHeight: 0.6,
	chassisLength: 3,
	mass: 20,
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
	 * жесткость подвески
	 */
	suspensionStiffness: 30,
	/**
	 * на какое расстояние может двигаться подвеска
	 */
	suspensionRestLength: 0.7,
	/**
	 * отвечает за проскальзывание колес чем ниже тем более скользко
	 */
	frictionSlip: 3,
	/**
	 * сила отскока от поверхности
	 */
	dampingRelaxation: 3,
	/**
	 * сила отскока от поверхности
	 */
	dampingCompression: 3,
	/**
	 * сила подвески
	 */
	maxSuspensionForce: 100000,
	/**
	 * боковая качка от поворота
	 */
	rollInfluence: 0.37,
	/**
	 * расположение колес относительно мира
	 */
	axleLocal: new CANNON.Vec3(0, 0, 1),
	chassisConnectionPointLocal: new CANNON.Vec3(-1, 0, 1),
	/**
	 * максимальный ход подвески вниз\вверх
	 */
	maxSuspensionTravel: 0.6,
	/**
	 * хз
	 */
	// customSlidingRotationalSpeed: -1,
	// useCustomSlidingRotationalSpeed: true,
	frontLeft: 0,
	frontRight: 1,
	backLeft: 2,
	backRight: 3,
};

export const carPhysicEmulator = (
	props: CarPhysicsEmulatorCmd
): {
	delete: () => void;
	chassis: CANNON.Body;
	updateSpecs: (specs: CarMoveSpecs) => void;
} => {
	const { id, physicWorld, isNotTriggerEvent, scene, type } = props;
	let CAR_SPECS: CarMoveSpecs | null = null;

	const { updateHandler, deleteHandler: deleteGraphicHandler } = setupCarGraphics({ scene, type });

	const chassisShape = new CANNON.Box(
		new CANNON.Vec3(CAR_SETTINGS.chassisLength, CAR_SETTINGS.chassisHeight, CAR_SETTINGS.chassisWidth)
	);

	const roofShape = new CANNON.Sphere(CAR_SETTINGS.chassisHeight);

	const chassisBody = new CANNON.Body({ mass: CAR_SETTINGS.mass, material: carPhysicsMaterial });
	chassisBody.position.set(0, 5, 0);
	chassisBody.addShape(chassisShape, new CANNON.Vec3(0, 0.05, 0));
	chassisBody.allowSleep = true;
	chassisBody.addShape(
		roofShape,
		new CANNON.Vec3(CAR_SETTINGS.chassisLength / 4, CAR_SETTINGS.chassisHeight + 0.15, 0)
	);

	const vehicle = new CANNON.RaycastVehicle({
		chassisBody,
	});

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
	physicWorld.addBody(chassisBody);

	const wheelBodies: CANNON.Body[] = vehicle.wheelInfos.map(wheel => {
		const cylinderShape = new CANNON.Cylinder(wheel.radius, wheel.radius, wheel.radius / 1.5, 20);
		const wheelBody = new CANNON.Body({
			mass: 0,
		});
		wheelBody.collisionFilterGroup = 0;
		const quaternion = new CANNON.Quaternion().setFromEuler(-Math.PI / 2, 0, 0);
		wheelBody.addShape(cylinderShape, new CANNON.Vec3(), quaternion);
		physicWorld.addBody(wheelBody);
		return wheelBody;
	});

	eventBusSubscriptions.subscribeOnTickPhysic(() => {
		// обновляем физическое положение колес
		vehicle.wheelInfos.forEach((wheel, index) => {
			vehicle.updateWheelTransform(index);
			const transform = vehicle.wheelInfos[index].worldTransform;
			const wheelBody = wheelBodies[index];
			wheelBody.position.copy(transform.position);
			wheelBody.quaternion.copy(transform.quaternion);
		});

		if (!CAR_SPECS) return;
		// обновляем поворот колес
		vehicle.setSteeringValue(CAR_SPECS.steering, WHEEL_SETTINGS.frontLeft);
		vehicle.setSteeringValue(CAR_SPECS.steering, WHEEL_SETTINGS.frontRight);

		// обновляем ускорение автомобиля
		vehicle.applyEngineForce(CAR_SPECS.accelerating, WHEEL_SETTINGS.backLeft);
		vehicle.applyEngineForce(CAR_SPECS.accelerating, WHEEL_SETTINGS.backRight);

		// uncomment it for 4x4
		// vehicle.applyEngineForce(CAR_SPECS.accelerating, WHEEL_SETTINGS.frontLeft)
		// vehicle.applyEngineForce(CAR_SPECS.accelerating, WHEEL_SETTINGS.frontRight)

		// обновляем торможение автомобиля
		vehicle.setBrake(CAR_SPECS.brake, 0);
		vehicle.setBrake(CAR_SPECS.brake, 1);
		vehicle.setBrake(CAR_SPECS.brake, 2);
		vehicle.setBrake(CAR_SPECS.brake, 3);

		if (CAR_SPECS.chassis) {
			chassisBody.position.copy(CAR_SPECS.chassis.position);
			chassisBody.quaternion.copy(CAR_SPECS.chassis.quaternion);
		}

		const carMoveSpecs: CarMoveSpecs = {
			steering: CAR_SPECS.steering,
			accelerating: CAR_SPECS.accelerating,
			brake: CAR_SPECS.brake,
			chassis: {
				position: chassisBody.position,
				quaternion: chassisBody.quaternion,
			},
			wheels: vehicle.wheelInfos.map((_, index) => ({
				position: wheelBodies[index].position,
				quaternion: wheelBodies[index].quaternion,
			})),
		};
		updateHandler(carMoveSpecs);
		if (isNotTriggerEvent) return;
		eventBusTriggers.triggerOnCarMove({ id, ...carMoveSpecs });
	});

	const deleteHandler = (): void => {
		vehicle.removeFromWorld(physicWorld);
		physicWorld.removeBody(chassisBody);
		wheelBodies.forEach(wheel => physicWorld.removeBody(wheel));
		deleteGraphicHandler();
	};

	return {
		chassis: chassisBody,
		updateSpecs: (specs): void => {
			CAR_SPECS = specs;
		},
		delete: deleteHandler,
	};
};
