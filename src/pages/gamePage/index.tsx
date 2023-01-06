import React from 'react';
import * as THREE from 'three';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Stats from 'stats.js';
import { useNavigate, useParams } from 'react-router-dom';
import { CarMoveSpecs, eventBusSubscriptions, eventBusTriggers } from '../../eventBus';
import { SceneIgniterContextProvider, useSceneIgniterContext } from '../../libs/sceneIgniter/SceneIgniter';
import { setupBall } from '../../game/ball';
import { setupFloor } from '../../game/floor';
import CannonDebugRenderer from '../../libs/cannonDebug';
import { setupPhysics } from '../../game/physics';
import { carPhysicEmulator } from '../../game/carPhysicsEmulator';
import { setupCarControl } from '../../game/carControl';
import { setupDayNight } from '../../game/dayNight';
import { setupWater } from '../../game/water';
import { GeneralMessageProps, setupWebsocket } from '../../websocket';
import { setupCamera } from '../../game/cameras';
import {getCarType, getNickname, uuid} from '../../libs/utils';
import { setupRenderer } from '../../libs/renderer';

const setupGame = (
	roomId: string,
	nickname: string,
	canvas: HTMLCanvasElement
): {
	destroy: () => void;
} => {
	const CAR_TYPE = getCarType();
	const ROOT_CAR_ID = uuid();
	const CARS_ON_MAP = new Map<string, ReturnType<typeof carPhysicEmulator>>();
	const IS_DEV_MODE = process.env.REACT_APP_MODE === 'dev';

	const { physicWorld } = setupPhysics();
	physicWorld.addEventListener('postStep', () => eventBusTriggers.triggerOnTickPhysic());

	const scene = new THREE.Scene();
	// debug
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
	const { camera, destroy: destroyCamera } = setupCamera(scene, ROOT_CAR_ID);

	const { chassis, update } = carPhysicEmulator({
		type: CAR_TYPE,
		scene,
		physicWorld,
		id: ROOT_CAR_ID,
	});
	const { destroy: destroyCarControl } = setupCarControl(chassis, update);
	const deleteCarHandler = (id: string): void => {
		CARS_ON_MAP.get(id)?.delete();
		CARS_ON_MAP.delete(id);
	};

	const updateCarHandler = (data: GeneralMessageProps & CarMoveSpecs): void => {
		if (!CARS_ON_MAP.get(data.carId))
			CARS_ON_MAP.set(
				data.carId,
				carPhysicEmulator({
					physicWorld,
					type: data.type || CAR_TYPE,
					id: data.carId,
					isNotTriggerEvent: true,
					scene,
				})
			);
		CARS_ON_MAP.get(data.carId)?.update(data);
	};

	setupFloor(scene, physicWorld);
	setupWater(scene);
	const { updateBallSpecs } = setupBall(scene, physicWorld);

	const { renderer } = setupRenderer(canvas, scene, camera);
	setupDayNight(scene, renderer, camera);

	const { close } = setupWebsocket({
		roomId,
		nickname,
		rootCarId: ROOT_CAR_ID,
		onCarDelete: deleteCarHandler,
		onCarUpdate: updateCarHandler,
		onBallMove: updateBallSpecs,
	});

	return {
		destroy: (): void => {
			close();
			destroyCamera();
			destroyCarControl();
		},
	};
};

const MultiCar: React.FC = () => {
	const { id: roomId } = useParams();
	const navigate = useNavigate();
	const { canvas } = useSceneIgniterContext();

	React.useEffect(() => {
		const nickname = getNickname();
		if (!nickname || !roomId) return navigate('/');
		if (!canvas) return;
		console.log('setup game');

		const { destroy } = setupGame(roomId, nickname, canvas);

		return () => {
			destroy();
			eventBusSubscriptions.unsubscribe(['ON_NOTIFICATION']);
		};
	}, [canvas, navigate, roomId]);

	return null;
};

const GamePage: React.FC = () => (
	<SceneIgniterContextProvider>
		<MultiCar />
	</SceneIgniterContextProvider>
);

export default GamePage;
