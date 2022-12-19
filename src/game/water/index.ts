import * as THREE from 'three';
import { waterVertexShader } from './waterVertexShader';
import { waterFragmentsShader } from './waterFragmentsShader';
import { eventBusSubscriptions } from '../../eventBus';

export const setupWater = (scene: THREE.Scene): void => {
	const clock = new THREE.Clock();
	const waterMaterial = new THREE.ShaderMaterial({
		uniforms: {
			uTime: { value: 0 },
			upperColor: { value: new THREE.Color('#125e44') },
			depthColor: { value: new THREE.Color('#09d2c8') },
			elevationLevel: { value: 0.2 },
		},
		vertexShader: waterVertexShader,
		fragmentShader: waterFragmentsShader,
	});

	eventBusSubscriptions.subscribeOnTick({
		callback: () => {
			const time = clock.getElapsedTime();
			waterMaterial.uniforms.uTime.value = time * 3;
		},
	});

	const waterContainer = new THREE.Group();
	const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000, 1024, 1024), waterMaterial);
	waterContainer.add(waterMesh);
	waterContainer.rotation.x = -Math.PI / 2;
	waterContainer.position.set(0, -0.5, 0);

	scene.add(waterContainer);
};
