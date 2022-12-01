import * as CANNON from 'cannon-es';
import { eventBusSubscriptions, eventBusTriggers } from '../../eventBus';

const CAR_SETTINGS = {
	chassisWidth: 1,
	chassisHeight: 0.5,
	chassisLength: 1.5,
	mass: 50,
	// скорость поворота колес
	steeringSpeed: 0.02,
	// максимальное значение выворота колес
	maxSteeringForce: Math.PI * 0.17,
	// текущее значение повернутости колес
	steering: 0,
	// максимальная скорость
	maxSpeed: 0.1,
	// максимальная скорость при бусте
	boostMaxSpeed: 0.15,
	// текущая скорость
	speed: 0,
	// мощность ускорения (что то типа лошидиных сил)
	acceleratingSpeed: 80,
	// мощность ускорения при бернауте (что то типа лошидиных сил)
	acceleratingSpeedBurnOut: 400,
	// текущее ускорение
	accelerating: 0,
	// сила торможения
	brakeForce: 0.9,
	// предыдущая позиция автомобиля
	prevPosition: new CANNON.Vec3(),
	// флаг бернаута
	isBurnOut: false,
	// время начала бернаута
	startBurnOutTime: 0,
	// продолжительность бернаута (время увеличенного ускорения)
	burnOutDelta: 300,
	// шаг отличия предыдущей позиции от текущей
	forwardDelta: 0,
	// флаг того что машина едет вперед
	isGoForward: true,
	// вектор для рассчета движения машины
	worldForward: new CANNON.Vec3(),
	up: false,
	left: false,
	down: false,
	right: false,
	brake: false,
	boost: false,
};

const WHEEL_SETTINGS = {
	radius: 0.4,
	directionLocal: new CANNON.Vec3(0, -1, 0),
	suspensionStiffness: 30,
	suspensionRestLength: 0.5,
	frictionSlip: 2,
	dampingRelaxation: 2.3,
	dampingCompression: 4.4,
	maxSuspensionForce: 100000,
	rollInfluence: 0.01,
	axleLocal: new CANNON.Vec3(0, 0, 1),
	chassisConnectionPointLocal: new CANNON.Vec3(-1, 0, 1),
	maxSuspensionTravel: 0.3,
	customSlidingRotationalSpeed: -30,
	useCustomSlidingRotationalSpeed: true,
	frontLeft: 0,
	frontRight: 1,
	backLeft: 2,
	backRight: 3,
};

// const groundShape = new CANNON.Box(new CANNON.Vec3(20, 20, 0.1));
const groundShape = new CANNON.Plane();
const groundBody = new CANNON.Body({
	mass: 0,
	// material: groundMaterial,
});

groundBody.addShape(groundShape);
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5);

