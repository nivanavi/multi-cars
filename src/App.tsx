import React from 'react';
import * as THREE from 'three';
import { v4 } from 'uuid';
import { CarMoveSpecs, eventBusSubscriptions, eventBusTriggers } from './eventBus';
import { SceneIgniterContextProvider, useSceneIgniterContext } from './libs/sceneIgniter/SceneIgniter';
import { setupCamera } from './game/cameras';
import { setupRenderer } from './game/renderer';
import { setupPhysics } from './game/physics';
import { setupLights } from './game/lights';
import { setupCar } from './game/car';
import CannonDebugRenderer from './libs/cannonDebug';
import { carPhysicEmulator } from './game/carPhysicsEmulator';
import { setupWebsocket } from './websocket';
import { setupGraphics } from './game/graphics';
import { setupFloor } from './game/floor';
import { setupWater } from './game/water';

const ROOM_ID = 'test_room';
const ROOT_CAR_ID = v4();
window.addEventListener('resize', () => {
	eventBusTriggers.triggerOnResize({
		payload: {
			width: window.innerWidth,
			height: window.innerHeight,
		},
	});
});

const tick = (): void => {
	eventBusTriggers.triggerOnTick();

	window.requestAnimationFrame(tick);
};
window.requestAnimationFrame(tick);

const { physicWorld } = setupPhysics();
physicWorld.addEventListener('postStep', () => eventBusTriggers.triggerOnTickPhysic());

const scene = new THREE.Scene();
const { camera } = setupCamera(scene, ROOT_CAR_ID);
setupLights(scene);
setupCar(physicWorld, ROOT_CAR_ID);
setupFloor(scene, physicWorld);
setupWater(scene);
setupGraphics(scene);

const CARS_ON_MAP = new Map<string, ReturnType<typeof carPhysicEmulator>>();

const deleteCarHandler = (id: string): void => {
	CARS_ON_MAP.get(id)?.delete();
	CARS_ON_MAP.delete(id);
};
const updateCarHandler = (data: Omit<CarMoveSpecs, 'isNotMove'>): void => {
	if (!CARS_ON_MAP.get(data.id))
		CARS_ON_MAP.set(data.id, carPhysicEmulator({ physicWorld, id: data.id, isNotTriggerEvent: true }));
	CARS_ON_MAP.get(data.id)?.updateSpecs({
		...data,
		isNotMove: false,
	});
};

setupWebsocket(ROOT_CAR_ID, ROOM_ID, deleteCarHandler, updateCarHandler);

// debug
const CANNON_DEBUG_RENDERER = new CannonDebugRenderer(scene, physicWorld);

eventBusSubscriptions.subscribeOnTick({
	callback: () => {
		CANNON_DEBUG_RENDERER.update();
	},
});

export const MultiCar: React.FC = () => {
	const canvas = useSceneIgniterContext().canvas!;

	setupRenderer(canvas, scene, camera);

	React.useEffect(() => {
		setupRenderer(canvas, scene, camera);
	}, [canvas]);

	return null;
};

export const MultiCarIgniter: React.FC = () => (
	<SceneIgniterContextProvider>
		<MultiCar />
	</SceneIgniterContextProvider>
);
