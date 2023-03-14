import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { CameraType } from '../../camera/camera';

export type SetupCharacterControlCmd = {
	id: string;
	nickname: string;
	character: CANNON.Body;
	shotAnimation: () => void;
	camera: CameraType;
	scene: THREE.Scene;
	/**
	 * физический "мир"
	 */
	physicWorld: CANNON.World;
};
