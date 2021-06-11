import React from "react";
import GridSquare from "./GridSquare.js";

class Minefield extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			started: false,
			buttonsClicked: [],
			kMine: 9,
			kFlag: 10,
			kQuestion: 11,
			btnClassIdPrefix: "btn"
		};
	}
	getSnapshotBeforeUpdate(prevProps) {
		if(this.props.uniqueId !== prevProps.uniqueId) {
			this.resetGame();
		}
		return null;
	}
	shouldComponentUpdate() {
		return true;
	}
	render() {
		const final = this.buildUI();
		return final;
	}
	componentDidUpdate(prevProps) {
		// Reveal last clicked button with adjacent buttons if its a 0
		const revealRecursive = (idx,exclude = []) => {
			if(this.state.hiddenArray[idx] === 0) {
				var adjs = this.getAdjSquares(idx);
				exclude.push(idx);
				adjs = adjs.filter(x => {return !exclude.includes(x);});
				adjs.map(x => {return revealRecursive(x,exclude);});
			}
			const allButtonRefs = this.getAllButtonRefs();
			if(idx < allButtonRefs.length) {
				allButtonRefs[idx].reveal(this.state.hiddenArray[idx]);
			}
			return null;
		};
		const lastClicked = this.state.buttonsClicked[this.state.buttonsClicked.length - 1];
		revealRecursive(lastClicked);
		return null;
	}
	// Set method to get all child refs that are buttons
	getAllButtonRefs = () => {
		const final = Object.keys(this.refs).filter(
			x => {return x.match("^" + this.state.btnClassIdPrefix);}
		).map(x => {return this.refs[x];});
		return final;
	};
	// Set method to build UI
	buildUI = () => {
		// Get grid array length
		const gridLen = this.props.size[0] * this.props.size[1];
		// Open and populate array for grid buttons
		var mineButtons = [];
		for(var i = 0; i < gridLen; i++) {
			const buttonIdx = i;
			const btnId = this.state.btnClassIdPrefix + buttonIdx;
			mineButtons.push(
				<GridSquare
					key={i}
					ref={btnId}
					btnId={btnId}
					idx={buttonIdx}
					clickHandler={() => this.processSquareClick(buttonIdx)}
					unclickedText={""}
				/>
			);
		}
		// Set mine buttons into div
		var final = <div
			id="mines"
			style={{
				display: "grid",
				gridTemplateRows: "repeat(" + this.props.size[0] + ", " + this.props.buttonWidthFull + ")",
				gridTemplateColumns: "repeat(" + this.props.size[1] + ", " + this.props.buttonWidthFull + ")"
			}}
		>
			{mineButtons}
		</div>;
		// Return
		return final;
	};
	resetGame = () => {
		// Check whether cell reset is necessary
		const allButtonRefs = this.getAllButtonRefs();
		const gridReady = allButtonRefs.map(x => {return x.state.clicked;}).indexOf(true) === -1;
		// Perform cell reset if necessary
		if(!gridReady) {
			// Reset individual buttons
			allButtonRefs.map(x => {return x.cover();});
		}
		// Reset game state parameters
		this.setState({
			started: false,
			hiddenArray: [],
			buttonsClicked: []
		});
	};
	processSquareClick = (idx) => {
		if(!this.state.started) {
			this.setState({started: true});
			this.getHiddenGrid(idx);
		}
		var newListButtonsClicked = this.state.buttonsClicked;
		newListButtonsClicked.push(idx);
		this.setState({buttonsClicked: newListButtonsClicked});
	};
	// Set method to build grid
	getHiddenGrid = (idxFirstClicked) => {
		// Get grid array length
		const gridLen = this.props.size[0] * this.props.size[1];
		// Get options for mine placement
		var minePlacementOpts = Array.from(Array(gridLen).keys()).filter(x => {return x !== idxFirstClicked;});
		// Sample placement options
		var placements = [];
		for(var i = 0; i < this.props.nMines; i++) {
			const nextMine = minePlacementOpts[
				Math.floor(Math.random() * minePlacementOpts.length)
			];
			minePlacementOpts = minePlacementOpts.filter(x => {return x !== nextMine;});
			placements.push(nextMine);
		}
		placements = placements.sort((a,b) => {return a - b;});
		// Open array representing hidden grid
		var arrHidden = Array(gridLen);
		// Add mines to hidden array
		for(i = 0; i < placements.length; i++) {
			arrHidden[placements[i]] = this.state.kMine;
		}
		// Add counts to non-mine fields in hidden array
		for(i = 0; i < arrHidden.length; i++) {
			if(typeof arrHidden[i] === "undefined") {
				const adjs = this.getAdjSquares(i);
				const adjVals = adjs.map(x => {return arrHidden[x];});
				const ctMines = adjVals.filter(x => {return x === this.state.kMine;}).length;
				arrHidden[i] = ctMines;
			}
		}
		// Frame hidden array
		this.setState({hiddenArray: arrHidden});
	};
	// Set method to get adjacent mines from index
	getAdjSquares = (idxRaw) => {
		// Open array for adjacent squares
		var final = [];
		// Convert to a 1 basis for simplicity
		const idx = idxRaw + 1;
		// Check edge orientation
		const isUpper = idx <= this.props.size[1];
		const isRight = idx % this.props.size[1] === 0;
		const isLower = idx > (this.props.size[0] - 1) * this.props.size[1];
		const isLeftt = idx % this.props.size[1] === 1;
		// Get upper left
		if(!isUpper && !isLeftt) {
			final.push(idx - this.props.size[1] - 1);
		}
		// Get upper
		if(!isUpper) {
			final.push(idx - this.props.size[1]);
		}
		// Get upper right
		if(!isUpper && !isRight) {
			final.push(idx - this.props.size[1] + 1);
		}
		// Get left
		if(!isLeftt) {
			final.push(idx - 1);
		}
		// Get right
		if(!isRight) {
			final.push(idx + 1);
		}
		// Get lower left
		if(!isLower && !isLeftt) {
			final.push(idx + this.props.size[1] - 1);
		}
		// Get lower
		if(!isLower) {
			final.push(idx + this.props.size[1]);
		}
		// Get lower right
		if(!isLower && !isRight) {
			final.push(idx + this.props.size[1] + 1);
		}
		// Convert back to 0 basis
		final = final.map(x => {return x - 1;});
		// Return
		return final;
	};
}

export default Minefield;
