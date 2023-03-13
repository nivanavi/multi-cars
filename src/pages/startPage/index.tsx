import React from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { StyledChooseItem, StyledStartPageWrapper, StyledStartWrapper } from './styles';
import { eventBusSubscriptions, eventBusTriggers, eventBusUnsubscribe } from '../../eventBus';
import { CAR_ITEM, createText, getCarType, getNickname, getPrevRoomId, NICKNAME_ITEM, uuid } from '../../libs/utils';
import { SceneIgniterContextProvider, useSceneIgniterContext } from '../../libs/sceneIgniter/SceneIgniter';
import { setupRenderer } from '../../libs/renderer';
import { Car, setupCarGraphics } from '../../game/car/graphics';

const CREATE_ROOM_ID = uuid();
const NICKNAME = getNickname();

const defaultCarSpecs =
	'{"steering":0.3240707511102649,"accelerating":0,"brake":0,"chassis":{"position":{"x":6.209922981512133e-10,"y":1.2180300790771568,"z":1.043726032343269e-9},"quaternion":{"x":2.286369093008103e-13,"y":2.544033793127587e-10,"z":0.0008983566672058353,"w":0.999999596477568}},"wheels":[{"position":{"x":-1.7988924781656301,"y":0.5999990315463578,"z":1.2000000019590153},"quaternion":{"x":-0.0001724171132824505,"y":0.1957628569871226,"z":0.000898246046037732,"w":0.9806508386019049}},{"position":{"x":-1.7988924793867669,"y":0.5999990315463583,"z":-1.1999999980409854},"quaternion":{"x":-0.00017241691407176215,"y":0.19576285698729803,"z":0.0008982470439600734,"w":0.9806508386009909}},{"position":{"x":1.9511135746794022,"y":0.599999031546358,"z":1.2000000000509863},"quaternion":{"x":2.2378236770171426e-13,"y":2.544033836293054e-10,"z":0.000879274610775308,"w":0.9999996134380047}},{"position":{"x":1.9511135734582654,"y":0.5999990315463583,"z":-1.1999999999490145},"quaternion":{"x":2.2378262658572286e-13,"y":2.544033836290777e-10,"z":0.0008792756283872,"w":0.99999961343711}}]}';