export const setupCar = (physicWorld: CANNON.World): void => {
	const chassisShape = new CANNON.Box(
		new CANNON.Vec3(CAR_SETTINGS.chassisLength, CAR_SETTINGS.chassisHeight, CAR_SETTINGS.chassisWidth)
	);
	const chassisBody = new CANNON.Body({ mass: CAR_SETTINGS.mass });
	chassisBody.position.set(0, 4, 0);
	chassisBody.addShape(chassisShape);

	const vehicle = new CANNON.RaycastVehicle({
		chassisBody,
	});

	WHEEL_SETTINGS.chassisConnectionPointLocal.set(-1, 0, 1);
	vehicle.addWheel(WHEEL_SETTINGS);

	WHEEL_SETTINGS.chassisConnectionPointLocal.set(-1, 0, -1);
	vehicle.addWheel(WHEEL_SETTINGS);

	WHEEL_SETTINGS.chassisConnectionPointLocal.set(1, 0, 1);
	vehicle.addWheel(WHEEL_SETTINGS);

	WHEEL_SETTINGS.chassisConnectionPointLocal.set(1, 0, -1);
	vehicle.addWheel(WHEEL_SETTINGS);

	vehicle.addToWorld(physicWorld);
	physicWorld.addBody(chassisBody);

	physicWorld.addBody(groundBody);

	// Add the wheel bodies
	const wheelBodies: CANNON.Body[] = [];
	vehicle.wheelInfos.forEach(wheel => {
		const cylinderShape = new CANNON.Cylinder(wheel.radius, wheel.radius, wheel.radius / 2, 20);
		const wheelBody = new CANNON.Body({
			mass: 0,
			// material: wheelMaterial,
		});
		wheelBody.collisionFilterGroup = 0; // turn off collisions
		const quaternion = new CANNON.Quaternion().setFromEuler(-Math.PI / 2, 0, 0);
		wheelBody.addShape(cylinderShape, new CANNON.Vec3(), quaternion);
		wheelBodies.push(wheelBody);
		physicWorld.addBody(wheelBody);
	});
	const brake: (force: number) => void = force => {
		vehicle.setBrake(force, 0);
		vehicle.setBrake(force, 1);
		vehicle.setBrake(force, 2);
		vehicle.setBrake(force, 3);
	};
	const setSteering = (): void => {
		// проверяем не превысили ли максимально возможный выворот колес
		if (Math.abs(CAR_SETTINGS.steering) > CAR_SETTINGS.maxSteeringForce) {
			CAR_SETTINGS.steering = Math.sign(CAR_SETTINGS.steering) * CAR_SETTINGS.maxSteeringForce;
		}
		vehicle.setSteeringValue(CAR_SETTINGS.steering, WHEEL_SETTINGS.frontLeft);
		vehicle.setSteeringValue(CAR_SETTINGS.steering, WHEEL_SETTINGS.frontRight);
	};
	const steeringHandler = (): void => {
		// случай когда нажали и налево и направо или не нажаты кнопки поворота
		if ((CAR_SETTINGS.right && CAR_SETTINGS.left) || (!CAR_SETTINGS.right && !CAR_SETTINGS.left)) {
			if (Math.abs(CAR_SETTINGS.steering) > 0)
				CAR_SETTINGS.steering -= CAR_SETTINGS.steeringSpeed * Math.sign(CAR_SETTINGS.steering);
			else CAR_SETTINGS.steering = 0;

			return setSteering();
		}
		// если не нажаты оба и нажато вправо
		if (CAR_SETTINGS.right) {
			CAR_SETTINGS.steering -= CAR_SETTINGS.steeringSpeed;
			return setSteering();
		}
		// если не нажаты оба и нажато влево
		if (CAR_SETTINGS.left) {
			CAR_SETTINGS.steering += CAR_SETTINGS.steeringSpeed;
			return setSteering();
		}
	};

	const setAccelerating = (): void => {
		const currentMaxSpeed: number = CAR_SETTINGS.boost ? CAR_SETTINGS.boostMaxSpeed : CAR_SETTINGS.maxSpeed;

		// проверяем не превысили ли максимально возможную скорость (если превысили убираем ускорение) но убираем только если идет попытка ускорится в направлении превышения скорости
		if (CAR_SETTINGS.accelerating < 0 && CAR_SETTINGS.isGoForward && CAR_SETTINGS.speed > currentMaxSpeed)
			CAR_SETTINGS.accelerating = 0;
		if (CAR_SETTINGS.accelerating > 0 && !CAR_SETTINGS.isGoForward && CAR_SETTINGS.speed > currentMaxSpeed)
			CAR_SETTINGS.accelerating = 0;

		vehicle.applyEngineForce(CAR_SETTINGS.accelerating, WHEEL_SETTINGS.backLeft);
		vehicle.applyEngineForce(CAR_SETTINGS.accelerating, WHEEL_SETTINGS.backRight);

		// uncomment it for 4x4
		// vehicle.applyEngineForce(CAR_SETTINGS.accelerating, WHEEL_SETTINGS.frontLeft)
		// vehicle.applyEngineForce(CAR_SETTINGS.accelerating, WHEEL_SETTINGS.frontRight)
	};
	const accelerateHandler = (): void => {
		// если нажали и вперед и назад/ручник
		if (
			(CAR_SETTINGS.up && CAR_SETTINGS.down) ||
			(CAR_SETTINGS.up && CAR_SETTINGS.brake) ||
			(CAR_SETTINGS.down && CAR_SETTINGS.brake)
		) {
			CAR_SETTINGS.isBurnOut = true;
			CAR_SETTINGS.accelerating = 0;
			brake(CAR_SETTINGS.brakeForce);
			return setAccelerating();
		}
		// убираем торможение т.к не прошло ни одно из событий выше где оно нужно
		brake(0);

		const currentTime = Date.now();
		if (CAR_SETTINGS.isBurnOut) CAR_SETTINGS.startBurnOutTime = currentTime;
		if (CAR_SETTINGS.isBurnOut) CAR_SETTINGS.isBurnOut = false;

		// если нажато только вперед и не делали бернаут то устанавливаем ускорение вперед
		if (CAR_SETTINGS.up) {
			CAR_SETTINGS.accelerating =
				currentTime < CAR_SETTINGS.startBurnOutTime + CAR_SETTINGS.burnOutDelta
					? -CAR_SETTINGS.acceleratingSpeedBurnOut
					: -CAR_SETTINGS.acceleratingSpeed;
			return setAccelerating();
		}
		// если нажато только назад то устанавливаем ускорение назад
		if (CAR_SETTINGS.down) {
			CAR_SETTINGS.accelerating = CAR_SETTINGS.acceleratingSpeed;
			return setAccelerating();
		}
		// в противных случаях убираем ускорение
		CAR_SETTINGS.accelerating = 0;

		setAccelerating();

		// если не едем ни вперед ни назад нужно медленно остановить машину или резко если ручник
		brake(CAR_SETTINGS.brake ? CAR_SETTINGS.brakeForce : 0);
	};

	eventBusSubscriptions.subscribeOnTickPhysic({
		callback: () => {
			// рассчитываем скорость автомобиля
			const positionDelta = new CANNON.Vec3().copy(chassisBody.position).vsub(CAR_SETTINGS.prevPosition);
			CAR_SETTINGS.prevPosition.copy(chassisBody.position);
			CAR_SETTINGS.speed = positionDelta.length();

			// рассчитываем то как движется машина
			const localForward = new CANNON.Vec3(1, 0, 0);
			chassisBody.vectorToWorldFrame(localForward, CAR_SETTINGS.worldForward);
			CAR_SETTINGS.forwardDelta = CAR_SETTINGS.worldForward.dot(positionDelta);
			CAR_SETTINGS.isGoForward = CAR_SETTINGS.forwardDelta < 0;

			// обновляем физическое положение колес
			vehicle.wheelInfos.forEach((wheel, index) => {
				vehicle.updateWheelTransform(index);
				const transform = vehicle.wheelInfos[index].worldTransform;
				const wheelBody = wheelBodies[index];
				wheelBody.position.copy(transform.position);
				wheelBody.quaternion.copy(transform.quaternion);
			});

			// обновляем поворот колес
			steeringHandler();

			// обновляем ускорение автомобиля
			accelerateHandler();

			// тригерим событие движения машины
			eventBusTriggers.triggerOnCarMove({
				payload: {
					id: 'root',
					chassis: {
						position: chassisBody.position,
						quaternion: chassisBody.quaternion,
					},
					wheels: vehicle.wheelInfos.map((_, index) => ({
						position: wheelBodies[index].position,
						quaternion: wheelBodies[index].quaternion,
					})),
				},
			});
		},
	});

	const keyPressHandler: (ev: KeyboardEvent, isPressed: boolean) => void = (ev, isPressed) => {
		if (ev.repeat) return;
		switch (ev.code) {
			case 'KeyW':
				CAR_SETTINGS.up = isPressed;
				break;
			case 'KeyA':
				CAR_SETTINGS.left = isPressed;
				break;
			case 'KeyS':
				CAR_SETTINGS.down = isPressed;
				break;
			case 'KeyD':
				CAR_SETTINGS.right = isPressed;
				break;
			case 'Space':
				CAR_SETTINGS.brake = isPressed;
				break;
			case 'ShiftLeft':
				CAR_SETTINGS.boost = isPressed;
				break;
			// case 'KeyR':
			// 	respawn();
			// 	break;
			default:
				break;
		}
	};

	const windowBlurHandler = (): void => {
		CAR_SETTINGS.up = false;
		CAR_SETTINGS.left = false;
		CAR_SETTINGS.down = false;
		CAR_SETTINGS.right = false;
		CAR_SETTINGS.brake = false;
		CAR_SETTINGS.boost = false;
	};

	window.addEventListener('keydown', ev => keyPressHandler(ev, true));
	window.addEventListener('keyup', ev => keyPressHandler(ev, false));
	window.addEventListener('blur', windowBlurHandler);
};
