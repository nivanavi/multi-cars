import * as CANNON from 'cannon-es';
import { CarMoveSpecs, eventBusSubscriptions } from '../../eventBus';
import { CAR_BALANCE_TYPE, CAR_CONTROLS_IDS } from './enums';
import { BALANCED_SETTINGS } from './consts';
import { SetupCarControlCmd } from './types';

/**
 * функция осуществляющая рассчет характеристик машины исходя их действий пользователя
 */
export const setupCarControl = (
	props: SetupCarControlCmd
): {
	destroy: () => void;
} => {
	const { vehicle, updateSpecs, balancedType } = props;
	const CAR_SETTINGS = BALANCED_SETTINGS[balancedType];

	const CURRENT_SPECS: CarMoveSpecs = {
		accelerating: 0,
		brake: 0,
		steering: 0,
	};

	const calcDirectionHandler = (): void => {
		// рассчитываем то как движется машина
		CAR_SETTINGS.isGoForward = vehicle.currentVehicleSpeedKmHour < 0;
	};

	const driftHandler = (): void => {
		if (balancedType !== CAR_BALANCE_TYPE.DRIFT) return;

		// рассчитываем цепкость задних колес для дрифта (чем сильнее выворот колес тем меньше цепкость)
		const maxFriction = 1;
		const minFriction = 0.15;
		const frictionDelta = maxFriction - minFriction;
		const steeringPercent = Math.floor(Math.abs((CURRENT_SPECS.steering * 100) / CAR_SETTINGS.maxSteeringForce));
		const currentFrictionNerf = (steeringPercent * frictionDelta) / 100;
		const currentFriction = minFriction + currentFrictionNerf;

		const currentFrictionBack = CAR_SETTINGS.isGoForward ? currentFriction : 2;
		const currentFrictionFront = CAR_SETTINGS.isGoForward ? 2.5 : 1;

		vehicle.wheelInfos.forEach((wheel, index) => {
			if ([0, 1].includes(index)) {
				wheel.frictionSlip = currentFrictionFront;
			}
			if ([2, 3].includes(index)) {
				wheel.frictionSlip = currentFrictionBack;
			}
		});
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
		const currentSpeed: number = Math.abs(vehicle.currentVehicleSpeedKmHour);
		// проверяем не превысили ли максимально возможную скорость (если превысили убираем ускорение) но убираем только если идет попытка ускорится в направлении превышения скорости
		if (CURRENT_SPECS.accelerating < 0 && CAR_SETTINGS.isGoForward && currentSpeed > currentMaxSpeed)
			CURRENT_SPECS.accelerating = 0;
		if (CURRENT_SPECS.accelerating > 0 && !CAR_SETTINGS.isGoForward && currentSpeed > currentMaxSpeed)
			CURRENT_SPECS.accelerating = 0;
	};
	const accelerateHandler = (): void => {
		// если нажали и вперед и назад/ручник и не режим дрифта
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

	const respawnHandler = (): void => {
		const currentTime = Date.now();
		if (currentTime < CAR_SETTINGS.prevRespawnTime + CAR_SETTINGS.respawnCooldown) return;
		CAR_SETTINGS.prevRespawnTime = currentTime;
		vehicle.chassisBody.applyImpulse(new CANNON.Vec3(0, 50, 0), new CANNON.Vec3(2, 0, 2));
	};

	eventBusSubscriptions.subscribeOnTickPhysic(() => {
		// рассчитываем скорость и направление движения
		calcDirectionHandler();

		// обновляем поворот колес
		steeringHandler();
		checkCornerCaseSteering();

		// обновляем ускорение автомобиля
		accelerateHandler();
		checkCornerCaseAccelerating();

		// обновляем торможение
		brakeHandler();

		driftHandler();

		updateSpecs(CURRENT_SPECS);
	});

	// todo сделать машинку аркаднее (интересное управление фо фан) | done
	// todo разграничение зон ответсвенности физика\графика\обновление данных с сервера | done
	// todo низкая связанность с помощью эмиттера | done
	// todo переделать крышу машины на сферу | done
	// todo нотификация подключения и отключения | done
	// todo моделька машины | done
	// todo моделька колес | done
	// todo написать сервер так что бы он не слал события движения машинки типа их же отправителю | done
	// todo поправить трение машины об физические объекты мапы (а то просто скользит) | done
	// todo подумать как сделать торможение на s до момента остановки а потом уже как движение назад | done
	// todo графика и удаление ее для каждой машины | done
	// todo интерфейс создания ника | done
	// todo интерфейс создания комнаты | done
	// todo интерфейс отправки ссылки другу | done
	// todo на превью машинка на подиуме | done
	// todo respawn | done
	// todo фикс камеры внутри объектов (дело в значении sides у материала из блендера выгружается не равное 0)
	// todo звуки
	// todo синхоронизированный мяч для катания с режимом сна (подумать над синхронизацией раз в сек или больше)
	// todo 3 тачки с разными балансами (как сейчас\дрифи\гонка) | done
	// todo еще один остров с трассой либо огромный мост ведущий в пустыню где перепады высот
	/** мобила
	 * выбор машины создание ника... | done
	 * поворот камерой | done
	 * приближение и отдаление камеры | done
	 * адаптация верстки под мобилу | done
	 * управление машиной | done
	 */

	/** мапа
	 * звезды на небе | done
	 * смена дня и ночи | done
	 * тени в зависимости от положения солнца | done
	 * карта с автогенерируемыми в зависимости от типа указанного в блендере препятсвиями | done
	 * наполнение карты деревья дома телепорты интерактив etc
	 * пасхалки ?
	 */

	/** интерфейс
	 * кнопка возврата в меню из игры
	 * фавиконка
	 * мб динамческий тайтл
	 */
	const keyPressHandler = (ev: KeyboardEvent): void => {
		if (ev.repeat) return;
		const isPressed = ev.type === 'keydown';
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
			case 'KeyR':
				if (!isPressed) return;
				respawnHandler();
				break;
			default:
				break;
		}
	};

	const touchPressHandler = (id: CAR_CONTROLS_IDS, isPressed: boolean): void => {
		switch (id) {
			case CAR_CONTROLS_IDS.FORWARD:
				CAR_SETTINGS.up = isPressed;
				break;
			case CAR_CONTROLS_IDS.LEFT:
				CAR_SETTINGS.left = isPressed;
				break;
			case CAR_CONTROLS_IDS.REVERS:
				CAR_SETTINGS.down = isPressed;
				break;
			case CAR_CONTROLS_IDS.RIGHT:
				CAR_SETTINGS.right = isPressed;
				break;
			case CAR_CONTROLS_IDS.BRAKE:
				CAR_SETTINGS.brake = isPressed;
				break;
			case CAR_CONTROLS_IDS.FORWARD_BOOST:
				CAR_SETTINGS.up = isPressed;
				CAR_SETTINGS.boost = isPressed;
				break;
			case CAR_CONTROLS_IDS.RESPAWN:
				if (!isPressed) return;
				respawnHandler();
				break;
			default:
				break;
		}
	};

	const touchHandler = (ev: TouchEvent): void => {
		const isPressed = ev.type === 'touchstart';
		const id = (ev?.target as HTMLElement)?.id as CAR_CONTROLS_IDS | undefined;
		if (!id || !Object.keys(CAR_CONTROLS_IDS).includes(id)) return;
		ev.preventDefault();
		touchPressHandler(id, isPressed);
	};

	const windowBlurHandler = (): void => {
		CAR_SETTINGS.up = false;
		CAR_SETTINGS.left = false;
		CAR_SETTINGS.down = false;
		CAR_SETTINGS.right = false;
		CAR_SETTINGS.brake = false;
		CAR_SETTINGS.boost = false;
	};

	window.addEventListener('touchstart', touchHandler, { passive: false });
	window.addEventListener('touchend', touchHandler, { passive: false });
	window.addEventListener('keydown', keyPressHandler);
	window.addEventListener('keyup', keyPressHandler);
	window.addEventListener('blur', windowBlurHandler);

	return {
		destroy: (): void => {
			window.removeEventListener('touchstart', touchHandler);
			window.removeEventListener('touchend', touchHandler);
			window.removeEventListener('keydown', keyPressHandler);
			window.removeEventListener('keyup', keyPressHandler);
			window.removeEventListener('blur', windowBlurHandler);
		},
	};
};
