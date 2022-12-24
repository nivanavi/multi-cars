import * as CANNON from 'cannon-es';
import { CarMoveSpecs, eventBusSubscriptions } from '../../eventBus';

const CAR_SETTINGS = {
	/**
	 * скорость поворота колес
	 */
	steeringSpeed: 0.07,
	/**
	 * максимальное значение выворота колес
	 */
	maxSteeringForce: Math.PI * 0.17,
	/**
	 * максимальная скорость
	 */
	maxSpeed: 0.25,
	/**
	 * максимальная скорость при бусте
	 */
	boostMaxSpeed: 0.4,
	/**
	 * текущая скорость
	 */
	speed: 0,
	/**
	 * мощность ускорения (что то типа лошидиных сил)
	 */
	acceleratingSpeed: 50,
	/**
	 * мощность ускорения при бернауте (что то типа лошидиных сил)
	 */
	acceleratingSpeedBurnOut: 270,
	/**
	 * сила торможения
	 */
	brakeForce: 1,
	/**
	 * предыдущая позиция автомобиля
	 */
	prevPosition: new CANNON.Vec3(),
	/**
	 * флаг бернаута
	 */
	isBurnOut: false,
	/**
	 * время начала бернаута
	 */
	startBurnOutTime: 0,
	/**
	 * продолжительность бернаута (время увеличенного ускорения)
	 */
	burnOutDelta: 300,
	/**
	 * шаг отличия предыдущей позиции от текущей
	 */
	forwardDelta: 0,
	/**
	 * флаг того что машина едет вперед
	 */
	isGoForward: true,
	/**
	 * вектор для рассчета движения машины
	 */
	worldForward: new CANNON.Vec3(),
	up: false,
	left: false,
	down: false,
	right: false,
	brake: false,
	boost: false,
};

/**
 * функция осуществляющая рассчет характеристик машины исходя их действий пользователя
 */
