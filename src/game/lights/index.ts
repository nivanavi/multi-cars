import * as THREE from 'three';

export const setupLights = (scene: THREE.Scene): void => {
	const ambientLight = new THREE.AmbientLight('#ffffff');
	ambientLight.intensity = 0.5;
	const pointLight = new THREE.PointLight('#ffffff');
	pointLight.intensity = 0.5;
	pointLight.position.set(1, 5, 1);
	pointLight.castShadow = true; // default false

	scene.add(ambientLight, pointLight);
};
