import React from 'react';
import * as THREE from 'three';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Stats from 'stats.js';
import { useNavigate, useParams } from 'react-router-dom';
import * as CANNON from 'cannon-es';
import { SceneIgniterContextProvider, useSceneIgniterContext } from '../../libs/sceneIgniter/SceneIgniter';
import { setupBall } from '../../game/ball';
import { setupFloor } from '../../game/floor';
import CannonDebugRenderer from '../../libs/cannonDebug';
import { setupPhysics } from '../../game/physics';
import { carPhysicsEmulator } from '../../game/car/physicsEmulator';
import { setupCarControl } from '../../game/car/controls';
import { setupDayNight } from '../../game/dayNight';
import { setupWater } from '../../game/water';
import { setupWebsocket } from '../../websocket';
import { setupCamera } from '../../game/camera/camera';
import { cannonToThreeVec, getCarType, getNickname, PREV_ROOM_ITEM, uuid } from '../../libs/utils';
import { setupRenderer } from '../../libs/renderer';
import {
	StyledCarAcceleration,
	StyledCarAccelerationForward,
	StyledCarControlsWrapper,
	StyledCarSteering,
	StyledGamePageWrapper,
	StyledHPBar,
	StyledPersonInfo,
} from './styles';
import { ArrowIcon } from '../../icons/ArrowIcon';
import { ArrowFastIcon } from '../../icons/ArrowFastIcon';
import { BrakeIcon } from '../../icons/BrakeIcon';
import { RespawnIcon } from '../../icons/RespawnIcon';
import { CAR_CONTROLS_IDS } from '../../game/car/controls/enums';
import { setupSounds } from '../../sounds';
import { setupCharacterGraphics } from '../../game/character/graphics';
import { setupCharacterControl } from '../../game/character/controls';
import { characterPhysicsEmulator } from '../../game/character/physicsEmulator';
import { setupCarGraphics } from '../../game/car/graphics';
import { DEFAULT_CAR_SPECS } from '../../game/car/controls/consts';
import {
	CarMoveSpecs,
	CharacterDamaged,
	CharacterMoveSpecs,
	eventBusSubscriptions,
	eventBusTriggers,
	eventBusUnsubscribe,
	TriggerOnCarMoveCmd,
	TriggerOnCharacterInterfaceUpdateCmd,
	TriggerOnCharacterMoveCmd,
} from '../../eventBus';

