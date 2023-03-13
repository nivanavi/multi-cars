import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export type CreateModelCmd = {
	name: string;
	position?: THREE.Vector3;
	scale?: THREE.Vector3;
	rotation?: THREE.Euler;
	receiveShadow?: boolean;
	castShadow?: boolean;
	modelSrc: string;
	callback?: (container: THREE.Object3D, model: GLTF) => void;
	userData?: {
		id: string;
	};
};

const gltfLoader = new GLTFLoader();

export const createModelContainer: (props: CreateModelCmd) => THREE.Object3D = props => {
	const {
		position = new THREE.Vector3(0, 0, 0),
		scale = new THREE.Vector3(1, 1, 1),
		rotation = new THREE.Euler(0, 0, 0),
		name,
		modelSrc,
		callback,
		receiveShadow = false,
		castShadow = false,
		userData = {},
	} = props;
	const container: THREE.Object3D = new THREE.Object3D();
	container.name = name;
	container.userData = userData;

	gltfLoader.load(modelSrc, model => {
		const modelScene = model.scene;

		modelScene.traverse(child => {
			child.castShadow = castShadow;
			child.receiveShadow = receiveShadow;
			child.userData = userData;
			child.frustumCulled = false;
		});

		modelScene.rotation.copy(rotation);
		modelScene.scale.copy(scale);
		modelScene.position.copy(position);
		modelScene.userData = userData;
		container.add(modelScene);
		if (callback) callback(container, model);
	});

	return container;
};
