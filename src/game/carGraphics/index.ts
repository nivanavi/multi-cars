import * as THREE from 'three';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import eleanorModelSrc from '../../models/eleanor/eleanor.gltf';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import wheelModelSrc from '../../models/eleanor/wheel.gltf';
import { createModelContainer } from '../modelLoader';
import { CarMoveSpecs } from '../../eventBus';
import { cannonToThreeQuaternion, cannonToThreeVec } from '../../libs/utils';

export const setupCarGraphics = (
	scene: THREE.Scene
): {
	updateHandler: (props: CarMoveSpecs) => void;
	deleteHandler: () => void;
} => {
	const eleanorContainer = createModelContainer({
		name: 'eleanor',
		modelSrc: eleanorModelSrc,
		castShadow: true,
		rotation: new THREE.Euler(0, -Math.PI / 2, 0),
		scale: new THREE.Vector3(2.8, 2.8, 2.8),
		position: new THREE.Vector3(-0.07, 0.2, 0),
	});
	scene.add(eleanorContainer);

	const wheelsGraphic: THREE.Group[] = [];
	createModelContainer({
		name: 'wheel',
		modelSrc: wheelModelSrc,
		castShadow: true,
		receiveShadow: true,
		rotation: new THREE.Euler(0, Math.PI / 2, 0),
		callback: container => {
			Array.from({ length: 4 }).forEach(() => {
				const wheelMesh = container.clone();
				wheelMesh.scale.set(1, 1, 0.95);
				wheelsGraphic.push(wheelMesh);
				scene.add(wheelMesh);
			});
		},
		scale: new THREE.Vector3(0.57, 0.57, 0.57),
	});

	const updateHandler = (props: CarMoveSpecs): void => {
		const { chassis, wheels } = props || {};
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
	};

	const deleteHandler = (): void => {
		scene.remove(eleanorContainer);
		wheelsGraphic.forEach(wheel => scene.remove(wheel));
	};

	return {
		updateHandler,
		deleteHandler,
	};
};
