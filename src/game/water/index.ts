import * as THREE from 'three';
import { waterVertexShader } from './waterVertexShader';
import { waterFragmentsShader } from './waterFragmentsShader';
import { eventBusSubscriptions } from '../../eventBus';

export const setupWater = (scene: THREE.Scene): void => {
	const waterMaterial = new THREE.ShaderMaterial({
		uniforms: {
			uTime: { value: 0 },
			// upperColor: { value: new THREE.Color('#125e44') },
			// depthColor: { value: new THREE.Color('#09d2c8') },
			upperColor: { value: new THREE.Color('#3185a4') },
			depthColor: { value: new THREE.Color('#3f9fc3') },
			// upperColor: { value: new THREE.Color('#407f7f') },
			// depthColor: { value: new THREE.Color('#2d5959') },
			elevationLevel: { value: 0.6 },
		},
		vertexShader: waterVertexShader,
		fragmentShader: waterFragmentsShader,
	});

	eventBusSubscriptions.subscribeOnTick({
		callback: ({ payload: { time } }) => {
			waterMaterial.uniforms.uTime.value = time * 3;
		},
	});

	const waterContainer = new THREE.Group();
	const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000, 512, 512), waterMaterial);
	waterContainer.add(waterMesh);
	waterContainer.rotation.x = -Math.PI / 2;
	waterContainer.position.set(0, -1.3, 0);

	scene.add(waterContainer);
};
