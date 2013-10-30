'use strict';
/**
 * Ship constructor
 */
BattleShip.Ship = function() {
    this.cellWidgets = [];
}

/**
 * Ship methods
 */
BattleShip.Ship.prototype = {

    /**
     * isDead
     * @returns {Boolean} is ship dead?
     */
    isDead: function() {
        var isDead = true;
        for ( var i =0; i < this.cellWidgets.length; i++ ) {
            if ( !this.cellWidgets[i].isFired ) {
                isDead = false;
                break;
            }
        }
        return isDead;
    },

    /**
     * Get ship positions
     * @return {BattleShip.Position}
     */
    getPositions: function() {
        var result = [];
        for ( var i = 0; i < this.cellWidgets.length; i++ ) {
            result.push( this.cellWidgets[i].pos );
        }
        return result;
    }
}


/**
 * Field constructor
 * @param {Object} onShipDamaged
 * @param {Object} onSheepDied
 * @param {Object} playerLost
 * @param {Number} fieldHeight
 * @param {Number} fieldWidth
 */
BattleShip.Field = function(onShotMissed, onShipDamaged, onSheepDied, playerLost, fieldHeight, fieldWidth) {

    this.fieldHeight =  fieldHeight || 10;
    this.fieldWidth = fieldWidth || 10;

    this.onShotMissed = onShotMissed;
    this.onShipDamaged = onShipDamaged;
    this.onSheepDied = onSheepDied;
    this.playerLost = playerLost;

    /**
     * ships
     * @type {Array}
     */
    this.ships = [];

    /**
     * Field cells
     * @type {Array}
     */
    this.cellWidgets = [];

    this.initCells()

    this.initShips();
}

