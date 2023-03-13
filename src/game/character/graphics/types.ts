import * as THREE from 'three';

export type CharacterGraphicsCmd = {
	id: string;
	/**
	 * сцена
	 */
	scene: THREE.Scene;
	/**
	 * тип персонажа
	 */
	isFPV: boolean;
};

export type Animations = 'devilIdle' | 'devilIdleFPV' | 'devilShotFPV' | 'devilShot' | 'windIdle' | 'tornadoIdle';
export type Bones = 'spine' | 'rightShoulder';

export type CharacterAnimations = Map<Animations, THREE.AnimationAction>;
export type CharacterBones = Map<Bones, THREE.Object3D>;
