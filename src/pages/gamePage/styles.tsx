import styled from 'styled-components';

export const StyledGamePageWrapper = styled.div`
	button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 70px;
		height: 70px;
		border-radius: 50%;
		background: unset;

		border: 2px solid black;
		color: black;
	}

	button > svg {
		pointer-events: none;
	}

	.backNavigate {
		position: fixed;
		width: 50px;
		height: 50px;
		top: 10px;
		left: 10px;
	}

	.respawnButton {
		position: fixed;
		right: 10px;
		top: 10px;
	}

	.aimPoint {
		position: fixed;
		width: 6px;
		height: 6px;
		top: calc(50% - 3px);
		left: calc(50% - 3px);
		background: white;
		border: 2px solid black;
		opacity: 0.5;
	}
`;

export const StyledPersonInfo = styled.div`
	font-family: JetBrains Mono, sans-serif;
	color: black;
	font-size: 25px;
	display: flex;
	align-items: center;
	flex-direction: column;
	width: 200px;
	position: fixed;
	bottom: 20px;
	left: calc(50% - 100px);
`;

export const StyledHPBar = styled.div<{ hp: number }>`
	position: relative;
	width: 200px;
	box-sizing: border-box;
	border: 1px solid black;
	text-align: center;
	padding: 5px 0;
	margin-top: 20px;

	::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: ${({ hp }): number => hp}%;
		height: 100%;
		opacity: 0.3;
		background: red;
	}
`;

export const StyledCarControlsWrapper = styled.div`
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	display: grid;
	grid-template-columns: 1fr 1fr;
	padding: 10px;
`;
export const StyledCarSteering = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-start;

	button:first-child {
		margin-right: 10px;
	}
`;
export const StyledCarAcceleration = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	button {
		margin-top: 10px;
	}
`;

export const StyledCarAccelerationForward = styled.div`
	display: flex;
	align-items: center;
	button:first-child {
		margin-right: 10px;
	}
`;
