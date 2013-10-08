'use strict';


/**
 * Позиция на поле
 * @param x позиция по оси Х
 * @param y позиция по оси У
 * @constructor
 */
SeaBattle.Position = function(x, y) {
    this.x = x;
    this.y = y;
}

/**
 * Ячейка в поле
 * @param pos позиция ячейки
 * @param ship корабль, который установлен на ячейку
 * @constructor
 */
SeaBattle.Cell = function(pos, ship) {
    this.pos = pos;
    this.ship = ship;

    /**
     * Был ли произведен выстрел по ячейке
     * @type {boolean}
     */
    this.isFired = false;
}

/**
 * Информация о караблях (длина корабля / количество кораблей)
 */
SeaBattle.ShipsInfo = {

    /**
     * Четырехпалубник
     */
    FOUR_DECKER : {LENGTH: 4, COUNT: 1},

    /**
     * Трехпалубник
     */
    THREE_DECKER : {LENGTH: 3, COUNT: 2},

    /**
     * Двухпалубник
     */
    TWO_DECKER : {LENGTH: 2, COUNT: 3},

    /**
     * Однопалубник
     */
    SINGLE_DECKER : {LENGTH: 1, COUNT: 4}
}


/**
 * Объект корабля
 * @constructor
 */
SeaBattle.Ship = function() {
    this.cellWidgets = [];
}

SeaBattle.Ship.prototype = {

    /**
     * Метод возвращает true если корабль потоплен, иначе false
     * @returns {boolean}
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
     */
    getPositions: function() {
        var result = [];
        for ( var i = 0; i < this.cellWidgets.length; i++ ) {
            result.push(this.cellWidgets[i].pos);
        }
        return result;
    }
}


/**
 * Статус выстрела
 * @type {{DAMAGED: string, KILLED: string}}
 */
SeaBattle.ShotStatus = {
    /**
     * Выстрел нанес урон кораблю
     */
    DAMAGED : "damaged",

    /**
     * Выстрел уничтожил корабль
     */
    KILLED : "killed",


    /**
     * Неточный выстрел
     */
    MISSED : "MISSED"
}


/**
 * Поле игры
 * @param onShipDamagedCallback колбэк срабатывающий при ранении корабля
 * @param onSheepDiedCallBack колбэк срабатывающий при потоплении корабля
 * @param playerLostCallback колбэк срабатывающий при проигрыше игрока
 * @param fieldHeight высота поля
 * @param fieldWidth ширина поля
 * @constructor
 * @param fieldWidth
 * @param fieldHeight
 * @param playerLostCallback
 * @param onSheepDiedCallBack
 * @param onShipDamagedCallback
 */