let prevTime = 0;
const setupStartScene = (
	nickname: string,
	canvas: HTMLCanvasElement
): {
	destroy: () => void;
} => {
	const CAR_TYPE = getCarType();
	const CARS_TO_CHOOSE: Car[] = [CAR_TYPE, ...Object.values(Car).filter(car => car !== CAR_TYPE)];

	// scene
	const scene = new THREE.Scene();

	// camera
	const camera = new THREE.PerspectiveCamera(50, 1.7, 1, 10000);
	camera.position.set(22, 5, 0);
	eventBusSubscriptions.subscribeOnResizeWithInit(({ height, width }) => {
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
	});
	camera.lookAt(new THREE.Vector3(0, 0, 0));

	// renderer
	const { renderer } = setupRenderer(canvas, scene, camera);
	renderer.setClearColor('#000000');

	// lights
	const lightsSettings = {
		isStart: false,
		intensity: 0,
		maxIntensity: 0.8,
	};

	const ambientLight = new THREE.AmbientLight('#ffffff');
	ambientLight.intensity = lightsSettings.intensity;

	const lightContainer = new THREE.Group();
	lightContainer.position.set(10, 0, 0);
	const pointLight = new THREE.PointLight('#ffffff');
	pointLight.intensity = lightsSettings.intensity;
	pointLight.shadow.mapSize.height = 2048;
	pointLight.shadow.mapSize.width = 2048;
	pointLight.position.set(7, 7, 0);
	pointLight.castShadow = true;
	lightContainer.add(pointLight);
	scene.add(lightContainer);
	scene.add(ambientLight);

	// plane
	const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
	const planeMaterial = new THREE.MeshStandardMaterial({ color: '#000000' });
	const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
	planeMesh.receiveShadow = true;
	planeMesh.rotation.x = -Math.PI / 2;
	scene.add(planeMesh);

	// car podiums
	const podiumSettings = {
		currentRotation: 0,
		rotationStep: 0.01,
		selectedRotation: 0,
		selectedIndex: 0,
		selectStep: Math.PI,
	};

	const podiumsContainer = new THREE.Group();
	podiumsContainer.position.set(0, 1, 0);
	const podiumGeometry = new THREE.CylinderGeometry(4, 4, 2, 16);
	const podiumMaterial = new THREE.MeshStandardMaterial({ color: '#006263' });
	const podiumMesh = new THREE.Mesh(podiumGeometry, podiumMaterial);
	podiumMesh.castShadow = true;
	podiumMesh.receiveShadow = true;

	const podium1Container = new THREE.Group();
	podiumsContainer.add(podium1Container);
	const podium1 = new THREE.Mesh().copy(podiumMesh);
	podium1Container.add(podium1);
	podium1.position.set(0, -1, 0);
	podium1Container.rotation.y = Math.PI * 1.1;
	podium1Container.position.set(10, 1, 0);
	const {
		carContainer: firstCar,
		wheels: firstWheels,
		update: updateFirst,
	} = setupCarGraphics({
		scene,
		type: CARS_TO_CHOOSE[0],
	});
	podium1Container.add(firstCar);

	const podium2Container = new THREE.Group();
	podiumsContainer.add(podium2Container);
	const podium2 = new THREE.Mesh().copy(podiumMesh);
	podium2Container.add(podium2);
	podium2.position.set(0, -1, 0);
	podium2Container.position.set(-10, 1, 0);
	podium2Container.rotation.y = Math.PI * 0.1;
	const {
		carContainer: secondCar,
		wheels: secondWheels,
		update: updateSecondCar,
	} = setupCarGraphics({
		scene,
		type: CARS_TO_CHOOSE[1],
	});
	podium2Container.add(secondCar);

	setTimeout(() => {
		updateFirst(JSON.parse(defaultCarSpecs));
		updateSecondCar(JSON.parse(defaultCarSpecs));
		firstWheels.forEach(wheel => {
			podium1Container.add(wheel);
		});
		secondWheels.forEach(wheel => {
			podium2Container.add(wheel);
		});
		scene.add(podiumsContainer);
		lightsSettings.isStart = true;
	}, 500);

	createText({
		text: nickname.toUpperCase(),
		color: new THREE.Color('#5b3197'),
		size: 0.8,
		callback: nicknameMesh => {
			nicknameMesh.position.set(14.5, 1, nickname.length / 3);
			nicknameMesh.rotation.y = Math.PI / 2;
			nicknameMesh.castShadow = true;
			nicknameMesh.receiveShadow = true;
			scene.add(nicknameMesh);
		},
	});

	// update things
	eventBusSubscriptions.subscribeOnTick(({ time }) => {
		const deltaTime = time - prevTime;
		lightContainer.rotation.y += deltaTime;
		prevTime = time;

		if (lightsSettings.isStart && lightsSettings.intensity < lightsSettings.maxIntensity) {
			lightsSettings.intensity += deltaTime / 2;

			ambientLight.intensity = lightsSettings.intensity;
			pointLight.intensity = lightsSettings.intensity;
		}

		if (podiumSettings.currentRotation <= podiumSettings.selectedRotation) {
			podiumSettings.currentRotation += deltaTime * 4;
		}

		if (podiumSettings.currentRotation >= podiumSettings.selectedRotation) {
			podiumSettings.currentRotation -= deltaTime * 4;
		}

		podiumsContainer.rotation.y = podiumSettings.currentRotation;
	});

	const changeCarHandler = (direction: 'prev' | 'next'): void => {
		switch (direction) {
			case 'prev':
				podiumSettings.selectedRotation += podiumSettings.selectStep;

				if (podiumSettings.selectedIndex + 1 > CARS_TO_CHOOSE.length - 1) {
					podiumSettings.selectedIndex = 0;
					break;
				}
				podiumSettings.selectedIndex += 1;
				break;
			case 'next':
				podiumSettings.selectedRotation -= podiumSettings.selectStep;

				if (podiumSettings.selectedIndex - 1 < 0) {
					podiumSettings.selectedIndex = CARS_TO_CHOOSE.length - 1;
					break;
				}
				podiumSettings.selectedIndex -= 1;
				break;
			default:
				break;
		}

		localStorage.setItem(CAR_ITEM, CARS_TO_CHOOSE[podiumSettings.selectedIndex] || Car.ELEANOR);
	};

	const keyPressHandler = (ev: KeyboardEvent): void => {
		if (ev.repeat) return;
		switch (ev.code) {
			case 'ArrowLeft':
			case 'KeyA':
				changeCarHandler('prev');
				break;
			case 'ArrowRight':
			case 'KeyD':
				changeCarHandler('next');
				break;
			default:
				break;
		}
	};

	const touchEventHandler = (ev: TouchEvent): void => {
		const isLeftHalf = ev.touches[0].clientX < window.innerWidth / 2;
		if (isLeftHalf) return changeCarHandler('prev');
		changeCarHandler('next');
	};

	window.addEventListener('keydown', keyPressHandler);
	canvas.addEventListener('touchstart', touchEventHandler);

	return {
		destroy: (): void => {
			renderer.dispose();
			scene.remove(podiumsContainer, pointLight, ambientLight, planeMesh, lightContainer);
			window.removeEventListener('keydown', keyPressHandler);
			canvas.removeEventListener('touchstart', touchEventHandler);
		},
	};
};

