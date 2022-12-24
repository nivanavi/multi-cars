import React from 'react';
import * as THREE from 'three';
import { v4 } from 'uuid';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Stats from 'stats.js';
import { CarMoveSpecs, eventBusSubscriptions, eventBusTriggers } from './eventBus';
import { SceneIgniterContextProvider, useSceneIgniterContext } from './libs/sceneIgniter/SceneIgniter';
import { setupCamera } from './game/cameras';
import { setupRenderer } from './game/renderer';
import { setupPhysics } from './game/physics';
import CannonDebugRenderer from './libs/cannonDebug';
import { carPhysicEmulator } from './game/carPhysicsEmulator';
import { setupWebsocket } from './websocket';
import { setupFloor } from './game/floor';
import { setupWater } from './game/water';
import { setupDayNight } from './game/dayNight';
import { setupCarControl } from './game/carControl';
import { setupBall } from './game/ball';

const ROOM_ID = 'test_room';
const ROOT_CAR_ID = v4();

const IS_DEV_MODE = true;
window.addEventListener('resize', () => {
	eventBusTriggers.triggerOnResize({
		payload: {
			width: window.innerWidth,
			height: window.innerHeight,
		},
	});
});

const CLOCK = new THREE.Clock();
const tick = (): void => {
	const time = CLOCK.getElapsedTime();
	eventBusTriggers.triggerOnTick({ payload: { time } });

	window.requestAnimationFrame(tick);
};
window.requestAnimationFrame(tick);

const { physicWorld } = setupPhysics();
physicWorld.addEventListener('postStep', () => eventBusTriggers.triggerOnTickPhysic());

const scene = new THREE.Scene();
const { camera } = setupCamera(scene, ROOT_CAR_ID);
const { chassis, updateSpecs } = carPhysicEmulator({
	scene,
	physicWorld,
	id: ROOT_CAR_ID,
});
setupCarControl(chassis, updateSpecs);
setupFloor(scene, physicWorld);
setupWater(scene);
const { updateBallSpecs } = setupBall(scene, physicWorld);

const CARS_ON_MAP = new Map<string, ReturnType<typeof carPhysicEmulator>>();

const deleteCarHandler = (id: string): void => {
	CARS_ON_MAP.get(id)?.delete();
	CARS_ON_MAP.delete(id);
};
const updateCarHandler = (data: { id: string } & CarMoveSpecs): void => {
	if (!CARS_ON_MAP.get(data.id))
		CARS_ON_MAP.set(data.id, carPhysicEmulator({ physicWorld, id: data.id, isNotTriggerEvent: true, scene }));
	CARS_ON_MAP.get(data.id)?.updateSpecs(data);
};

setupWebsocket({
	roomId: ROOM_ID,
	rootCarId: ROOT_CAR_ID,
	onCarDelete: deleteCarHandler,
	onCarUpdate: updateCarHandler,
	onBallMove: updateBallSpecs,
});

// debug
const CANNON_DEBUG_RENDERER = new CannonDebugRenderer(scene, physicWorld);
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

if (IS_DEV_MODE)
	eventBusSubscriptions.subscribeOnTick({
		callback: () => {
			CANNON_DEBUG_RENDERER.update();
			stats.begin();

			stats.end();
		},
	});

export const MultiCar: React.FC = () => {
	const canvas = useSceneIgniterContext().canvas!;

	const { renderer } = setupRenderer(canvas, scene, camera);
	setupDayNight(scene, renderer, camera);

	return null;
};

export const MultiCarIgniter: React.FC = () => (
	<SceneIgniterContextProvider>
		<MultiCar />
	</SceneIgniterContextProvider>
);
