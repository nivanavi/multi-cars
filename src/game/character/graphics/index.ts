import * as THREE from 'three';
import {
	CharacterMoveSpecs,
	eventBusSubscriptions,
	eventBusTriggers,
	eventBusUnsubscribe,
	TriggerOnTickCmd,
} from '../../../eventBus';
import { cannonToThreeQuaternion, cannonToThreeVec, changeNumberSign } from '../../../libs/utils';
import { MODELS_SRC } from '../../../models';
import { Animations, CharacterAnimations, CharacterBones, CharacterGraphicsCmd } from './types';
import { CreateModelCmd, createModelContainer } from '../../../libs/modelLoader';

const DEFAULT_SPINE_ROTATION = -1.68;
const DEFAULT_RIGHT_SHOULDER_ROTATION = 1.53;

const graphics: { fpv: CreateModelCmd; default: CreateModelCmd } = {
	fpv: {
		name: 'devilFPV',
		modelSrc: MODELS_SRC.characterFPVModelSrc,
		castShadow: false,
		rotation: new THREE.Euler(0, 0, 0),
		scale: new THREE.Vector3(0.45, 0.45, 0.45),
		position: new THREE.Vector3(0, -1.2, -0.25),
	},
	default: {
		name: 'devil',
		modelSrc: MODELS_SRC.characterModelSrc,
		castShadow: true,
		rotation: new THREE.Euler(0, Math.PI, 0),
		scale: new THREE.Vector3(0.45, 0.45, 0.45),
		position: new THREE.Vector3(0, -1.2, 0),
	},
};

export const setupCharacterGraphics = (
	props: CharacterGraphicsCmd
): {
	character: THREE.Object3D;
	bones: CharacterBones;
	shotAnimation: (shooterPosition?: THREE.Vector3) => void;
	update: (specs: CharacterMoveSpecs) => void;
	destroy: () => void;
} => {
	const { id, scene, isFPV } = props;

	const CHARACTER_SETTINGS = {
		minSpineRotation: -0.5,
		maxSpineRotation: 0.5,

		minShoulderRotation: -1.15,
		maxShoulderRotation: 1.15,

		isPlayIdleAnimations: false,
	};

	const animations: CharacterAnimations = new Map();
	const bones: CharacterBones = new Map();
	let mixer: THREE.AnimationMixer | null = null;

	const characterContainer = createModelContainer({
		...(isFPV ? graphics.fpv : graphics.default),
		userData: {
			id,
		},
		callback: (_, model) => {
			const spine = model.scene.getObjectByName('spine') || null;
			const rightShoulder = model.scene.getObjectByName('rightShoulder') || null;
			const tornadoContainer = model.scene.getObjectByName('tornadoContainer') || null;
			const windContainer = model.scene.getObjectByName('windContainer') || null;
			if (spine) bones.set('spine', spine);
			if (rightShoulder) bones.set('rightShoulder', rightShoulder);

			if (isFPV && tornadoContainer) tornadoContainer.visible = false;
			if (isFPV && windContainer) windContainer.visible = false;

			const gltfAnimations: THREE.AnimationClip[] = model.animations;
			const setupMixer = new THREE.AnimationMixer(model.scene);
			gltfAnimations.forEach(animation =>
				animations.set(animation.name as Animations, setupMixer.clipAction(animation))
			);
			mixer = setupMixer;
		},
	});

	scene.add(characterContainer);

	const setupDefaultAnimationsHandler = (): void => {
		if (CHARACTER_SETTINGS.isPlayIdleAnimations || isFPV) return;

		const tornadoAnimation = animations.get('tornadoIdle');
		const windAnimation = animations.get('windIdle');
		const devilIdleAnimation = animations.get('devilIdle');

		if (!tornadoAnimation || !windAnimation || !devilIdleAnimation) return;

		tornadoAnimation.timeScale = 10;
		windAnimation.timeScale = 5;

		tornadoAnimation.reset().play();
		windAnimation.reset().play();
		devilIdleAnimation.reset().play();

		CHARACTER_SETTINGS.isPlayIdleAnimations = true;
	};

	const setupFPVAnimationsHandler = (): void => {
		if (CHARACTER_SETTINGS.isPlayIdleAnimations || !isFPV) return;

		const devilIdleFPVAnimation = animations.get('devilIdleFPV');

		if (!devilIdleFPVAnimation) return;

		devilIdleFPVAnimation.reset().play();

		CHARACTER_SETTINGS.isPlayIdleAnimations = true;
	};

	const shotAnimationHandler = (position?: THREE.Vector3): void => {
		const shotAnimation = isFPV ? animations.get('devilShotFPV') : animations.get('devilShot');

		if (!shotAnimation) return;

		shotAnimation.repetitions = 1;
		shotAnimation.timeScale = 2;

		shotAnimation.reset().fadeIn(0.2).play();

		const velocity = position ? 1 / characterContainer.position.distanceTo(position) : 1;

		eventBusTriggers.triggerOnPlaySound({
			sound: 'shotgun',
			velocity,
		});
	};

	const update = (specs: CharacterMoveSpecs): void => {
		const { position, quaternion, rotateX } = specs;
		characterContainer.position.copy(cannonToThreeVec(position));
		characterContainer.quaternion.copy(cannonToThreeQuaternion(quaternion));

		const spine = bones.get('spine');
		const rightShoulder = bones.get('rightShoulder');

		if (!spine || !rightShoulder) return;

		if (!isFPV && rotateX < CHARACTER_SETTINGS.maxSpineRotation && rotateX > CHARACTER_SETTINGS.minSpineRotation) {
			spine.rotation.x = DEFAULT_SPINE_ROTATION + changeNumberSign(rotateX);
		}

		const currentSpineRotationIncrease = spine.rotation.x - DEFAULT_SPINE_ROTATION;

		rightShoulder.rotation.x =
			DEFAULT_RIGHT_SHOULDER_ROTATION + changeNumberSign(rotateX) - currentSpineRotationIncrease;
	};

	const callInTickHandler = ({ delta }: TriggerOnTickCmd): void => {
		setupDefaultAnimationsHandler();
		setupFPVAnimationsHandler();
		if (mixer) mixer.update(delta);
	};

	eventBusSubscriptions.subscribeOnTick(callInTickHandler);

	const destroy = (): void => {
		scene.remove(characterContainer);
		eventBusUnsubscribe.unsubscribeOnTick(callInTickHandler);
	};

	return {
		update,
		character: characterContainer,
		shotAnimation: shotAnimationHandler,
		bones,
		destroy,
	};
};
