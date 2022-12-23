import * as THREE from 'three';
import { eventBusSubscriptions } from '../../eventBus';

export const setupRenderer = (
	canvas: HTMLCanvasElement,
	scene: THREE.Scene,
	camera: THREE.PerspectiveCamera
): { renderer: THREE.WebGLRenderer } => {
	const renderer = new THREE.WebGLRenderer({ canvas });
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.setClearColor('#000');

	eventBusSubscriptions.subscribeOnResizeWithInit({
		callback: ({ payload: { height, width } }) => {
			renderer.setSize(width, height);
		},
	});

	eventBusSubscriptions.subscribeOnTick({
		callback: () => {
			renderer.render(scene, camera);
		},
	});

	return {
		renderer,
	};
};
