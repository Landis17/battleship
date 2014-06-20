'use strict';
/**
 * Game constructor
 * @param {jQuery obj} humanContainer
 * @param {jQuery obj} botContainer
 * @param {jQuery obj} gameStatusContainer
 * @param {Number} arenaWidth
 * @param {Number} arenaHeight
 */
BattleShip.Game = function( humanContainer, botContainer, gameStatusContainer, arenaWidth, arenaHeight ) {

    this.humanContainer = humanContainer;
    this.botContainer = botContainer;
    this.gameStatusContainer = gameStatusContainer;
    this.fieldWidth = arenaWidth;
    this.fieldHeight = arenaHeight;

    /**
     * Human field
     * @type {BattleShip.Field}
     */
    this.humanField;

    /**
     * Bot field
     * @type {BattleShip.Field}
     */
    this.botField;

    /**
     * Shoting position for bot
     * @type {Array}
     */
    this.botShootingPositions = [];

}

/**
 * Game methods
 */
BattleShip.Game.prototype = {

    /**
     * Start
     */
    start: function() {
        this.initHumanField();
        this.initBotField();
        this.initBotShootingPositions();
        $(this.gameStatusContainer).text("User turn");
    },


    /**
     * Init shoting position for bot
     */
    initBotShootingPositions: function() {
        for ( var i = 0; i < this.fieldWidth; i++ ) {
            for ( var j = 0; j < this.fieldHeight; j++ ) {
                this.botShootingPositions.push( new BattleShip.Position( i, j ) );
            }
        }
        shuffleArray( this.botShootingPositions );

        // http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
        function shuffleArray(o) { 
            for( var j, x, i = o.length; i; j = Math.floor( Math.random() * i ), x = o[--i], o[i] = o[j], o[j] = x );
            return o;
        }
    },

    /**
     * Init bot field
     */
    initBotField: function() {

        var table = this.createTable( this.botContainer )
          , self = this;

        var onShotMissedHandler = function(pos) {
            $(self.gameStatusContainer).text("Bot turn");
            table.find('tr').eq(pos.y).find('td').eq(pos.x).addClass('fired_cell');
            self.botRandomAttack();
        }

        var onShipDamagedHandler = function(pos) {
            self.markShipDamaged( table, pos );
        }

        var onShipDiedHandler = function(shipPositions) {
            self.markShipDied( table, shipPositions );
            self.markAroundShipDied( table, shipPositions );
        }

        var onBotLostHandler = function() {
            $(self.gameStatusContainer).text('Game over');
            alert( "You win! Repeat that." );
            location.reload();
        };

        this.botField = new BattleShip.Field (
              onShotMissedHandler
            , onShipDamagedHandler
            , onShipDiedHandler
            , onBotLostHandler
            , this.fieldHeight
            , this.fieldWidth );

        table.on('click', 'td', function() {
            var xCoordinate = this.cellIndex;
            var yCoordinate = this.parentNode.rowIndex;
            self.botField.makeShot( new BattleShip.Position( xCoordinate, yCoordinate ) );
        });
    },

    /**
     * Init human field
     */
    initHumanField: function() {

        var table = this.createTable( this.humanContainer )
          , self = this;

        var onShotMissedHandler = function(pos) {
            $(self.gameStatusContainer).text("User turn");
            table.find('tr').eq(pos.y).find('td').eq(pos.x).addClass('fired_cell');
        }

        var onShipDamagedHandler = function(pos) {
            self.markShipDamaged( table, pos );
            self.botAroundAttack( pos );
        }

        var onShipDiedHandler = function(shipPositions) {
            self.markShipDied( table, shipPositions );
            self.markAroundShipDied( table, shipPositions );
            self.botRandomAttack();
        }

        var onHumanLostHandler = function() {
            $(self.gameStatusContainer).text('Game over');
            alert( "You lose. Repeat that." );
            location.reload();
        };

        this.humanField = new BattleShip.Field (
              onShotMissedHandler
            , onShipDamagedHandler
            , onShipDiedHandler
            , onHumanLostHandler
            , this.fieldHeight
            , this.fieldWidth );

        // show ships on human field
        for ( var i = 0; i < this.humanField.ships.length; i++ ) {
            var shipPositions = this.humanField.ships[i].getPositions();
            for ( var j = 0; j < shipPositions.length; j++ ) {
                var pos = shipPositions[j];
                table.find('tr').eq(pos.y).find('td').eq(pos.x).addClass('live_ship');
            }
        }
    },

    /**
     * Create game table
     * @param {jQuery obj} container for game field
     * @returns {jQuery obj} game table
     */
    createTable: function(container) {
        var table = $('<table></table>').addClass('field');

        for( var i = 0; i < this.fieldWidth; i++ ) {
            var tr = $('<tr></tr>').appendTo(table);
            for ( var j = 0; j < this.fieldHeight; j++ ) {
                $('<td></td>').appendTo(tr);
            }
        }
       $(container).append(table);

       return table;
    },


    /**
     * Bot random attack
     * Set timeout for thinking
     */
    botRandomAttack: function() {
        var self = this;

        setTimeout(function () {
            var shotPos = self.botShootingPositions.pop();
            self.humanField.makeShot(shotPos);
        }, 1000);

    },

    /**
     * Bot 'smart' attack
     * Shot arround cells
     * @param {BattleShip.Positions} pos fired cell
     */
    botAroundAttack: function(pos) {
        var self = this
          , botArroundPositions = []
          , isOdd = function(num) { return num % 2 };

        // select arround cells
        for ( var x = pos.x - 1; x <= pos.x + 1; x++ ) {
            for ( var y = pos.y - 1; y <= pos.y + 1; y++ ) {
                if ( x >= 0 && y >= 0 ) {
                    var cell = this.humanField.getCellByPosition( { x: x, y: y } );
                    if ( cell ) {
                        botArroundPositions.push( cell );
                    }
                }
            }
        }

        /**
         * select cross possitioned cells from arounded cells
         * and replace these in botShootingPositions array
         */ 
        for ( var i = 0, iLen = botArroundPositions.length; i < iLen; i++ ) {
            var arroundItem = botArroundPositions[i];
            if ( isOdd( i ) && !arroundItem.isFired ) {
                for ( var j = 0, jLen = self.botShootingPositions.length; j < jLen; j++ ) {
                    var randomItem = self.botShootingPositions[j];
                    if ( randomItem.x == arroundItem.pos.x && randomItem.y == arroundItem.pos.y ) {

                        this.botShootingPositions.splice( this.botShootingPositions.indexOf( randomItem ), 1 );

                        this.botShootingPositions.push( arroundItem.pos );
                    }
                }
            }
        }

        setTimeout(function () {
            var shotPos = self.botShootingPositions.pop();
            self.humanField.makeShot( shotPos );        
        }, 1000);

    },

    /**
     * Color damaged cell
     * @param {jQuery obj} table
     * @param {BattleShip.Position} pos cell position
     */
    markShipDamaged: function(table, pos) {
        table.find('tr').eq(pos.y).find('td').eq(pos.x).removeClass('fired_cell').addClass('damaged_ship');
    },

    /**
     * Color died cell
     * @param {jQuery obj} table
     * @param {BattleShip.Position} shipPositions
     */
    markShipDied: function(table, shipPositions) {
        for ( var i = 0; i < shipPositions.length; i++ ) {
            table.find('tr').eq(shipPositions[i].y).find('td').eq(shipPositions[i].x).removeClass('fired_cell').addClass('died_ship');
        }
    },

    /**
     * Color arround cells from damaged cell
     * @param {jQuery obj} table
     * @param {BattleShip.Position} shipPositions
     */
    markAroundShipDied: function(table, shipPositions) {
        for ( var i = 0; i < shipPositions.length; i++ ) {
            for ( var x = shipPositions[i].x - 1; x <= shipPositions[i].x + 1; x++ ) {
                for ( var y = shipPositions[i].y - 1; y <= shipPositions[i].y + 1; y++ ) {
                    if ( x >= 0 && y >= 0 ) {
                        table.find('tr').eq(y).find('td').eq(x).addClass('fired_cell');
                    }
                }
            }
        }
    }
}
