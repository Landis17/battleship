'use strict';
/**
 * Объект игры Морской бой
 * @param {jQuery obj} humanContainer Контейнер для отображения поля человека
 * @param {jQuery obj} botContainer Контейнер для отображения поля компьютера
 * @param {jQuery obj} gameStatusContainer Контейнер для отображения статуса игры
 * @param {Number} arenaWidth ширина поля
 * @param {Number} arenaHeight высота поля
 */
BattleShip.Game = function( humanContainer, botContainer, gameStatusContainer, arenaWidth, arenaHeight ) {

    this.humanContainer = humanContainer;
    this.botContainer = botContainer;
    this.gameStatusContainer = gameStatusContainer;
    this.fieldWidth = arenaWidth;
    this.fieldHeight = arenaHeight;

    /**
     * Поле человека
     * @type {BattleShip.Field}
     */
    this.humanField;

    /**
     * Поле компьютера
     * @type {BattleShip.Field}
     */
    this.botField;

    /**
     * Позиции на поле по которым стреляем компьютер
     * @type {Array}
     */
    this.botShootingPositions = [];

}

/**
 * Методы для объекта игры
 */
BattleShip.Game.prototype = {

    /**
     * Старт
     */
    start: function() {
        this.initHumanField();
        this.initBotField();
        this.initBotShootingPositions();
        $(this.gameStatusContainer).text("Ваш ход");
    },


    /**
     * Инициализация массива позиций по которым будет стрелять компьютер
     */
    initBotShootingPositions: function() {
        for ( var i = 0; i < this.fieldWidth; i++ ) {
            for ( var j = 0; j < this.fieldHeight; j++ ) {
                this.botShootingPositions.push( new BattleShip.Position( i, j ) );
            }
        }
        shuffleArray( this.botShootingPositions ) ;

        // http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
        function shuffleArray(o) { 
            for( var j, x, i = o.length; i; j = Math.floor( Math.random() * i ), x = o[--i], o[i] = o[j], o[j] = x );
            return o;
        }
    },

    /**
     * Инициализация поля компьютера
     */
    initBotField: function() {

        var table = this.createTable( this.botContainer )
          , self = this;

        var onShotMissedHandler = function(pos) {
            $(self.gameStatusContainer).text("Ход противника");
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
            $(self.gameStatusContainer).text('Игра окончена. Вы победили');
            alert( "Вы победили. Игра начнется заново. " );
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
     * Инициализация поля человека
     */
    initHumanField: function() {

        var table = this.createTable( this.humanContainer )
          , self = this;

        var onShotMissedHandler = function(pos) {
            $(self.gameStatusContainer).text("Ваш ход");
            table.find('tr').eq(pos.y).find('td').eq(pos.x).addClass('fired_cell');
        }

        var onShipDamagedHandler = function(pos) {
            self.markShipDamaged( table, pos );
            // self.botAroundAttack( pos );
            self.botRandomAttack();
        }

        var onShipDiedHandler = function(shipPositions) {
            self.markShipDied( table, shipPositions );
            self.markAroundShipDied( table, shipPositions );
            self.botRandomAttack();
        }

        var onHumanLostHandler = function() {
            $(self.gameStatusContainer).text('Игра окончена. Вы проиграли.');
            alert( "Вы проиграли. Игра начнется заново." );
            location.reload();
        };

        this.humanField = new BattleShip.Field (
              onShotMissedHandler
            , onShipDamagedHandler
            , onShipDiedHandler
            , onHumanLostHandler
            , this.fieldHeight
            , this.fieldWidth );

        // отображаем все корабли человека
        for ( var i = 0; i < this.humanField.ships.length; i++ ) {
            var shipPositions = this.humanField.ships[i].getPositions();
            for ( var j = 0; j < shipPositions.length; j++ ) {
                var pos = shipPositions[j];
                table.find('tr').eq(pos.y).find('td').eq(pos.x).addClass('live_ship');
            }
        }
    },

    /**
     * Инициализация поля игры
     * @param {jQuery obj} container родительский контейнер
     * @returns {jQuery obj} table поле игры
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
     * Атака компьютера
     * Происходит по таймауту для создания иллюзии обдумывания
     * Если корабль подбит, бьет соседние ячейки
     * @param {BattleShip.Positions} pos подбитая ячейка
     */
    botRandomAttack: function() {
        var self = this;

        setTimeout(function () {
            var shotPos = self.botShootingPositions.pop();
            self.humanField.makeShot(shotPos);
        }, 1000);

    },

    /**
     * Атака компьютера
     * Происходит по таймауту для создания иллюзии обдумывания
     * Если корабль подбит, бьет соседние ячейки
     * @param {BattleShip.Positions} pos подбитая ячейка
     */
    botAroundAttack: function(pos) {
        var self = this
          , botArroundPositions = []
          , isOdd = function(num) { return num % 2 };

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

        for ( var i = 0, iLen = botArroundPositions.length; i < iLen; i++ ) {
            var iItem = botArroundPositions[i];
            if ( isOdd( i ) && !iItem.isFired ) {
                for ( var j = 0, jLen = self.botShootingPositions.length; j < jLen; j++ ) {
                    var jItem = self.botShootingPositions[j];
                    if ( jItem.x == iItem.pos.x && jItem.y == iItem.pos.y ) {
                        console.log(pos, 'pos');
                        console.log(botArroundPositions, 'botArroundPositions');
                        console.log(iItem.pos, 'iItem');
                        console.log(jItem, 'jItem');
                        console.log('**************');
                    }
                }
            }
        }
        
        // console.log(pos, 'pos');
        // console.log(botArroundPositions, 'arround');
        // console.log(this.botShootingPositions.length, 'shooting');

        // setTimeout(function () {
        //     var shotPos = botArroundPositions.pop();

        //     self.botShootingPositions.splice( self.botShootingPositions.indexOf( shotPos ), 1 );
        //     self.humanField.makeShot( shotPos.pos );

        //     console.log(pos, 'pos');
        //     console.log(shotPos, 'shotPos');
        //     console.log(self.botShootingPositions.length, 'shooting');            
        // }, 1000);

    },

    /**
     * Закрашивает клетку раненого корабля
     * @param {jQuery obj} table
     * @param {BattleShip.Position} pos позиция клетки
     */
    markShipDamaged: function(table, pos) {
        table.find('tr').eq(pos.y).find('td').eq(pos.x).removeClass('fired_cell').addClass('damaged_ship');
    },

    /**
     * Закрашивает клетки потопленного корабля
     * @param {jQuery obj} table элемент таблицы
     * @param {BattleShip.Position} shipPositions позиции на которых был установлен корабль
     */
    markShipDied: function(table, shipPositions) {
        for ( var i = 0; i < shipPositions.length; i++ ) {
            table.find('tr').eq(shipPositions[i].y).find('td').eq(shipPositions[i].x).removeClass('fired_cell').addClass('died_ship');
        }
    },

    /**
     * Закрашивает клетки вокруг потопленного корабля
     * @param {jQuery obj} table элемент таблицы
     * @param {BattleShip.Position} shipPositions позиции на которых был установлен корабль
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
