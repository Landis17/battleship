'use strict';
/**
 * Объект корабля
 */
BattleShip.Ship = function() {
    this.cellWidgets = [];
}

/**
 * Методы объекта корябля
 */
BattleShip.Ship.prototype = {

    /**
     * Метод возвращает true если корабль потоплен, иначе false
     * @returns {Boolean}
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
     * Возвращает позиции ячеек на которых установлен корабль
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
 * Поле игры
 * @param {Object} onShipDamaged колбэк срабатывающий при ранении корабля
 * @param {Object} onSheepDied колбэк срабатывающий при потоплении корабля
 * @param {Object} playerLost колбэк срабатывающий при проигрыше игрока
 * @param {Number} fieldHeight высота поля
 * @param {Number} fieldWidth ширина поля
 */
BattleShip.Field = function(onShotMissed, onShipDamaged, onSheepDied, playerLost, fieldHeight, fieldWidth) {

    this.fieldHeight =  fieldHeight || 10;
    this.fieldWidth = fieldWidth || 10;

    this.onShotMissed = onShotMissed;
    this.onShipDamaged = onShipDamaged;
    this.onSheepDied = onSheepDied;
    this.playerLost = playerLost;

    /**
     * Корабли на поле
     * @type {Array}
     */
    this.ships = [];

    /**
     * Ячейки поля
     * @type {Array}
     */
    this.cellWidgets = [];

    this.initCells()

    this.initShips();
}

BattleShip.Field.prototype = {

    /**
     * Инициализирует ячейки поля
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
     * Инициализирует и размещает корабли на поле
     */
    initShips: function() {
        this.arrangeShips( BattleShip.ShipsInfo.FOUR_DECKER.COUNT, BattleShip.ShipsInfo.FOUR_DECKER.LENGTH );
        this.arrangeShips( BattleShip.ShipsInfo.THREE_DECKER.COUNT, BattleShip.ShipsInfo.THREE_DECKER.LENGTH );
        this.arrangeShips( BattleShip.ShipsInfo.TWO_DECKER.COUNT, BattleShip.ShipsInfo.TWO_DECKER.LENGTH );
        this.arrangeShips( BattleShip.ShipsInfo.SINGLE_DECKER.COUNT, BattleShip.ShipsInfo.SINGLE_DECKER.LENGTH );
    },

    /**
     * Размещает несколько кораблей одной длины на поле
     * @param {Number} shipsCount количество кораблей
     * @param {Number} shipLength размер кораблей
     */
    arrangeShips: function(shipsCount, shipLength) {
        for ( var i = 0; i < shipsCount; i++ ) {
            this.arrangeShip( shipLength );
        }
    },

    /**
     * Размещает корабль на поле
     * @param {Number} shipLength
     */
    arrangeShip: function(shipLength) {

        var shipIsPlaced = false;

        while ( !shipIsPlaced ) {
            var isVertical = Math.random() > 0.5 ? true : false;

            var xCoordinate = randomNumber( this.fieldWidth );
            var yCoordinate = randomNumber( this.fieldHeight );

            // вычисляем рандомные координаты до тех пор пока они не будут вписываться в размеры поля
            if ( isVertical ) {
                while( yCoordinate + shipLength >= this.fieldHeight ) {
                    yCoordinate = randomNumber(this.fieldHeight);
                }
            } else { //horizontal
                while( xCoordinate + shipLength >= this.fieldWidth ) {
                    xCoordinate = randomNumber(this.fieldWidth);
                }
            }

            // проверяем пространство вокруг создаваемого корабля
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

                // создаем корабль и добавляем в него ячейки
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
         * Возвращает рандомное число от 0 до указанного числа, округленное в меньшую сторону
         * @param {Number} range верхняя граница числа + 1
         * @returns {Number}
         */
        function randomNumber(range) {
            return Math.floor( Math.random() * (range - 1) );
        }
    },

    /**
     * Проверка на наличие кораблей в указанной зоне
     * @param {Number} xCoordinate координата по оси Х первой ячейки корабля
     * @param {Number} yCoordinate координата по оси Х первой ячейки корабля
     * @param {Boolean} isVertical выравнивание корабля является вертикальным
     * @param {Number} shipLength размер корабля
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
     * Производит выстрел по указанной позиции и в ответ вызывает соответствующие колбэки
     * @param {Array} shotPosition
     */
    makeShot: function(shotPosition) {
        var cell = this.getCellByPosition( shotPosition );
        // если ранее по ячейке не стреляли
        if ( !cell.isFired ) {
            // делаем ячейку подбитой
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
     * Получение информации об итоге выстрела (нанес урон / потопил корабль / выйграл игру)
     * @param {Array} shotPosition позиция выстрела
     * @returns {Null}
     */
    getShotStatus: function(shotPosition) {
        var result = null
          , ship = this.getShipByPosition( shotPosition );

        // выполняем только если есть корабль на данной позиции
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
     * Проверка на проигрыш игры
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
     * Устанавливает ячейку подбитой
     * @param {BattleShip.Position} pos позиция ячейки
     */
    setCellFired: function(pos) {
        var cell = this.getCellByPosition( pos );
        if ( cell ) {
            cell.isFired = true;
        }
    },

    /**
     * Устанавливает окружающие ячейки корабля подбитыми
     * @param {Array} shipPositions ячейки корабля
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
     * Возвращает корабль котор. находится на переданной позиции
     * @param {BattleShip.Position} pos позиция корабля
     * @returns {BattleShip.Ship}
     */
    getShipByPosition: function(pos) {
        var cell = this.getCellByPosition( pos );
        return cell.ship;
    },

    /**
     * Возвращает ячейку по переданной позиции
     * @param {BattleShip.Position} pos позиция
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
