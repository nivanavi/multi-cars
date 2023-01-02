import styled from 'styled-components';

export const StyledStartWrapper = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;

	font-size: 18px;
	color: white;
	button {
		background: unset;
		padding: 10px 30px;
		font-size: 18px;
		color: white;
		border: 2px solid #5b3197;
		margin: 30px 0 30px 0;
	}

	input {
		background: unset;
		color: white;
		font-size: 18px;
		border-top: unset;
		border-left: unset;
		border-right: unset;
		border-bottom: 2px solid #5b3197;
		padding: 10px;
		margin: 30px 0 30px 0;
	}
`;

export const StyledStartPageWrapper = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	column-gap: 30px;
`;
export const StyledChooseItem = styled.div`
	font-family: JetBrains Mono, sans-serif;
	display: flex;
	justify-content: center;
	align-items: center;
	button {
		margin-left: 20px;
		width: fit-content;
	}
	input {
		margin-left: 20px;
	}
`;

export const StyledNicknameWrapper = styled.div`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-family: JetBrains Mono, sans-serif;
	input {
		margin-left: 20px;
	}
	button {
		margin-left: 20px;
		width: fit-content;
	}
`;
