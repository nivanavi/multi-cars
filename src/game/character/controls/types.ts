import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { CameraType } from '../../camera/camera';
import { CharacterBones } from '../graphics/types';

export type SetupCharacterControlCmd = {
	id: string;
	character: CANNON.Body;
	shotAnimation: () => void;
	bones: CharacterBones;
	camera: CameraType;
	scene: THREE.Scene;
};