const setupGame = (
	roomId: string,
	nickname: string,
	canvas: HTMLCanvasElement
): {
	destroy: () => void;
} => {
	// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ИГРЫ
	const IS_DEV_MODE = process.env.REACT_APP_MODE === 'devс';
	const CAR_TYPE = getCarType();
	const ROOT_ID = uuid();

	// ВСЕ СИНХРОНИЗИРУЕМЫЕ ОБЪЕКТЫ ИГРЫ
	const CARS_ON_MAP = new Map<
		string,
		{
			physics: ReturnType<typeof carPhysicsEmulator>;
			graphics: ReturnType<typeof setupCarGraphics>;
			controls?: ReturnType<typeof setupCarControl>;
		}
	>();
	const CHARACTERS_ON_MAP = new Map<
		string,
		{
			physics: ReturnType<typeof characterPhysicsEmulator>;
			graphics: ReturnType<typeof setupCharacterGraphics>;
			controls?: ReturnType<typeof setupCharacterControl>;
		}
	>();

	// СОЗДАЕМ МИР
	const { physicWorld } = setupPhysics();
	physicWorld.addEventListener('postStep', () => eventBusTriggers.triggerOnTickPhysic());

	// СОЗДАЕМ СЦЕНУ
	const scene = new THREE.Scene();
	const { camera } = setupCamera(scene, ROOT_ID);
	const { renderer } = setupRenderer(canvas, scene, camera);

	// ДОБАВЛЯЕМ КАРТУ НА СЦЕНУ
	setupFloor(scene, physicWorld);
	// ДОБАВЛЯЕМ ВОДУ НА СЦЕНУ
	setupWater(scene);
	// ДОБАВЛЯЕМ СВЕТ НА СЦЕНУ
	setupDayNight(scene, renderer, camera);

	// ДОБАВЛЯЕМ МЯЧ
	const { update: updateBallHandler } = setupBall(scene, physicWorld);

	// ФУНКЦИИ ПО СИНХРОНИЗАЦИИ МАШИН НА КАРТЕ
	const deleteCarHandler = (id: string): void => {
		const car = CARS_ON_MAP.get(id);
		if (!car) return;
		car.physics.destroy();
		car.graphics.destroy();
		car.controls?.destroy();
		CARS_ON_MAP.delete(id);
	};

	const updateCarHandler = (data: { id: string } & CarMoveSpecs): void => {
		const isRoot = data.id === ROOT_ID;

		const car = CARS_ON_MAP.get(data.id);
		if (!car) {
			const graphics = setupCarGraphics({
				scene,
				type: data.type || CAR_TYPE,
			});
			const physics = carPhysicsEmulator({
				physicWorld,
			});
			if (isRoot) {
				const controls = setupCarControl({
					id: data.id,
					type: data.type || CAR_TYPE,
					vehicle: physics.vehicle,
				});

				CARS_ON_MAP.set(data.id, { physics, graphics, controls });
			} else {
				CARS_ON_MAP.set(data.id, { physics, graphics });
			}
		}

		car?.physics?.update(data);
		car?.graphics?.update(data);
	};

	// СОЗДАНИЕ ДЕФОЛЬНОЙ МАШИНЫ
	updateCarHandler({
		id: ROOT_ID,
		...DEFAULT_CAR_SPECS,
	});

	// ФУНКЦИЯ ПО ОБНОВЛЕНИЮ ДЕФОЛТНОЙ МАШИНЫ
	const rootCarUpdate = ({ id: carId, ...specs }: TriggerOnCarMoveCmd): void => {
		if (carId !== ROOT_ID) return;
		updateCarHandler({
			id: ROOT_ID,
			...specs,
		});
	};
	// ПОДПИСКА НА ДВИЖЕНИЕ МАШИН
	eventBusSubscriptions.subscribeOnCarMove(rootCarUpdate);

	// ФУНКЦИИ ПО СИНХРОНИЗАЦИИ ПЕРСОНАЖЕЙ НА КАРТЕ
	const deleteCharacterHandler = (id: string): void => {
		const character = CHARACTERS_ON_MAP.get(id);
		if (!character) return;
		character.controls?.destroy();
		character.graphics.destroy();
		character.physics.destroy();
		CHARACTERS_ON_MAP.delete(id);
	};

	const updateCharacterHandler = (data: { id: string } & CharacterMoveSpecs): void => {
		const isRoot = data.id === ROOT_ID;
		const character = CHARACTERS_ON_MAP.get(data.id);
		if (!character) {
			const physics = characterPhysicsEmulator({
				physicWorld,
				defaultPosition: data.position,
			});
			const graphics = setupCharacterGraphics({
				id: data.id,
				scene,
				isFPV: isRoot,
			});
			if (isRoot) {
				const controls = setupCharacterControl({
					id: ROOT_ID,
					nickname,
					camera,
					character: physics.character,
					shotAnimation: graphics.shotAnimation,
					physicWorld,
					scene,
				});

				CHARACTERS_ON_MAP.set(data.id, { physics, graphics, controls });
			} else {
				CHARACTERS_ON_MAP.set(data.id, { physics, graphics });
			}
		}

		character?.physics?.update(data);
		character?.graphics?.update(data);
	};

	const damageCharacterHandler = (data: CharacterDamaged): void => {
		if (data.idDamaged !== ROOT_ID) return;
		CHARACTERS_ON_MAP.get(ROOT_ID)?.controls?.damaged(data);
	};

	const shotCharacterHandler = (id: string): void => {
		const rootCharacterPosition = CHARACTERS_ON_MAP.get(ROOT_ID)?.physics?.character?.position;
		const rootCarPosition = CARS_ON_MAP.get(ROOT_ID)?.physics?.vehicle?.chassisBody?.position;

		const soundPosition = rootCharacterPosition || rootCarPosition;

		CHARACTERS_ON_MAP.get(id)?.graphics?.shotAnimation(soundPosition ? cannonToThreeVec(soundPosition) : undefined);
	};

	// ФУНКЦИЯ ПО ОБНОВЛЕНИЮ ДЕФОЛТНОГО ПЕРСОНАЖА
	const rootCharacterUpdate = ({ id: characterId, ...specs }: TriggerOnCharacterMoveCmd): void => {
		if (characterId !== ROOT_ID) return;
		updateCharacterHandler({
			id: ROOT_ID,
			...specs,
		});
	};

	// ПОДПИСКА НА ДВИЖЕНИЕ ПЕРСОНАЖЕЙ
	eventBusSubscriptions.subscribeOnCharacterMove(rootCharacterUpdate);

	// ПОДПИСКА НА ВЫХОД ИЗ МАШИНЫ ЧТО БЫ СОЗДАТЬ ДЕФОЛТНОГО ПЕРСОНАЖА
	eventBusSubscriptions.subscribeOnCreateRootCharacter(() => {
		const spawnPosition = new CANNON.Vec3().copy(
			CARS_ON_MAP.get(ROOT_ID)?.physics?.vehicle?.chassisBody?.position || new CANNON.Vec3()
		);
		spawnPosition.y += 3.5;
		updateCharacterHandler({
			id: ROOT_ID,
			position: spawnPosition,
			rotateY: 0,
			rotateX: 0,
		});
	});

	// ПОДПИСКА НА ВХОД В МАШИНУ ЧТО БЫ УДАЛИТЬ ДЕФОЛТНОГО ПЕРСОНАЖА
	eventBusSubscriptions.subscribeOnDeleteRootCharacter(() => {
		deleteCharacterHandler(ROOT_ID);
	});

	// СОЗДАНИЕ ВЕБ СОКЕТ СОЕДИНЕНИЯ С КОЛБЭКАМИ
	const { close } = setupWebsocket({
		roomId,
		nickname,
		rootId: ROOT_ID,
		onDisconnect: id => {
			deleteCarHandler(id);
			deleteCharacterHandler(id);
		},
		onCarUpdate: updateCarHandler,
		onCharacterUpdate: updateCharacterHandler,
		onCharacterDelete: deleteCharacterHandler,
		onCharacterDamaged: damageCharacterHandler,
		onCharacterShot: shotCharacterHandler,
		onBallUpdate: updateBallHandler,
	});

	// СОЗДАНИЕ ДЕВ ИНСТРУМЕНТОВ ДЛЯ МОНИТОРИНГА
	if (IS_DEV_MODE) {
		const CANNON_DEBUG_RENDERER = new CannonDebugRenderer(scene, physicWorld);
		const stats = new Stats();
		stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
		document.body.appendChild(stats.dom);

		eventBusSubscriptions.subscribeOnTick(() => {
			CANNON_DEBUG_RENDERER.update();
			stats.begin();

			stats.end();
		});
	}

	// ФЛАГ ОЗНАЧАЮЩИЙ ВКЛЮЧЕНА ЛИ ВОЗМОЖНОСТЬ ПРОИГРЫВАТЬ ЗВУКИ
	let isSoundSetup = false;
	const startGameHandler = (): void => {
		document.body.requestPointerLock();
		if (!isSoundSetup) setupSounds();
		isSoundSetup = true;
	};

	window.addEventListener('click', startGameHandler);
	const destroy = (): void => {
		window.removeEventListener('click', startGameHandler);
		document.exitPointerLock();
		close();
	};

	return {
		destroy,
	};
};

