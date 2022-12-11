import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

type CreateModelCmd = {
	name: string;
	position?: THREE.Vector3;
	scale?: THREE.Vector3;
	rotation?: THREE.Euler;
	modelSrc: string;
	callback?: (container: THREE.Group, modelScene: THREE.Group) => void;
};

const gltfLoader = new GLTFLoader();

export const createModelContainer: (props: CreateModelCmd) => THREE.Group = props => {
	const {
		position = new THREE.Vector3(0, 0, 0),
		scale = new THREE.Vector3(1, 1, 1),
		rotation = new THREE.Euler(0, 0, 0),
		name,
		modelSrc,
		callback,
	} = props;
	const container: THREE.Group = new THREE.Group();
	container.name = name;

	gltfLoader.load(modelSrc, model => {
		const modelScene = model.scene;
		modelScene.children.forEach(child => {
			child.castShadow = true;
			child.children.forEach(nestChild => {
				nestChild.castShadow = true;
			});
		});
		modelScene.rotation.copy(rotation);
		modelScene.scale.copy(scale);
		modelScene.position.copy(position);
		container.add(modelScene);
		if (callback) callback(container, modelScene);
	});

	return container;
};
