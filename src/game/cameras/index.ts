import * as THREE from 'three';
import { eventBusSubscriptions } from '../../eventBus';
import { changeNumberSign } from '../../libs/utils';

const CAMERA_OPTIONS = {
	maxRotateY: Math.PI / 2.5,
	maxZoom: 50,
	minZoom: 5,
	moveSenseDivider: 300,
	rotateX: 0,
	rotateY: 0,
	prevTouchRotateX: 0,
	prevTouchRotateY: 0,
	prevTouchScaleDistance: 0,
	lookAtPosition: new THREE.Vector3(0, 0, 0),
};

/**
 * Вычисляет следующее значение вращения по оси Y следит что бы оно не было положительным (камера опускалась ниже земли грубо говоря) и что бы не превышало максимальное значение указанное в настройках (темечко объекта за которым следим)
 */
const getRotateY = (diffRotate: number): number => {
	const requestRotate = CAMERA_OPTIONS.rotateY + changeNumberSign(diffRotate) / CAMERA_OPTIONS.moveSenseDivider;
	if (requestRotate > 0) return CAMERA_OPTIONS.rotateY;
	if (Math.abs(requestRotate) > CAMERA_OPTIONS.maxRotateY) return CAMERA_OPTIONS.rotateY;
	return requestRotate;
};
const getRotateX = (diffRotate: number): number =>
	CAMERA_OPTIONS.rotateX + changeNumberSign(diffRotate) / CAMERA_OPTIONS.moveSenseDivider;
export const setupCamera = (
	scene: THREE.Scene,
	watchCarId: string
): { camera: THREE.PerspectiveCamera; destroy: () => void } => {
	const camera = new THREE.PerspectiveCamera(50, 1, 1, 10000);

	const cameraContainer = new THREE.Group();
	cameraContainer.position.set(0, 0.1, 0);

	const cameraMaterial = new THREE.MeshBasicMaterial();
	const cameraGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
	const cameraMesh = new THREE.Mesh(cameraGeometry, cameraMaterial);
	cameraMesh.visible = false;
	cameraMesh.position.set(0, 0, CAMERA_OPTIONS.minZoom);

	cameraContainer.add(cameraMesh);

	scene.add(cameraContainer);

	const moveCamera = (x: number, y: number): void => {
		const currentRotateX = getRotateX(x);
		const currentRotateY = getRotateY(y);

		const quaternionX = new THREE.Quaternion();
		quaternionX.setFromAxisAngle(new THREE.Vector3(0, 1, 0), currentRotateX);
		const quaternionY = new THREE.Quaternion();
		quaternionY.setFromAxisAngle(new THREE.Vector3(1, 0, 0), currentRotateY);
		cameraContainer.setRotationFromQuaternion(quaternionX.multiply(quaternionY));

		CAMERA_OPTIONS.rotateX = currentRotateX;
		CAMERA_OPTIONS.rotateY = currentRotateY;
	};
	const mousemoveHandler = ({ movementY, movementX }: MouseEvent): void => {
		moveCamera(movementX, movementY);
	};

	const cancelMoveCamera = (): void => {
		window.removeEventListener('mousemove', mousemoveHandler);
		window.removeEventListener('mouseup', cancelMoveCamera);
	};

	const startMoveHandler = (): void => {
		window.addEventListener('mousemove', mousemoveHandler);
		window.addEventListener('mouseup', cancelMoveCamera);
	};

	window.addEventListener('mousedown', startMoveHandler);

	eventBusSubscriptions.subscribeOnResizeWithInit(({ height, width }) => {
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
	});

	eventBusSubscriptions.subscribeOnTickPhysic(() => {
		const position = new THREE.Vector3().setFromMatrixPosition(cameraMesh.matrixWorld);
		camera.position.set(position.x, position.y, position.z);
		camera.lookAt(CAMERA_OPTIONS.lookAtPosition);
		cameraContainer.position.copy(CAMERA_OPTIONS.lookAtPosition);
	});

	eventBusSubscriptions.subscribeOnCarMove(({ id, chassis }) => {
		if (id === watchCarId && chassis)
			CAMERA_OPTIONS.lookAtPosition.set(chassis.position.x, chassis.position.y, chassis.position.z);
	});

	const zoomCamera = (zoom: number): void => {
		const nextZoom = cameraMesh.position.z + zoom;
		if (nextZoom > CAMERA_OPTIONS.maxZoom || nextZoom < CAMERA_OPTIONS.minZoom) return;
		cameraMesh.position.z = nextZoom;
	};
	const wheelEventHandler: (ev: WheelEvent) => void = ev => {
		zoomCamera(ev.deltaY * 0.01);
	};

	window.addEventListener('wheel', wheelEventHandler);

	const touchStartHandler = (ev: TouchEvent): void => {
		const firstTouch = ev.touches[0];
		const secondTouch = ev.touches[1];
		if (firstTouch && secondTouch) return;
		CAMERA_OPTIONS.prevTouchRotateX = firstTouch.clientX;
		CAMERA_OPTIONS.prevTouchRotateY = firstTouch.clientY;
	};
	const touchMoveHandler = (ev: TouchEvent): void => {
		const firstTouch = ev.touches[0];
		const secondTouch = ev.touches[1];

		if (firstTouch && secondTouch) {
			const dist = Math.hypot(firstTouch.pageX - secondTouch.pageX, firstTouch.pageY - secondTouch.pageY);

			if (dist < CAMERA_OPTIONS.prevTouchScaleDistance) zoomCamera(0.2);
			if (dist > CAMERA_OPTIONS.prevTouchScaleDistance) zoomCamera(-0.2);

			CAMERA_OPTIONS.prevTouchScaleDistance = dist;
			return;
		}

		moveCamera(
			firstTouch.clientX - CAMERA_OPTIONS.prevTouchRotateX,
			firstTouch.clientY - CAMERA_OPTIONS.prevTouchRotateY
		);
		CAMERA_OPTIONS.prevTouchRotateX = firstTouch.clientX;
		CAMERA_OPTIONS.prevTouchRotateY = firstTouch.clientY;
	};

	const touchEndHandler = (): void => {
		CAMERA_OPTIONS.prevTouchScaleDistance = 0;
	};

	window.addEventListener('touchmove', touchMoveHandler);
	window.addEventListener('touchstart', touchStartHandler);
	window.addEventListener('touchend', touchEndHandler);

	return {
		camera,
		destroy: (): void => {
			window.removeEventListener('mousedown', startMoveHandler);
			window.removeEventListener('wheel', wheelEventHandler);
			window.removeEventListener('touchmove', touchMoveHandler);
			window.removeEventListener('touchstart', touchStartHandler);
			window.removeEventListener('touchend', touchEndHandler);
			cancelMoveCamera();
		},
	};
};
