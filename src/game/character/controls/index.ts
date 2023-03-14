import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import {
	CharacterDamaged,
	CharacterMoveSpecs,
	DeleteCharacterReasons,
	eventBusSubscriptions,
	eventBusTriggers,
	eventBusUnsubscribe,
} from '../../../eventBus';
import { SetupCharacterControlCmd } from './types';
import { threeToCannonQuaternion } from '../../../libs/utils';

/**
 * функция осуществляющая рассчет положения персонажа исходя их действий пользователя
 */
export const setupCharacterControl = (
	props: SetupCharacterControlCmd
): {
	damaged: (data: CharacterDamaged) => void;
	destroy: () => void;
} => {
	const CHARACTER_SETTINGS = {
		up: false,
		left: false,
		down: false,
		right: false,
		boost: false,

		velocityForce: 7,
		boostVelocityForce: 10,
		jumpVelocityForce: 8,
		shotgunJumpVelocityForce: 20,
		carKillVelocity: 15,

		hp: 100,
		currentBullets: 2,
		bullets: 36,
		isReload: false,

		shotCooldown: 200,
		prevShotTime: 0,

		isInTheAir: false,
	};

	const { id, nickname, character, camera, scene, physicWorld, shotAnimation } = props;

	console.log('character.position in control', character.position);

	// делаем луч
	const shootRaycaster = new THREE.Raycaster();

	const floorRaycaster = new CANNON.Ray();
	floorRaycaster.skipBackfaces = true;
	floorRaycaster.mode = 1;

	const updateInterface = (): void =>
		eventBusTriggers.triggerOnCharacterInterfaceUpdate({
			currentBullets: CHARACTER_SETTINGS.currentBullets,
			bullets: CHARACTER_SETTINGS.bullets,
			hp: CHARACTER_SETTINGS.hp,
		});

	updateInterface();

	const damaged = (data: CharacterDamaged): void => {
		const nexHp = CHARACTER_SETTINGS.hp - data.damage;
		if (nexHp <= 0)
			return eventBusTriggers.triggerOnDeleteRootCharacter({
				reason: DeleteCharacterReasons.DEAD_BY_PLAYER,
				killerNickname: data.nicknameDamaging,
			});
		CHARACTER_SETTINGS.hp = nexHp;
		updateInterface();
	};

	const jumpHandler = (): void => {
		if (CHARACTER_SETTINGS.isInTheAir) return;
		CHARACTER_SETTINGS.isInTheAir = true;
		character.velocity.y = CHARACTER_SETTINGS.jumpVelocityForce;
	};

	const reloadHandler = (): void => {
		if (CHARACTER_SETTINGS.currentBullets === 2 || CHARACTER_SETTINGS.bullets === 0 || CHARACTER_SETTINGS.isReload)
			return;
		CHARACTER_SETTINGS.isReload = true;
		eventBusTriggers.triggerOnPlaySound({
			sound: 'shotgunReload',
			velocity: 1,
		});
		setTimeout(() => {
			const totalBullets = CHARACTER_SETTINGS.bullets + CHARACTER_SETTINGS.currentBullets;
			const bulletsToUpload = totalBullets === 1 ? 1 : 2;

			CHARACTER_SETTINGS.currentBullets = bulletsToUpload;
			CHARACTER_SETTINGS.bullets = totalBullets - bulletsToUpload;
			CHARACTER_SETTINGS.isReload = false;
			updateInterface();
		}, 1000);
	};

	const shootGunJumpHandler = (): void => {
		const cameraDirectionNegate = new THREE.Vector3();
		camera.getWorldDirection(cameraDirectionNegate).negate();

		const shotVelocity = new CANNON.Vec3(
			cameraDirectionNegate.x * CHARACTER_SETTINGS.shotgunJumpVelocityForce,
			cameraDirectionNegate.y * CHARACTER_SETTINGS.shotgunJumpVelocityForce,
			cameraDirectionNegate.z * CHARACTER_SETTINGS.shotgunJumpVelocityForce
		);

		character.velocity.copy(character.velocity.vadd(shotVelocity));
	};

	const defaultVelocityHandler = (): void => {
		const { up, down, left, right } = CHARACTER_SETTINGS;

		const inputVelocity = new THREE.Vector3(0, 0, 0);

		if (up && !down) {
			inputVelocity.z = CHARACTER_SETTINGS.boost
				? -CHARACTER_SETTINGS.boostVelocityForce
				: -CHARACTER_SETTINGS.velocityForce;
		}
		if (down && !up) {
			inputVelocity.z = CHARACTER_SETTINGS.velocityForce;
		}

		if (left && !right) {
			inputVelocity.x = -CHARACTER_SETTINGS.velocityForce;
		}
		if (right && !left) {
			inputVelocity.x = CHARACTER_SETTINGS.velocityForce;
		}

		const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, camera.userData.rotateY, 0));

		inputVelocity.applyQuaternion(quaternion);

		character.velocity.x = inputVelocity.x;
		character.velocity.z = inputVelocity.z;
	};

	const inAirVelocityHandler = (): void => {
		const { up, down, left, right } = CHARACTER_SETTINGS;

		const inputVelocity = new THREE.Vector3(0, 0, 0);

		if (up && !down) {
			inputVelocity.z = -CHARACTER_SETTINGS.velocityForce / 100;
		}
		if (down && !up) {
			inputVelocity.z = CHARACTER_SETTINGS.velocityForce / 100;
		}

		if (left && !right) {
			inputVelocity.x = -CHARACTER_SETTINGS.velocityForce / 100;
		}
		if (right && !left) {
			inputVelocity.x = CHARACTER_SETTINGS.velocityForce / 100;
		}

		const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, camera.userData.rotateY, 0));

		inputVelocity.applyQuaternion(quaternion);

		character.velocity.x += inputVelocity.x;
		character.velocity.z += inputVelocity.z;
		character.velocity.y -= CHARACTER_SETTINGS.velocityForce / 50;
	};

	const clickHandler = (ev: MouseEvent): void => {
		if (ev.button !== 0) return;
		const currentTime = performance.now();

		if (
			currentTime < CHARACTER_SETTINGS.prevShotTime + CHARACTER_SETTINGS.shotCooldown ||
			CHARACTER_SETTINGS.currentBullets === 0 ||
			CHARACTER_SETTINGS.isReload
		)
			return;

		CHARACTER_SETTINGS.prevShotTime = currentTime;
		CHARACTER_SETTINGS.currentBullets -= 1;

		shotAnimation();
		updateInterface();
		if (CHARACTER_SETTINGS.isInTheAir) shootGunJumpHandler();

		eventBusTriggers.triggerOnCharacterShot();

		const intersects = shootRaycaster.intersectObjects(scene.children);
		const { id: idDamaged } = intersects[0]?.object?.userData || {};

		if (!idDamaged) return;
		eventBusTriggers.triggerOnCharacterDamaged({
			idDamaged,
			nicknameDamaging: nickname,
			damage: 25,
		});
	};

	const onTickPhysic = (): void => {
		shootRaycaster.setFromCamera(new THREE.Vector2(), camera);

		floorRaycaster.from.copy(character.position);
		floorRaycaster.to.set(character.position.x, character.position.y - 1.4, character.position.z);
		floorRaycaster.direction.set(0, -1, 0);

		floorRaycaster.intersectBodies(physicWorld.bodies);

		CHARACTER_SETTINGS.isInTheAir = !floorRaycaster.result.hasHit;

		floorRaycaster.result.reset();

		if (!CHARACTER_SETTINGS.isInTheAir) defaultVelocityHandler();
		if (CHARACTER_SETTINGS.isInTheAir) inAirVelocityHandler();

		const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, camera.userData.rotateY, 0));

		character.quaternion.copy(threeToCannonQuaternion(quaternion));

		const characterMoveSpecs: CharacterMoveSpecs = {
			position: character.position,
			quaternion: character.quaternion,
			rotateX: camera.userData.rotateX,
		};

		console.log('character.position in trigger', character.position);

		eventBusTriggers.triggerOnCharacterMove({ id, ...characterMoveSpecs });
	};

	character.addEventListener('collide', (ev: any) => {
		const relativeVelocity = ev.contact.getImpactVelocityAlongNormal();
		const { bi, bj } = (ev || {}).contact || {};

		const otherBody: CANNON.Body = bi?.id === character.id ? bj : bi;

		if (otherBody && otherBody.mass > character.mass && relativeVelocity >= CHARACTER_SETTINGS.carKillVelocity) {
			queueMicrotask(() => {
				eventBusTriggers.triggerOnDeleteRootCharacter({
					reason: DeleteCharacterReasons.DEAD_BY_CAR,
				});
			});
		}
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
				eventBusTriggers.triggerOnDeleteRootCharacter({
					reason: DeleteCharacterReasons.ENTER_CAR,
				});
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