const StartPageUi: React.FC = () => {
	const PREV_ROOM_ID = getPrevRoomId();

	const { canvas } = useSceneIgniterContext();
	const navigate = useNavigate();
	const [stateNickname, setNickname] = React.useState<string>(NICKNAME || '');
	const refNickname = React.useRef<HTMLInputElement | null>(null);
	const refRoomId = React.useRef<HTMLInputElement | null>(null);

	React.useEffect(() => {
		if (!canvas) return;

		const { destroy } = setupStartScene(stateNickname || 'Где ник?', canvas);
		return () => {
			destroy();
			eventBusUnsubscribe.unsubscribe(['ON_NOTIFICATION']);
		};
	}, [canvas, stateNickname]);

	const goToRoom = React.useCallback(
		(room: string): void => {
			if (!localStorage.getItem(NICKNAME_ITEM))
				return eventBusTriggers.triggerNotifications({
					id: uuid(),
					text: 'Сначала придумайте себе никнейм',
				});
			navigate(`/room/${room}`);
		},
		[navigate]
	);

	const saveNicknameHandler = React.useCallback((): void => {
		const nicknameValue = (refNickname.current?.value || '').trim();
		if (!nicknameValue.length)
			return eventBusTriggers.triggerNotifications({
				id: uuid(),
				text: 'Не валидный никнейм',
			});

		setNickname(nicknameValue);
		localStorage.setItem(NICKNAME_ITEM, nicknameValue);
	}, []);

	const changeNicknameHandler = React.useCallback((): void => {
		setNickname('');
		localStorage.setItem(NICKNAME_ITEM, '');
	}, []);

	const backToRoomHandler = React.useCallback((): void => {
		if (!PREV_ROOM_ID)
			return eventBusTriggers.triggerNotifications({
				id: uuid(),
				text: 'А ты еще не играл',
			});

		goToRoom(PREV_ROOM_ID);
	}, [PREV_ROOM_ID, goToRoom]);

	const copyRoomHandler = React.useCallback((): void => {
		navigator.clipboard
			.writeText(CREATE_ROOM_ID)
			.then(() => {
				eventBusTriggers.triggerNotifications({
					id: uuid(),
					text: 'Я знаю что у тебя нет друзей, но номер комнаты скопирован',
				});
			})
			.catch(() => {
				eventBusTriggers.triggerNotifications({
					id: uuid(),
					text: 'Видимо браузер у тебя говнище',
				});
			});
	}, []);

	const goToGameHandler = React.useCallback((): void => {
		const roomIdValue = (refRoomId.current?.value || '').trim();
		if (roomIdValue?.length !== CREATE_ROOM_ID.length)
			return eventBusTriggers.triggerNotifications({
				id: uuid(),
				text: 'Не валидный номер комнаты',
			});

		goToRoom(roomIdValue);
	}, [goToRoom]);

	const createGameHandler = React.useCallback(() => goToRoom(CREATE_ROOM_ID), [goToRoom]);

	return (
		<StyledStartWrapper>
			<StyledStartPageWrapper>
				<StyledChooseItem>
					<input ref={refRoomId} type='text' placeholder='Номер комнаты' />
					<button type='button' onClick={goToGameHandler}>
						подключиться
					</button>
				</StyledChooseItem>
				<StyledChooseItem>
					{!stateNickname && (
						<>
							<h1>Никнейм</h1>
							<input ref={refNickname} type='text' />
							<button type='button' onClick={saveNicknameHandler}>
								Сохранить
							</button>
						</>
					)}
					{!!stateNickname && (
						<>
							<h1>Йооо {stateNickname}</h1>
							<button type='button' onClick={changeNicknameHandler}>
								Изменить
							</button>
						</>
					)}
				</StyledChooseItem>
				<StyledChooseItem>
					<button type='button' onClick={copyRoomHandler}>
						код для друга
					</button>
					<button type='button' onClick={createGameHandler}>
						cоздать комнату
					</button>
					<button type='button' onClick={backToRoomHandler}>
						предыдущая комната
					</button>
				</StyledChooseItem>
			</StyledStartPageWrapper>
		</StyledStartWrapper>
	);
};

const StartPage: React.FC = () => (
	<SceneIgniterContextProvider>
		<StartPageUi />
	</SceneIgniterContextProvider>
);

export default StartPage;
