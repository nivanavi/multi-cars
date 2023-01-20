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
		//border: 2px solid #5b3197;
		//color: #5b3197;

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
