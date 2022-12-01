import React from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { eventBusSubscriptions, eventBusTriggers } from './eventBus';
import { SceneIgniterContextProvider, useSceneIgniterContext } from './libs/sceneIgniter/SceneIgniter';
import { setupCamera } from './game/cameras';
import { setupRenderer } from './game/renderer';
import { setupPhysics } from './game/physics';
import { setupLights } from './game/lights';
import { setupCar } from './game/car';
import CannonDebugRenderer from './libs/cannonDebug';

const CLOCK = new THREE.Clock();

window.addEventListener('resize', () => {
	eventBusTriggers.triggerOnResize({
		payload: {
			width: window.innerWidth,
			height: window.innerHeight,
		},
	});
});

const tick = (): void | number => {
	window.requestAnimationFrame(tick);
	const delta = CLOCK.getDelta();
	eventBusTriggers.triggerOnTick({
		payload: {
			delta,
		},
	});
};
tick();

const { physicWorld } = setupPhysics();
physicWorld.addEventListener('postStep', () => eventBusTriggers.triggerOnTickPhysic());

const scene = new THREE.Scene();
setupLights(scene);
const { camera } = setupCamera(scene);
setupCar(physicWorld);

// const orbitControl = new OrbitControls(camera, canvas);
const CANNON_DEBUG_RENDERER = new CannonDebugRenderer(scene, physicWorld);

// fake car start
const fakeCarMaterial = new THREE.MeshStandardMaterial({ color: 'red' });
const fakeCarGeometry = new THREE.BoxGeometry(2, 1, 0.5);
const fakeCarMesh = new THREE.Mesh(fakeCarGeometry, fakeCarMaterial);
scene.add(fakeCarMesh);

const wheelGraphics: THREE.Mesh[] = Array.from({ length: 4 }).map(() => {
	const wheelMaterial = new THREE.MeshStandardMaterial({ color: 'blue' });
	const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.15);
	const wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
	scene.add(wheelMesh);
	return wheelMesh;
});

eventBusSubscriptions.subscribeOnCarMove({
	callback: ({ payload: { chassis, wheels } }) => {
		fakeCarMesh.position.set(chassis.position.x + 5, chassis.position.y, chassis.position.z);
		fakeCarMesh.quaternion.set(chassis.quaternion.x, chassis.quaternion.y, chassis.quaternion.z, chassis.quaternion.w);

		wheels.forEach((wheel, index) => {
			wheelGraphics[index].position.set(wheel.position.x + 5, wheel.position.y, wheel.position.z);
			wheelGraphics[index].quaternion.set(
				wheel.quaternion.x,
				wheel.quaternion.y,
				wheel.quaternion.z,
				wheel.quaternion.w
			);
		});
	},
});

// fake car end

const planeMaterial = new THREE.MeshStandardMaterial({ color: 'green' });
const planeGeometry = new THREE.PlaneGeometry(100, 100);
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
planeMesh.rotateX(-(Math.PI / 2));

scene.add(planeMesh);

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
