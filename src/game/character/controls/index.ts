import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import { CharacterMoveSpecs, eventBusSubscriptions, eventBusTriggers, eventBusUnsubscribe } from '../../../eventBus';
import { SetupCharacterControlCmd } from './types';
import { cannonToThreeVec, threeToCannonQuaternion } from '../../../libs/utils';

/**
 * функция осуществляющая рассчет положения персонажа исходя их действий пользователя
 */
export const setupCharacterControl = (
	props: SetupCharacterControlCmd
): {
	damaged: (damage: number) => void;
	destroy: () => void;
} => {
	const CHARACTER_SETTINGS = {
		up: false,
		left: false,
		down: false,
		right: false,
		boost: false,

		contactNormal: new CANNON.Vec3(),

		velocityForce: 7,
		boostVelocityForce: 10,
		jumpVelocityForce: 7,
		shotgunJumpVelocityForce: 15,
		carKillVelocity: 15,

		hp: 100,
		bullets: 20000,
		isReload: false,

		shotCooldown: 100,
		prevShotTime: 0,

		isInTheAir: false,
	};

	const { id, character, camera, scene, shotAnimation } = props;

	// делаем луч
	const shootRaycaster = new THREE.Raycaster();
	const floorRaycaster = new THREE.Raycaster();

	const damaged = (damage: number): void => {
		const nexHp = CHARACTER_SETTINGS.hp - damage;
		if (nexHp <= 0) return eventBusTriggers.triggerOnEnterCar();
		CHARACTER_SETTINGS.hp = nexHp;
	};

	const jumpHandler = (): void => {
		if (CHARACTER_SETTINGS.isInTheAir) return;
		CHARACTER_SETTINGS.isInTheAir = true;
		character.velocity.y = CHARACTER_SETTINGS.jumpVelocityForce;
	};

	const reloadHandler = (): void => {
		if (CHARACTER_SETTINGS.bullets === 2 || CHARACTER_SETTINGS.isReload) return;
		CHARACTER_SETTINGS.isReload = true;
		setTimeout(() => {
			CHARACTER_SETTINGS.bullets = 2;
			CHARACTER_SETTINGS.isReload = false;
		}, 1000);
	};

	const shootGunJumpHandler = (): void => {
		const cameraDirectionNegate = new THREE.Vector3();
		camera.getWorldDirection(cameraDirectionNegate).negate();

		character.velocity.x =
			character.velocity.x / 2 + cameraDirectionNegate.x * CHARACTER_SETTINGS.shotgunJumpVelocityForce;
		character.velocity.z =
			character.velocity.z / 2 + cameraDirectionNegate.z * CHARACTER_SETTINGS.shotgunJumpVelocityForce;
		character.velocity.y =
			character.velocity.y / 2 + cameraDirectionNegate.y * CHARACTER_SETTINGS.shotgunJumpVelocityForce;
	};

	const defaultVelocityHandler = (): void => {
		const inputVelocity = new THREE.Vector3(0, 0, 0);

		if (CHARACTER_SETTINGS.up && !CHARACTER_SETTINGS.down) {
			inputVelocity.z = CHARACTER_SETTINGS.boost
				? -CHARACTER_SETTINGS.boostVelocityForce
				: -CHARACTER_SETTINGS.velocityForce;
		}
		if (CHARACTER_SETTINGS.down && !CHARACTER_SETTINGS.up) {
			inputVelocity.z = CHARACTER_SETTINGS.velocityForce;
		}

		if (CHARACTER_SETTINGS.left && !CHARACTER_SETTINGS.right) {
			inputVelocity.x = -CHARACTER_SETTINGS.velocityForce;
		}
		if (CHARACTER_SETTINGS.right && !CHARACTER_SETTINGS.left) {
			inputVelocity.x = CHARACTER_SETTINGS.velocityForce;
		}

		const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, camera.userData.rotateY, 0));

		inputVelocity.applyQuaternion(quaternion);

		character.velocity.x = inputVelocity.x;
		character.velocity.z = inputVelocity.z;
	};

	const inAirVelocityHandler = (): void => {
		const inputVelocity = new THREE.Vector3(0, 0, 0);

		if (CHARACTER_SETTINGS.up && !CHARACTER_SETTINGS.down) {
			inputVelocity.z = -CHARACTER_SETTINGS.velocityForce / 100;
		}
		if (CHARACTER_SETTINGS.down && !CHARACTER_SETTINGS.up) {
			inputVelocity.z = CHARACTER_SETTINGS.velocityForce / 100;
		}

		if (CHARACTER_SETTINGS.left && !CHARACTER_SETTINGS.right) {
			inputVelocity.x = -CHARACTER_SETTINGS.velocityForce / 100;
		}
		if (CHARACTER_SETTINGS.right && !CHARACTER_SETTINGS.left) {
			inputVelocity.x = CHARACTER_SETTINGS.velocityForce / 100;
		}

		const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, camera.userData.rotateY, 0));

		inputVelocity.applyQuaternion(quaternion);

		character.velocity.x += inputVelocity.x;
		character.velocity.z += inputVelocity.z;
	};

	const clickHandler = (ev: MouseEvent): void => {
		if (ev.button !== 0) return;
		const currentTime = performance.now();

		if (
			currentTime < CHARACTER_SETTINGS.prevShotTime + CHARACTER_SETTINGS.shotCooldown ||
			CHARACTER_SETTINGS.bullets === 0
		)
			return;

		CHARACTER_SETTINGS.prevShotTime = currentTime;
		CHARACTER_SETTINGS.bullets -= 1;

		shotAnimation();
		if (CHARACTER_SETTINGS.isInTheAir) shootGunJumpHandler();

		eventBusTriggers.triggerOnCharacterShot();

		const intersects = shootRaycaster.intersectObjects(scene.children, false);
		const intersectId = intersects[0]?.object?.userData?.id;
		// console.log(intersects, intersectId);

		if (!intersectId) return;
		eventBusTriggers.triggerOnCharacterDamaged({
			idDamaged: intersectId,
			idDamaging: id,
			damage: 25,
		});
	};

	const onTickPhysic = (): void => {
		shootRaycaster.setFromCamera(new THREE.Vector2(), camera);
		floorRaycaster.set(cannonToThreeVec(character.position), new THREE.Vector3(0, -0.1, 0));

		const intersects = floorRaycaster.intersectObjects(scene.children, false);
		console.log(intersects);

		if (!CHARACTER_SETTINGS.isInTheAir) defaultVelocityHandler();
		if (CHARACTER_SETTINGS.isInTheAir) inAirVelocityHandler();

		const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, camera.userData.rotateY, 0));

		character.quaternion.copy(threeToCannonQuaternion(quaternion));

		const characterMoveSpecs: CharacterMoveSpecs = {
			position: character.position,
			quaternion: character.quaternion,
			rotateX: camera.userData.rotateX,
		};

		eventBusTriggers.triggerOnCharacterMove({ id, ...characterMoveSpecs });
	};

	character.addEventListener('collide', (ev: any) => {
		const relativeVelocity = ev.contact.getImpactVelocityAlongNormal();
		const { contact } = ev;

		let otherBody: CANNON.Body | null;

		if (contact.bi.id === character.id) {
			contact.ni.negate(CHARACTER_SETTINGS.contactNormal);
			otherBody = contact.bj;
		} else {
			CHARACTER_SETTINGS.contactNormal.copy(contact.ni);
			otherBody = contact.bi;
		}

		if (otherBody && otherBody.mass > character.mass && relativeVelocity >= CHARACTER_SETTINGS.carKillVelocity) {
			console.log('dead');
			// setTimeout(() => damaged(100), 100);
			// damaged(100);
		}

		CHARACTER_SETTINGS.isInTheAir = CHARACTER_SETTINGS.contactNormal.dot(new CANNON.Vec3(0, 1, 0)) < 0.5;
	});

	const keyPressHandler = (ev: KeyboardEvent): void => {
		if (ev.repeat) return;
		const isPressed = ev.type === 'keydown';
		switch (ev.code) {
			case 'KeyW':
				CHARACTER_SETTINGS.up = isPressed;
				break;
			case 'KeyA':
				CHARACTER_SETTINGS.left = isPressed;
				break;
			case 'KeyS':
				CHARACTER_SETTINGS.down = isPressed;
				break;
			case 'KeyD':
				CHARACTER_SETTINGS.right = isPressed;
				break;
			case 'KeyR':
				reloadHandler();
				break;
			case 'Space':
				jumpHandler();
				break;
			case 'ShiftLeft':
				CHARACTER_SETTINGS.boost = isPressed;
				break;
			case 'KeyF':
				if (!isPressed) return;
				eventBusTriggers.triggerOnEnterCar();
				break;
			default:
				break;
		}
	};

	// const touchPressHandler = (id: CAR_CONTROLS_IDS, isPressed: boolean): void => {
	// 	switch (id) {
	// 		case CAR_CONTROLS_IDS.FORWARD:
	// 			CAR_SETTINGS.up = isPressed;
	// 			break;
	// 		case CAR_CONTROLS_IDS.LEFT:
	// 			CAR_SETTINGS.left = isPressed;
	// 			break;
	// 		case CAR_CONTROLS_IDS.REVERS:
	// 			CAR_SETTINGS.down = isPressed;
	// 			break;
	// 		case CAR_CONTROLS_IDS.RIGHT:
	// 			CAR_SETTINGS.right = isPressed;
	// 			break;
	// 		case CAR_CONTROLS_IDS.BRAKE:
	// 			CAR_SETTINGS.brake = isPressed;
	// 			break;
	// 		case CAR_CONTROLS_IDS.FORWARD_BOOST:
	// 			CAR_SETTINGS.up = isPressed;
	// 			CAR_SETTINGS.boost = isPressed;
	// 			break;
	// 		case CAR_CONTROLS_IDS.RESPAWN:
	// 			if (!isPressed) return;
	// 			respawnHandler();
	// 			break;
	// 		default:
	// 			break;
	// 	}
	// };

	// const touchHandler = (ev: TouchEvent): void => {
	// 	const isPressed = ev.type === 'touchstart';
	// 	const id = (ev?.target as HTMLElement)?.id as CAR_CONTROLS_IDS | undefined;
	// 	if (!id || !Object.keys(CAR_CONTROLS_IDS).includes(id)) return;
	// 	ev.preventDefault();
	// 	touchPressHandler(id, isPressed);
	// };

	const windowBlurHandler = (): void => {
		CHARACTER_SETTINGS.up = false;
		CHARACTER_SETTINGS.left = false;
		CHARACTER_SETTINGS.down = false;
		CHARACTER_SETTINGS.right = false;
		CHARACTER_SETTINGS.boost = false;
	};

	eventBusSubscriptions.subscribeOnTickPhysic(onTickPhysic);

	// window.addEventListener('touchstart', touchHandler, { passive: false });
	// window.addEventListener('touchend', touchHandler, { passive: false });
	window.addEventListener('keydown', keyPressHandler);
	window.addEventListener('click', clickHandler);
	window.addEventListener('keyup', keyPressHandler);
	window.addEventListener('blur', windowBlurHandler);

	return {
		damaged,
		destroy: (): void => {
			eventBusUnsubscribe.unsubscribeOnTickPhysic(onTickPhysic);
			// window.removeEventListener('touchstart', touchHandler);
			// window.removeEventListener('touchend', touchHandler);
			window.removeEventListener('keydown', keyPressHandler);
			window.removeEventListener('click', clickHandler);
			window.removeEventListener('keyup', keyPressHandler);
			window.removeEventListener('blur', windowBlurHandler);
		},
	};
};
