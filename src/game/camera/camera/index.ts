import * as THREE from 'three';
import { eventBusSubscriptions } from '../../../eventBus';
import { cameraControl } from '../cameraControl';

export type CameraType = {
	userData: {
		rotateX: number;
		rotateY: number;
	};
} & THREE.PerspectiveCamera;

const CAMERA_OPTIONS = {
	isCarCamera: true,
	isCharacterCamera: false,
	maxRotateX: Math.PI / 2.4,
	maxZoom: 50,
	minZoom: 5,
	currentZoom: 5,
	moveSenseDivider: 800,
};

export const setupCamera = (scene: THREE.Scene, watchId: string): { camera: CameraType; destroy: () => void } => {
	const camera: CameraType = new THREE.PerspectiveCamera(50, 1, 0.4, 10000) as CameraType;
	camera.userData = {
		rotateX: 0,
		rotateY: 0,
	};

	// делаем контейнер для камеры когда управляем персонажем вращаем его по x
	const cameraCharacterXContainer = new THREE.Group();
	cameraCharacterXContainer.position.set(0, 1, 0);

	// делаем объект камеры для персонажа вращаем по y
	const cameraCharacterYContainer = new THREE.Group();

	cameraCharacterYContainer.add(cameraCharacterXContainer);

	scene.add(cameraCharacterYContainer);

	// делаем контейнер для камеры когда управляем машиной вращаем его по x
	const cameraCarXContainer = new THREE.Group();
	camera.position.set(0, 0, CAMERA_OPTIONS.currentZoom);
	cameraCarXContainer.add(camera);

	// вращаем его по y
	const cameraCarYContainer = new THREE.Group();

	cameraCarYContainer.add(cameraCarXContainer);

	scene.add(cameraCarYContainer);

	const zoomCamera = (zoom: number): void => {
		if (CAMERA_OPTIONS.isCharacterCamera) return;
		const nextZoom = camera.position.z + zoom;
		if (nextZoom > CAMERA_OPTIONS.maxZoom || nextZoom < CAMERA_OPTIONS.minZoom) return;
		CAMERA_OPTIONS.currentZoom = nextZoom;
		camera.position.z = CAMERA_OPTIONS.currentZoom;
	};

	const moveCamera = (x: number, y: number): void => {
		if (CAMERA_OPTIONS.isCarCamera) {
			const nextRotateX = cameraCarXContainer.rotation.x - y / CAMERA_OPTIONS.moveSenseDivider;

			cameraCarYContainer.rotation.y -= x / CAMERA_OPTIONS.moveSenseDivider;

			if (Math.abs(nextRotateX) < CAMERA_OPTIONS.maxRotateX && nextRotateX < 0)
				cameraCarXContainer.rotation.x = nextRotateX;

			camera.userData = {
				rotateX: cameraCarXContainer.rotation.x,
				rotateY: cameraCarYContainer.rotation.y,
			};
		}

		if (CAMERA_OPTIONS.isCharacterCamera) {
			const nextRotateX = cameraCharacterXContainer.rotation.x - y / CAMERA_OPTIONS.moveSenseDivider;

			cameraCharacterYContainer.rotation.y -= x / CAMERA_OPTIONS.moveSenseDivider;

			if (Math.abs(nextRotateX) < CAMERA_OPTIONS.maxRotateX) cameraCharacterXContainer.rotation.x = nextRotateX;

			camera.userData = {
				rotateX: cameraCharacterXContainer.rotation.x,
				rotateY: cameraCharacterYContainer.rotation.y,
			};
		}
	};

	const updateCameraPosition = (position: THREE.Vector3): void => {
		if (CAMERA_OPTIONS.isCarCamera) {
			// двигаем камеру для машины и задаем ей точку слежки
			camera.lookAt(position);
			cameraCarYContainer.position.copy(position);
		}

		if (CAMERA_OPTIONS.isCharacterCamera) {
			// двигаем камеру для персонажа
			cameraCharacterYContainer.position.copy(position);
		}
	};

	eventBusSubscriptions.subscribeOnCarMove(({ id, chassis }) => {
		if (id === watchId && chassis && CAMERA_OPTIONS.isCarCamera)
			updateCameraPosition(new THREE.Vector3(chassis.position.x, chassis.position.y, chassis.position.z));
	});

	eventBusSubscriptions.subscribeOnCharacterMove(({ id, position }) => {
		if (id === watchId && CAMERA_OPTIONS.isCharacterCamera)
			updateCameraPosition(new THREE.Vector3(position.x, position.y, position.z));
	});

	eventBusSubscriptions.subscribeOnEnterCar(() => {
		CAMERA_OPTIONS.isCarCamera = true;
		CAMERA_OPTIONS.isCharacterCamera = false;
		cameraCharacterXContainer.remove(camera);
		cameraCarXContainer.add(camera);
		camera.position.set(0, 0, CAMERA_OPTIONS.currentZoom);
	});

	eventBusSubscriptions.subscribeOnExitCar(() => {
		CAMERA_OPTIONS.isCarCamera = false;
		CAMERA_OPTIONS.isCharacterCamera = true;
		cameraCarXContainer.remove(camera);
		cameraCharacterXContainer.add(camera);
		camera.position.set(0, 0, 0);
	});

	eventBusSubscriptions.subscribeOnResizeWithInit(({ height, width }) => {
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
	});

	const { destroy } = cameraControl({
		onZoomChange: zoomCamera,
		onMoveChange: moveCamera,
	});

	return {
		camera,
		destroy,
	};
};
