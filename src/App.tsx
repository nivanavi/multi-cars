import React from 'react';
import * as THREE from 'three';
import { v4 } from 'uuid';
import * as CANNON from 'cannon-es';
import { CarMoveSpecs, eventBusSubscriptions, eventBusTriggers } from './eventBus';
import { SceneIgniterContextProvider, useSceneIgniterContext } from './libs/sceneIgniter/SceneIgniter';
import { setupCamera } from './game/cameras';
import { setupRenderer } from './game/renderer';
import { groundPhysicsMaterial, setupPhysics } from './game/physics';
import { setupLights } from './game/lights';
import { setupCar } from './game/car';
import CannonDebugRenderer from './libs/cannonDebug';
import { carPhysicEmulator } from './game/carPhysicsEmulator';
import { setupWebsocket } from './websocket';

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

const CARS_ON_MAP = new Map<string, ReturnType<typeof carPhysicEmulator>>();

const deleteCarHandler = (id: string): void => {
	CARS_ON_MAP.get(id)?.delete();
	CARS_ON_MAP.delete(id);
};
const updateCarHandler = (data: Omit<CarMoveSpecs, 'isNotMove'>): void => {
	if (!CARS_ON_MAP.get(data.id)) CARS_ON_MAP.set(data.id, carPhysicEmulator(physicWorld, data.id, true));
	CARS_ON_MAP.get(data.id)?.updateSpecs({
		...data,
		isNotMove: false,
	});
};

setupWebsocket(ROOT_CAR_ID, deleteCarHandler, updateCarHandler);

// debug
const CANNON_DEBUG_RENDERER = new CannonDebugRenderer(scene, physicWorld);

eventBusSubscriptions.subscribeOnTick({
	callback: () => {
		CANNON_DEBUG_RENDERER.update();
	},
});

// это не должно тут быть
const groundShape = new CANNON.Plane();
const groundBody = new CANNON.Body({
	mass: 0,
	material: groundPhysicsMaterial,
});

groundBody.addShape(groundShape);
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5);

physicWorld.addBody(groundBody);

// Add the ground
const sizeX = 64;
const sizeZ = 64;
const matrix: number[][] = [];
// eslint-disable-next-line no-plusplus
for (let i = 0; i < sizeX; i++) {
	matrix.push([]);
	// eslint-disable-next-line no-plusplus
	for (let j = 0; j < sizeZ; j++) {
		if (i === 0 || i === sizeX - 1 || j === 0 || j === sizeZ - 1) {
			const height = 3;
			matrix[i].push(height);
			// eslint-disable-next-line no-continue
			continue;
		}

		const height = Math.cos((i / sizeX) * Math.PI * 5) * Math.cos((j / sizeZ) * Math.PI * 5) * 2 + 2;
		matrix[i].push(height);
	}
}

const groundMaterial = new CANNON.Material('ground');
const heightfieldShape = new CANNON.Heightfield(matrix, {
	elementSize: 100 / sizeX,
});
const heightfieldBody = new CANNON.Body({ mass: 0, material: groundMaterial });
heightfieldBody.addShape(heightfieldShape);
heightfieldBody.position.set(
	// -((sizeX - 1) * heightfieldShape.elementSize) / 2,
	-(sizeX * heightfieldShape.elementSize) / 2,
	-1,
	// ((sizeZ - 1) * heightfieldShape.elementSize) / 2
	(sizeZ * heightfieldShape.elementSize) / 2
);
heightfieldBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
// physicWorld.addBody(heightfieldBody);

// это не должно тут быть

export const MultiCar: React.FC = () => {
	const canvas = useSceneIgniterContext().canvas!;

	setupRenderer(canvas, scene, camera);

	// React.useEffect(
	// 	() => () => {
	// 		deleteCarHandler(ROOT_CAR_ID);
	// 	},
	// 	[]
	// );

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
