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
	lookAtPosition: new THREE.Vector3(0, 0, 0),
};

/**
 * Вычисляет следующее значение вращения по оси Y следит что бы оно не было положительным (камера опускалась ниже земли грубо говоря) и что бы не превышало максимальное значение указанное в настройках (темечко объекта за которым следим)
 */
const getRotateY = (diffRotate: number): number => {
	const requestRotate = CAMERA_OPTIONS.rotateY + changeNumberSign(diffRotate) / CAMERA_OPTIONS.moveSenseDivider;
	// if (requestRotate > 0) return CAMERA_OPTIONS.rotateY;
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
	const moveCamera = ({ movementY, movementX }: MouseEvent): void => {
		const currentRotateX = getRotateX(movementX);
		const currentRotateY = getRotateY(movementY);

		const quaternionX = new THREE.Quaternion();
		quaternionX.setFromAxisAngle(new THREE.Vector3(0, 1, 0), currentRotateX);
		const quaternionY = new THREE.Quaternion();
		quaternionY.setFromAxisAngle(new THREE.Vector3(1, 0, 0), currentRotateY);
		cameraContainer.setRotationFromQuaternion(quaternionX.multiply(quaternionY));

		CAMERA_OPTIONS.rotateX = currentRotateX;
		CAMERA_OPTIONS.rotateY = currentRotateY;
	};

	const cancelMoveCamera = (): void => {
		window.removeEventListener('mousemove', moveCamera);
		window.removeEventListener('mouseup', cancelMoveCamera);
	};

	const startMoveHandler = (): void => {
		window.addEventListener('mousemove', moveCamera);
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

	const wheelEventHandler: (ev: WheelEvent) => void = ev => {
		const requestZoom = cameraMesh.position.z + ev.deltaY * 0.01;
		if (requestZoom > CAMERA_OPTIONS.maxZoom || requestZoom < CAMERA_OPTIONS.minZoom) return;
		cameraMesh.position.z = requestZoom;
	};

	window.addEventListener('wheel', wheelEventHandler);

	return {
		camera,
		destroy: (): void => {
			window.removeEventListener('mousedown', startMoveHandler);
			window.removeEventListener('wheel', wheelEventHandler);
			cancelMoveCamera();
		},
	};
};