export const setupCarControl = (chassis: CANNON.Body, updateSpecs: (specs: CarMoveSpecs) => void): void => {
	const CURRENT_SPECS: CarMoveSpecs = {
		accelerating: 0,
		brake: 0,
		steering: 0,
	};

	const calcSpeedAndDirectionHandler = (): void => {
		// рассчитываем скорость автомобиля
		const positionDelta = new CANNON.Vec3().copy(chassis.position).vsub(CAR_SETTINGS.prevPosition);
		CAR_SETTINGS.prevPosition.copy(chassis.position);
		CAR_SETTINGS.speed = positionDelta.length();

		// рассчитываем то как движется машина
		const localForward = new CANNON.Vec3(1, 0, 0);
		chassis.vectorToWorldFrame(localForward, CAR_SETTINGS.worldForward);
		CAR_SETTINGS.forwardDelta = CAR_SETTINGS.worldForward.dot(positionDelta);
		CAR_SETTINGS.isGoForward = CAR_SETTINGS.forwardDelta < 0;
	};
	const checkCornerCaseSteering = (): void => {
		// проверяем не превысили ли максимально возможный выворот колес
		if (Math.abs(CURRENT_SPECS.steering) > CAR_SETTINGS.maxSteeringForce) {
			CURRENT_SPECS.steering = Math.sign(CURRENT_SPECS.steering) * CAR_SETTINGS.maxSteeringForce;
		}
	};
	const steeringHandler = (): void => {
		// случай когда нажали и налево и направо или не нажаты кнопки поворота
		if ((CAR_SETTINGS.right && CAR_SETTINGS.left) || (!CAR_SETTINGS.right && !CAR_SETTINGS.left)) {
			if (Math.abs(CURRENT_SPECS.steering) > 0 && Math.abs(CURRENT_SPECS.steering) > CAR_SETTINGS.steeringSpeed)
				CURRENT_SPECS.steering -= CAR_SETTINGS.steeringSpeed * Math.sign(CURRENT_SPECS.steering);
			else CURRENT_SPECS.steering = 0;

			return;
		}
		// если не нажаты оба и нажато вправо
		if (CAR_SETTINGS.right) {
			CURRENT_SPECS.steering -= CAR_SETTINGS.steeringSpeed;
			return;
		}
		// если не нажаты оба и нажато влево
		if (CAR_SETTINGS.left) {
			CURRENT_SPECS.steering += CAR_SETTINGS.steeringSpeed;
		}
	};

	const checkCornerCaseAccelerating = (): void => {
		const currentMaxSpeed: number = CAR_SETTINGS.boost ? CAR_SETTINGS.boostMaxSpeed : CAR_SETTINGS.maxSpeed;
		// проверяем не превысили ли максимально возможную скорость (если превысили убираем ускорение) но убираем только если идет попытка ускорится в направлении превышения скорости
		if (CURRENT_SPECS.accelerating < 0 && CAR_SETTINGS.isGoForward && CAR_SETTINGS.speed > currentMaxSpeed)
			CURRENT_SPECS.accelerating = 0;
		if (CURRENT_SPECS.accelerating > 0 && !CAR_SETTINGS.isGoForward && CAR_SETTINGS.speed > currentMaxSpeed)
			CURRENT_SPECS.accelerating = 0;
	};
	const accelerateHandler = (): void => {
		// если нажали и вперед и назад/ручник
		if (
			(CAR_SETTINGS.up && CAR_SETTINGS.down) ||
			(CAR_SETTINGS.up && CAR_SETTINGS.brake) ||
			(CAR_SETTINGS.down && CAR_SETTINGS.brake)
		) {
			CAR_SETTINGS.isBurnOut = true;
			CURRENT_SPECS.accelerating = 0;
			return;
		}

		const currentTime = Date.now();
		if (CAR_SETTINGS.isBurnOut) CAR_SETTINGS.startBurnOutTime = currentTime;
		if (CAR_SETTINGS.isBurnOut) CAR_SETTINGS.isBurnOut = false;

		// если нажато только вперед и не делали бернаут то устанавливаем ускорение вперед
		if (CAR_SETTINGS.up) {
			CURRENT_SPECS.accelerating =
				currentTime < CAR_SETTINGS.startBurnOutTime + CAR_SETTINGS.burnOutDelta
					? -CAR_SETTINGS.acceleratingSpeedBurnOut
					: -CAR_SETTINGS.acceleratingSpeed;
			return;
		}
		// если нажато только назад то устанавливаем ускорение назад
		if (CAR_SETTINGS.down) {
			CURRENT_SPECS.accelerating = CAR_SETTINGS.acceleratingSpeed;
			return;
		}
		// в противных случаях убираем ускорение
		CURRENT_SPECS.accelerating = 0;
	};

	const brakeHandler = (): void => {
		// если бернаут
		if (
			(CAR_SETTINGS.up && CAR_SETTINGS.down) ||
			(CAR_SETTINGS.up && CAR_SETTINGS.brake) ||
			(CAR_SETTINGS.down && CAR_SETTINGS.brake)
		) {
			CURRENT_SPECS.brake = CAR_SETTINGS.brakeForce;
			return;
		}

		// если нажат ручник или если едем вперед и нажали "назад" воспринимаем это как тормоз (так же и для вперед)
		if (
			CAR_SETTINGS.brake ||
			(CAR_SETTINGS.isGoForward && CAR_SETTINGS.down) ||
			(!CAR_SETTINGS.isGoForward && CAR_SETTINGS.up)
		) {
			CURRENT_SPECS.brake = CAR_SETTINGS.brakeForce;
		} else {
			// убираем торможение т.к не прошло ни одно из событий выше где оно нужно
			CURRENT_SPECS.brake = 0;
		}
	};

	eventBusSubscriptions.subscribeOnTickPhysic({
		callback: () => {
			// рассчитываем скорость и направление движения
			calcSpeedAndDirectionHandler();

			// обновляем поворот колес
			steeringHandler();
			checkCornerCaseSteering();

			// обновляем ускорение автомобиля
			accelerateHandler();
			checkCornerCaseAccelerating();

			// обновляем торможение
			brakeHandler();

			updateSpecs(CURRENT_SPECS);
		},
	});

	// todo сделать машинку аркаднее (интересное управление фо фан) | done
	// todo разграничение зон ответсвенности физика\графика\обновление данных с сервера | done
	// todo звуки
	// todo низкая связанность с помощью эмиттера | done
	// todo переделать крышу машины на сферу | done
	// todo интерфейс создания ника
	// todo интерфейс создания комнаты
	// todo интерфейс отправки ссылки другу
	// todo нотификация подключения и отключения
	// todo ники игроков над машинкой
	// todo моделька машины | done
	// todo моделька колес | done
	// todo respawn
	// todo написать сервер так что бы он не слал события движения машинки типа их же отправителю | done
	// todo поправить трение машины об физические объекты мапы (а то просто скользит) | done
	// todo подумать как сделать торможение на s до момента остановки а потом уже как движение назад | done
	// todo синхоронизированный мяч для катания с режимом сна
	// todo графика и удаление ее для каждой машины | done

	/** мапа
	 * звезды на небе | done
	 * смена дня и ночи | done
	 * тени в зависимости от положения солнца
	 * карта с автогенерируемыми в зависимости от типа указанного в блендере препятсвиями | done
	 *
	 * пасхалки ?
	 *
	 */
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