BattleShip.Field.prototype = {

    /**
     * Init field cells
     */
    initCells: function() {
        for ( var i = 0; i < this.fieldWidth; i++ ) {
            for ( var j = 0; j < this.fieldHeight; j++ ) {
                var pos = new BattleShip.Position( i, j );
                var cell = new BattleShip.Cell( pos, null );
                this.cellWidgets.push( cell );
            }
        }
    },

    /**
     * Init place ships
     */
    initShips: function() {
        this.arrangeShips( BattleShip.ShipsInfo.FOUR_DECKER.COUNT, BattleShip.ShipsInfo.FOUR_DECKER.LENGTH );
        this.arrangeShips( BattleShip.ShipsInfo.THREE_DECKER.COUNT, BattleShip.ShipsInfo.THREE_DECKER.LENGTH );
        this.arrangeShips( BattleShip.ShipsInfo.TWO_DECKER.COUNT, BattleShip.ShipsInfo.TWO_DECKER.LENGTH );
        this.arrangeShips( BattleShip.ShipsInfo.SINGLE_DECKER.COUNT, BattleShip.ShipsInfo.SINGLE_DECKER.LENGTH );
    },

    /**
     * Place one count ships
     * @param {Number} shipsCount ships count
     * @param {Number} shipLength ships size
     */
    arrangeShips: function(shipsCount, shipLength) {
        for ( var i = 0; i < shipsCount; i++ ) {
            this.arrangeShip( shipLength );
        }
    },

    /**
     * Place one ship
     * @param {Number} shipLength
     */
    arrangeShip: function(shipLength) {

        var shipIsPlaced = false;

        while ( !shipIsPlaced ) {
            var isVertical = Math.random() > 0.5 ? true : false;

            var xCoordinate = randomNumber( this.fieldWidth );
            var yCoordinate = randomNumber( this.fieldHeight );

            // get coords in game field
            if ( isVertical ) {
                while( yCoordinate + shipLength >= this.fieldHeight ) {
                    yCoordinate = randomNumber(this.fieldHeight);
                }
            } else { //horizontal
                while( xCoordinate + shipLength >= this.fieldWidth ) {
                    xCoordinate = randomNumber(this.fieldWidth);
                }
            }

            // check range space
            var isOtherShipsInArea = this.isShipsPlacedAround( xCoordinate, yCoordinate, isVertical, shipLength );

            if ( !isOtherShipsInArea ) {
                var shipPositions = [];

                if ( isVertical ) {
                    for ( var i = yCoordinate; i < ( yCoordinate + shipLength ); i++ ) {
                        shipPositions.push( new BattleShip.Position( xCoordinate, i ) );
                    }
                } else { // horizontal
                    for ( var i = xCoordinate; i < ( xCoordinate + shipLength ); i++ ) {
                        shipPositions.push( new BattleShip.Position( i, yCoordinate ) );
                    }
                }

                // create ships and push cells in it
                var ship = new BattleShip.Ship();

                for ( var i = 0; i < shipPositions.length; i++ ) {
                    var shipCell = this.getCellByPosition( shipPositions[i] );
                    ship.cellWidgets.push( shipCell );
                    shipCell.ship = ship;
                }
                this.ships.push( ship );
                shipIsPlaced = true;
            }
        }

        /**
         * Get random number from 0 to range
         * @param {Number} range 
         * @returns {Number}
         */
        function randomNumber(range) {
            return Math.floor( Math.random() * (range - 1) );
        }
    },

    /**
     * Check ships in arround space
     * @param {Number} xCoordinate first cell of ship
     * @param {Number} yCoordinate first cell of ship
     * @param {Boolean} isVertical
     * @param {Number} shipLength ship size
     * @returns {Boolean}
     */
    isShipsPlacedAround: function(xCoordinate, yCoordinate, isVertical, shipLength) {
        var topLeftPos = new BattleShip.Position( xCoordinate - 1, yCoordinate - 1 );

        var bottomRightPos = null;
        if ( isVertical ) {
            bottomRightPos = new BattleShip.Position( xCoordinate + 1, yCoordinate + shipLength );
        } else {
            bottomRightPos = new BattleShip.Position( xCoordinate + shipLength, yCoordinate + 1 );
        }

        var isShipExistInArea = false;

        for ( var i = topLeftPos.x; i <= bottomRightPos.x; i++ ) {
            for ( var j = topLeftPos.y; j <= bottomRightPos.y; j++ ) {
                var cell = this.getCellByPosition( new BattleShip.Position(i, j) );
                if ( cell && cell.ship ) {
                    isShipExistInArea = true;
                    break;
                }
            }
        }
        return isShipExistInArea;
    },


    /**
     * Make shot and call callback
     * @param {Array} shotPosition
     */
    makeShot: function(shotPosition) {
        var cell = this.getCellByPosition( shotPosition );
        // if not fired
        if ( !cell.isFired ) {
            // set cell fired
            this.setCellFired( shotPosition );

            var shotStatus = this.getShotStatus(shotPosition);
            if ( shotStatus ) {
                switch ( shotStatus ) {
                    case BattleShip.ShotStatus.DAMAGED:
                        this.onShipDamaged( shotPosition );
                        break;

                    case BattleShip.ShotStatus.KILLED:
                        var ship = this.getShipByPosition( shotPosition );
                        this.onSheepDied( ship.getPositions() );
                        this.setAroundCellsFired( ship.getPositions() );

                        if ( this.playerHasLost() ) {
                            this.playerLost();
                        }
                        break;

                    case BattleShip.ShotStatus.MISSED:
                        this.onShotMissed( shotPosition );
                        break;
                }
            }
        }
    },

    /**
     * Get shot status
     * @param {Array} shotPosition
     * @returns {Null}
     */
    getShotStatus: function(shotPosition) {
        var result = null
          , ship = this.getShipByPosition( shotPosition );

        // is ship in this position?
        if ( ship ) {
            if ( ship.isDead() ) {
                result = BattleShip.ShotStatus.KILLED;
            } else {
                result = BattleShip.ShotStatus.DAMAGED;
            }
        } else {
            result =  BattleShip.ShotStatus.MISSED;
        }
        return result;
    },

    /**
     * Is player lost?
     * @returns {boolean}
     */
    playerHasLost: function() {
        var hasLost = true;

        for ( var i=0; i < this.ships.length; i++ ) {
            if ( !this.ships[i].isDead() ) {
                hasLost = false;
                break;
            }
        }
        return hasLost;
    },

    /**
     * Set cell fired
     * @param {BattleShip.Position} cell position
     */
    setCellFired: function(pos) {
        var cell = this.getCellByPosition( pos );
        if ( cell ) {
            cell.isFired = true;
        }
    },

    /**
     * Set arround cells fired
     * @param {Array} shipPositions ship cells
     */
    setAroundCellsFired: function(shipPositions) {
        for ( var i = 0; i < shipPositions.length; i++ ) {
            for ( var x = shipPositions[i].x - 1; x <= shipPositions[i].x + 1; x++ ) {
                for ( var y = shipPositions[i].y - 1; y <= shipPositions[i].y + 1; y++ ) {
                    var cell = this.getCellByPosition( { x: x, y: y } );
                    if ( cell ) {
                        cell.isFired = true;
                    }
                }       
            }
        }
    },

    /**
     * Get ship by position
     * @param {BattleShip.Position}
     * @returns {BattleShip.Ship}
     */
    getShipByPosition: function(pos) {
        var cell = this.getCellByPosition( pos );
        return cell.ship;
    },

    /**
     * Get cell by position
     * @param {BattleShip.Position}
     * @returns {BattleShip.Cell}
     */
    getCellByPosition: function(pos) {
        var result = null;

        for ( var i = 0; i < this.cellWidgets.length; i++ ) {
            var cell = this.cellWidgets[i];
            if ( cell.pos.x == pos.x && cell.pos.y == pos.y ) {
                result = cell;
                break;
            }
        }
        return result;
    }
}