SeaBattle.Field = function(onShotMissedCallback, onShipDamagedCallback, onSheepDiedCallBack, playerLostCallback, fieldHeight, fieldWidth) {

    this.fieldHeight =  fieldHeight || 10;
    this.fieldWidth = fieldWidth || 10;

    this.onShotMissedCallback = onShotMissedCallback;
    this.onShipDamagedCallback = onShipDamagedCallback;
    this.onSheepDiedCallBack = onSheepDiedCallBack;
    this.playerLostCallback = playerLostCallback;

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

SeaBattle.Field.prototype = {

    /**
     * Инициализирует ячейки поля
     */
    initCells: function() {
        for ( var i = 0; i < this.fieldWidth; i++ ) {
            for ( var j = 0; j < this.fieldHeight; j++ ) {
                var pos = new SeaBattle.Position(i, j);
                var cell = new SeaBattle.Cell(pos, null);
                this.cellWidgets.push(cell);
            }
        }
    },

    /**
     * Инициализирует и размещает корабли на поле
     */
    initShips: function() {
        this.arrangeShips( SeaBattle.ShipsInfo.FOUR_DECKER.COUNT, SeaBattle.ShipsInfo.FOUR_DECKER.LENGTH );
        this.arrangeShips( SeaBattle.ShipsInfo.THREE_DECKER.COUNT, SeaBattle.ShipsInfo.THREE_DECKER.LENGTH );
        this.arrangeShips( SeaBattle.ShipsInfo.TWO_DECKER.COUNT, SeaBattle.ShipsInfo.TWO_DECKER.LENGTH );
        this.arrangeShips( SeaBattle.ShipsInfo.SINGLE_DECKER.COUNT, SeaBattle.ShipsInfo.SINGLE_DECKER.LENGTH );
    },

    /**
     * Размещает несколько кораблей одной длины на поле
     * @param shipsCount количество кораблей
     * @param shipLength размер кораблей
     */
    arrangeShips: function(shipsCount, shipLength) {
        for ( var i = 0; i < shipsCount; i++ ) {
            this.arrangeShip( shipLength );
        }
    },

    /**
     * Размещает корабль на поле
     * @param shipLength
     */
    arrangeShip: function(shipLength) {

        var shipIsPlaced = false;

        while ( !shipIsPlaced ) {
            var isVertical = Math.random() > 0.5 ? true : false;

            var xCoordinate = randomNumber(this.fieldWidth);
            var yCoordinate = randomNumber(this.fieldHeight);

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
                    for (var i = yCoordinate; i < (yCoordinate + shipLength); i++) {
                        shipPositions.push(new SeaBattle.Position(xCoordinate, i))
                    }
                } else { // horizontal
                    for (var i = xCoordinate; i < (xCoordinate + shipLength); i++) {
                        shipPositions.push(new SeaBattle.Position(i, yCoordinate));
                    }
                }

                // создаем корабль и добавляем в него ячейки
                var ship = new SeaBattle.Ship();

                for ( var i = 0; i < shipPositions.length; i++ ) {
                    var shipCell = this.getCellByPosition(shipPositions[i]);
                    ship.cellWidgets.push(shipCell);
                    shipCell.ship = ship;
                }
                this.ships.push( ship );
                shipIsPlaced = true;
            }
        }

        /**
         * Возвращает рандомное число от 0 до указанного числа, округленное в меньшую сторону
         * @param range верхняя граница числа + 1
         * @returns {number}
         */
        function randomNumber(range) {
            return Math.floor( Math.random() * (range - 1) );
        }
    },

    /**
     * Проверка на наличие кораблей в указанной зоне
     * @param xCoordinate координата по оси Х первой ячейки корабля
     * @param yCoordinate координата по оси Х первой ячейки корабля
     * @param isVertical выравнивание корабля является вертикальным
     * @param shipLength размер корабля
     * @returns {boolean}
     */
    isShipsPlacedAround: function(xCoordinate, yCoordinate, isVertical, shipLength) {
        var topLeftPos = new SeaBattle.Position( xCoordinate - 1, yCoordinate - 1 );

        var bottomRightPos = null;
        if ( isVertical ) {
            bottomRightPos = new SeaBattle.Position( xCoordinate + 1, yCoordinate + shipLength );
        } else {
            bottomRightPos = new SeaBattle.Position( xCoordinate + shipLength, yCoordinate + 1 );
        }

        var isShipExistInArea = false;

        for ( var i = topLeftPos.x; i <= bottomRightPos.x; i++ ) {
            for ( var j = topLeftPos.y; j <= bottomRightPos.y; j++ ) {
                var cell = this.getCellByPosition( new SeaBattle.Position(i, j) );
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
     * @param shotPosition
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
                    case SeaBattle.ShotStatus.DAMAGED:
                        this.onShipDamagedCallback( shotPosition );
                        break;

                    case SeaBattle.ShotStatus.KILLED:
                        var ship = this.getShipByPosition(shotPosition);
                        this.onSheepDiedCallBack( ship.getPositions() );

                        if ( this.playerHasLost() ) {
                            this.playerLostCallback();
                        }
                        break;

                    case SeaBattle.ShotStatus.MISSED:
                        this.onShotMissedCallback( shotPosition );
                        break;
                }
            }
        }
    },

    /**
     * Получение информации об итоге выстрела (нанес урон / потопил корабль / выйграл игру)
     * @param shotPosition позиция выстрела
     * @returns {null}
     */
    getShotStatus: function(shotPosition) {

        var result = null;

        var ship = this.getShipByPosition( shotPosition );
        // выполняем только если есть корабль на данной позиции
        if ( ship ) {
            if ( ship.isDead() ) {
                result = SeaBattle.ShotStatus.KILLED;
            } else {
                result = SeaBattle.ShotStatus.DAMAGED;
            }
        } else {
            result =  SeaBattle.ShotStatus.MISSED;
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
     * @param pos позиция ячейки
     */
    setCellFired: function(pos) {
        var cell = this.getCellByPosition(pos);
        if ( cell ) {
            cell.isFired = true;
        }
    },

    /**
     * Возвращает корабль котор. находится на переданной позиции
     * @param pos позиция корабля
     * @returns {*}
     */
    getShipByPosition: function(pos) {
        var cell = this.getCellByPosition( pos );
        return cell.ship;
    },

    /**
     * Возвращает ячейку по переданной позиции
     * @param pos позиция
     * @returns {null}
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