const MultiCar: React.FC = () => {
	const { id: roomId } = useParams();
	const navigate = useNavigate();
	const { canvas } = useSceneIgniterContext();

	const goHomePageHandler = React.useCallback(() => navigate('/'), [navigate]);

	React.useEffect(() => {
		const nickname = getNickname();
		if (!nickname || !roomId) return goHomePageHandler();
		if (!canvas) return;

		const { destroy } = setupGame(roomId, nickname, canvas);

		return () => {
			localStorage.setItem(PREV_ROOM_ITEM, roomId);
			destroy();
			eventBusUnsubscribe.unsubscribe(['ON_NOTIFICATION']);
		};
	}, [canvas, goHomePageHandler, navigate, roomId]);

	return null;
};

const GamePage: React.FC = () => {
	const navigate = useNavigate();
	const [stateInfo, setInfo] = React.useState<TriggerOnCharacterInterfaceUpdateCmd | null>(null);

	const updateInterfaceHandler = React.useCallback(
		(info: TriggerOnCharacterInterfaceUpdateCmd | null) => setInfo(info),
		[]
	);

	const onExitCarHandler = React.useCallback(() => {
		eventBusSubscriptions.subscribeOnCharacterInterfaceUpdate(updateInterfaceHandler);
	}, [updateInterfaceHandler]);

	const onEnterCarHandler = React.useCallback(() => {
		eventBusUnsubscribe.unsubscribeOnCharacterInterfaceUpdate(updateInterfaceHandler);
		setInfo(null);
	}, [updateInterfaceHandler]);

	React.useEffect(() => {
		eventBusSubscriptions.subscribeOnCreateRootCharacter(onExitCarHandler);
		eventBusSubscriptions.subscribeOnDeleteRootCharacter(onEnterCarHandler);

		return () => {
			eventBusUnsubscribe.unsubscribeOnCreateRootCharacter(onExitCarHandler);
			eventBusUnsubscribe.unsubscribeOnDeleteRootCharacter(onEnterCarHandler);
		};
	}, [onEnterCarHandler, onExitCarHandler]);

	const goHomePageHandler = React.useCallback(() => navigate('/'), [navigate]);

	return (
		<SceneIgniterContextProvider>
			<StyledGamePageWrapper>
				{stateInfo ? (
					<StyledPersonInfo>
						<div className='aimPoint' />
						<div>
							{stateInfo.currentBullets} / {stateInfo.bullets}
						</div>
						<StyledHPBar hp={stateInfo.hp}>{stateInfo.hp}</StyledHPBar>
					</StyledPersonInfo>
				) : null}
				<button type='button' onClick={goHomePageHandler} className='backNavigate'>
					<ArrowIcon direction='left' />
				</button>
				<button type='button' className='respawnButton' id={CAR_CONTROLS_IDS.RESPAWN}>
					<RespawnIcon />
				</button>
				<MultiCar />
				<StyledCarControlsWrapper>
					<StyledCarSteering>
						<button type='button' id={CAR_CONTROLS_IDS.LEFT}>
							<ArrowIcon direction='left' />
						</button>
						<button type='button' id={CAR_CONTROLS_IDS.RIGHT}>
							<ArrowIcon direction='right' />
						</button>
					</StyledCarSteering>
					<StyledCarAcceleration>
						<StyledCarAccelerationForward>
							<button type='button' id={CAR_CONTROLS_IDS.FORWARD}>
								<ArrowIcon direction='up' />
							</button>
							<button type='button' id={CAR_CONTROLS_IDS.FORWARD_BOOST}>
								<ArrowFastIcon />
							</button>
						</StyledCarAccelerationForward>
						<StyledCarAccelerationForward>
							<button type='button' id={CAR_CONTROLS_IDS.REVERS}>
								<ArrowIcon direction='down' />
							</button>
							<button type='button' id={CAR_CONTROLS_IDS.BRAKE}>
								<BrakeIcon />
							</button>
						</StyledCarAccelerationForward>
					</StyledCarAcceleration>
				</StyledCarControlsWrapper>
			</StyledGamePageWrapper>
		</SceneIgniterContextProvider>
	);
};

export default GamePage;
