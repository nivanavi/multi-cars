import * as CANNON from 'cannon-es';
import { CarMoveSpecs, eventBusSubscriptions, eventBusTriggers } from '../../../eventBus';
import { CAR_CONTROLS_IDS } from './enums';
import { DEFAULT_CAR_SPECS } from './consts';
import { SetupCarControlCmd } from './types';

/**
 * функция осуществляющая рассчет характеристик машины исходя их действий пользователя
 */
export const setupCarControl = (
	props: SetupCarControlCmd
): {
	destroy: () => void;
} => {
	const { id, type, vehicle, updateSpecs } = props;

	const CAR_SETTINGS = {
		/**
		 * скорость поворота колес
		 */
		steeringSpeed: 0.07,
		/**
		 * сила торможения
		 */
		brakeForce: 1,
		/**
		 * сила торможения
		 */
		slowDownBrakeForce: 0.1,
		/**
		 * когда пробовал последний раз встать на колеса
		 */
		prevRespawnTime: 0,
		/**
		 * когда пробовал последний раз встать на колеса
		 */
		respawnCooldown: 1500,
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
		 * флаг того что машина едет вперед
		 */
		isGoForward: true,
		/**
		 * флаг управления вводом пользователя
		 */
		isNowControlled: true,
		up: false,
		left: false,
		down: false,
		right: false,
		brake: false,
		boost: false,
		/**
		 * максимальное значение выворота колес
		 */
		maxSteeringForce: Math.PI * 0.17,
		/**
		 * максимальная скорость км.ч
		 */
		maxSpeed: 55,
		/**
		 * максимальная скорость при бусте
		 */
		boostMaxSpeed: 90,
		/**
		 * мощность ускорения (что то типа лошидиных сил)
		 */
		acceleratingSpeed: 50,
		/**
		 * мощность ускорения при бернауте (что то типа лошидиных сил)
		 */
		acceleratingSpeedBurnOut: 270,
	};

	const CURRENT_SPECS: CarMoveSpecs = { ...DEFAULT_CAR_SPECS };

	const calcDirectionHandler = (): void => {
		// рассчитываем то как движется машина
		CAR_SETTINGS.isGoForward = vehicle.currentVehicleSpeedKmHour < 0;
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

		const currentTime = performance.now();
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
			return;
		}

		// убираем торможение т.к не прошло ни одно из событий выше где оно нужно
		CURRENT_SPECS.brake = 0;
	};

	const respawnHandler = (): void => {
		const currentTime = performance.now();
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

		updateSpecs(CURRENT_SPECS);

		const carMoveSpecs: CarMoveSpecs = {
			steering: CURRENT_SPECS.steering,
			accelerating: CURRENT_SPECS.accelerating,
			brake: CURRENT_SPECS.brake,
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

		eventBusTriggers.triggerOnCarMove({ id, ...carMoveSpecs });
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
	// todo синхоронизированный мяч для катания | done
	// todo 3 тачки с разными балансами (как сейчас\дрифи\гонка) было сделано но выпилил т.к не доволен результатом | done

	// todo фикс камеры внутри объектов (дело в значении sides у материала из блендера выгружается не равное 0)
	// todo звуки

	/** мобила
	 * выбор машины создание ника... | done
	 * поворот камерой | done
	 * приближение и отдаление камеры | done
	 * адаптация верстки под мобилу | done
	 * управление машиной | done
	 * управление персонажем
	 */

	/** мапа
	 * звезды на небе | done
	 * смена дня и ночи | done
	 * тени в зависимости от положения солнца | done
	 * карта с автогенерируемыми в зависимости от типа указанного в блендере препятсвиями | done
	 * еще один остров с трассой либо огромный мост ведущий в пустыню где перепады высот
	 * наполнение карты деревья дома телепорты интерактив etc
	 * пасхалки (нло) крутится над головой видно только если играем за персонажа на нее можно запрыгнуть с помощью дробовика
	 */

	/** интерфейс
	 * кнопка возврата в меню из игры | done
	 * фавиконка
	 * мб динамческий тайтл
	 */

	/** персонаж
	 * выход из машины с переключением камеры на персонажа | done
	 * если стрелять находясь в воздухе то будет подбрасывать вверх | done
	 * реализовать нанесение урона при 0хп будет возвращать в машину | done
	 * моделька персонажа | done
	 * вход в машину с переключением камеры на машину | done
	 * пофиксить нахождение в воздухе более прозрачно | done
	 * дробовик у персонажа с 2 патронами и перезарядкой | done
	 * сделать контакт материал для персонажа с машинами мапой и др персонажем | done
	 *
	 * реализовать нанесение урона от машины если сила столкновения достаточная то минус все хп иначе ничего не будет | done
	 * реальзовать интерфейс отображениея хп и патронов в интерфейсе | done
	 * реализовать звук от выстрелов других людей с громкостью в зависимосьти от расстояния
	 */
	const keyPressHandler = (ev: KeyboardEvent): void => {
		if (ev.repeat || !CAR_SETTINGS.isNowControlled) return;
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
			case 'KeyF':
				if (!isPressed) return;
				eventBusTriggers.triggerOnCreateRootCharacter();
				break;
			default:
				break;
		}
	};

	const touchPressHandler = (controlId: CAR_CONTROLS_IDS, isPressed: boolean): void => {
		switch (controlId) {
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
		if (!CAR_SETTINGS.isNowControlled) return;
		const isPressed = ev.type === 'touchstart';
		const controlId = (ev?.target as HTMLElement)?.id as CAR_CONTROLS_IDS | undefined;
		if (!controlId || !Object.keys(CAR_CONTROLS_IDS).includes(controlId)) return;
		ev.preventDefault();
		touchPressHandler(controlId, isPressed);
	};

	const windowBlurHandler = (): void => {
		CAR_SETTINGS.up = false;
		CAR_SETTINGS.left = false;
		CAR_SETTINGS.down = false;
		CAR_SETTINGS.right = false;
		CAR_SETTINGS.brake = false;
		CAR_SETTINGS.boost = false;
	};

	eventBusSubscriptions.subscribeOnDeleteRootCharacter(() => {
		CAR_SETTINGS.isNowControlled = true;
	});
	eventBusSubscriptions.subscribeOnCreateRootCharacter(() => {
		CAR_SETTINGS.isNowControlled = false;
		windowBlurHandler();
	});

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
