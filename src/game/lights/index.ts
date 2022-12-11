import * as THREE from 'three';

export const setupLights = (scene: THREE.Scene): void => {
	const ambientLight = new THREE.AmbientLight('#ffffff');
	ambientLight.intensity = 1;
	const pointLight = new THREE.PointLight('#ffffff');
	pointLight.intensity = 1;
	pointLight.position.set(6, 10, 0);
	pointLight.castShadow = true; // default false

	scene.add(ambientLight, pointLight);
};
