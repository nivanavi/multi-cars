import React from 'react';
import * as THREE from 'three';
import { v4 } from 'uuid';
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
import { setupWebsocket } from '../../websocket';
import { setupCamera } from '../../game/cameras';
import { getCarType, getNickname } from '../../libs/utils';
import { setupRenderer } from '../../libs/renderer';

const NICKNAME = getNickname();

const setupGame = (
	roomId: string,
	nickname: string,
	canvas: HTMLCanvasElement
): {
	destroy: () => void;
} => {
	const CAR_TYPE = getCarType();
	const ROOT_CAR_ID = v4();
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

	const { chassis, updateSpecs } = carPhysicEmulator({
		type: CAR_TYPE,
		scene,
		physicWorld,
		id: ROOT_CAR_ID,
	});
	const { destroy: destroyCarControl } = setupCarControl(chassis, updateSpecs);
	const deleteCarHandler = (id: string): void => {
		CARS_ON_MAP.get(id)?.delete();
		CARS_ON_MAP.delete(id);
	};

	const updateCarHandler = (data: { id: string } & CarMoveSpecs): void => {
		if (!CARS_ON_MAP.get(data.id))
			CARS_ON_MAP.set(
				data.id,
				carPhysicEmulator({
					physicWorld,
					type: data.type || CAR_TYPE,
					id: data.id,
					isNotTriggerEvent: true,
					scene,
				})
			);
		CARS_ON_MAP.get(data.id)?.updateSpecs(data);
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

	const testBoxG = new THREE.BoxGeometry(20, 20, 20);
	const testBoxM = new THREE.MeshStandardMaterial({ color: 'red' });
	const testBox = new THREE.Mesh(testBoxG, testBoxM);
	scene.add(testBox);

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
		if (!NICKNAME || !roomId) return navigate('/');
		if (!canvas) return;
		console.log('setup game');

		const { destroy } = setupGame(roomId, NICKNAME, canvas);

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
