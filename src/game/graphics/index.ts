import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import eleanorModelSrc from '../../models/eleanor/eleanor.gltf';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import wheelModelSrc from '../../models/eleanor/wheel.gltf';
import { createModelContainer } from '../modelLoader';
import { eventBusSubscriptions } from '../../eventBus';
import { cannonToThreeQuaternion, cannonToThreeVec } from '../../libs/utils';

export const setupGraphics = (scene: THREE.Scene): void => {
	const eleanorContainer = createModelContainer({
		name: 'eleanor',
		modelSrc: eleanorModelSrc,
		rotation: new THREE.Euler(0, -Math.PI / 2, 0),
		scale: new THREE.Vector3(2.8, 2.8, 2.8),
		position: new THREE.Vector3(-0.07, 0.2, 0),
	});
	// scene.add(eleanorContainer);

	const wheelsGraphic: THREE.Group[] = [];
	createModelContainer({
		name: 'wheel',
		modelSrc: wheelModelSrc,
		rotation: new THREE.Euler(0, Math.PI / 2, 0),
		callback: container => {
			Array.from({ length: 4 }).forEach(() => {
				const wheelMesh = container.clone();
				wheelMesh.scale.set(1, 1, 0.95);
				wheelsGraphic.push(wheelMesh);
				// scene.add(wheelMesh);
			});
		},
		scale: new THREE.Vector3(0.57, 0.57, 0.57),
	});

	eventBusSubscriptions.subscribeOnCarMove({
		callback: ({ payload: { chassis, wheels } }) => {
			const { position, quaternion } = chassis || {};
			if (!position || !quaternion) return;
			eleanorContainer.position.copy(cannonToThreeVec(position));
			eleanorContainer.quaternion.copy(cannonToThreeQuaternion(quaternion));
			if (!wheels || !wheelsGraphic.length) return;
			wheels.forEach((wheel, index) => {
				const { position: wheelPosition, quaternion: wheelQuaternion } = wheel || {};
				if (!position || !quaternion) return;
				wheelsGraphic[index].position.copy(cannonToThreeVec(wheelPosition));
				wheelsGraphic[index].quaternion.copy(cannonToThreeQuaternion(wheelQuaternion));
			});
		},
	});
};
