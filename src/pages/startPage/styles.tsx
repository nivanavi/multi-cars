import styled from 'styled-components';

export const StyledStartWrapper = styled.div`
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

	select {
		background: unset;
		color: white;
		border-top: unset;
		border-left: unset;
		border-right: unset;
		padding: 10px;
		border-bottom: 2px solid #5b3197;
	}

	select option {
		outline: none;
		background: black;
		color: white;
		border: unset;
		padding: 10px;
	}

	@media (max-width: 1024px) {
		font-size: 12px;

		button {
			padding: 5px 15px;
			font-size: 12px;
			margin: 10px 0 10px 0;
		}

		input {
			font-size: 12px;
			padding: 5px;
			margin: 15px 0 15px 0;
		}
	}
`;

export const StyledStartPageWrapper = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	padding: 0 20px 0 20px;

	@media (max-width: 1024px) {
		display: unset;
		right: unset;
	}
`;
export const StyledChooseItem = styled.div`
	font-family: JetBrains Mono, sans-serif;
	display: flex;
	align-items: center;
	justify-content: center;
	button {
		margin-right: 20px;
		width: fit-content;
	}
	h1 {
		margin-right: 20px;
	}
	input {
		margin-right: 20px;
	}

	@media (max-width: 1024px) {
		justify-content: flex-start;
	}
`;
