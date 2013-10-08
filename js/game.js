/**
 * @author 
 */

(function($) {

    var SeaBattle = {}; // инициализируем пространство имен


    /**
     * Объект игры Морской бой
     * @param humanContainer Контейнер для отображения поля человека
     * @param botContainer Контейнер для отображения поля компьютера
     * @param gameStatusContainer Контейнер для отображения статуса игры
     * @param arenaWidth ширина поля
     * @param arenaHeight высота поля
     * @constructor
     */
    SeaBattle.Game = function(humanContainer, botContainer, gameStatusContainer, arenaWidth, arenaHeight) {

        this.humanContainer = humanContainer;
        this.botContainer = botContainer;
        this.gameStatusContainer = gameStatusContainer;
        this.fieldWidth = arenaWidth;
        this.fieldHeight = arenaHeight;

        /**
         * Модель поля человека
         * @type {SeaBattle.Field}
         */
        this.humanField = null;

        /**
         * Модель поля компьютера
         * @type {SeaBattle.Field}
         */
        this.botField = null;

        /**
         * Позиции на поле по которым стреляем компьютер
         * @type {Array}
         */
        this.botShootingPositions = [];

    }

    SeaBattle.Game.prototype = {

        /**
         * Стартует игру
         */
        start: function() {
            this.initHumanField();
            this.initBotField();
            this.initBotShootingPositions();
            $(this.gameStatusContainer).text("Ваш ход");
        },


        /**
         * Инициализирует массив позиций по которым будет стрелять компьютер
         */
        initBotShootingPositions: function() {
            for (var i = 0; i < this.fieldWidth; i++) {
                for (var j = 0; j < this.fieldHeight; j++) {
                    this.botShootingPositions.push(new SeaBattle.Position(i, j));
                }
            }
            // перемешиваем
            shuffleArray(this.botShootingPositions);

            function shuffleArray(o) { // взято отсюда: http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
                for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
                return o;
            }
        },

        /**
         * Инициализация представления поля компьютера
         */
        initBotField: function() {

            var table = this.createTable(this.botContainer);

            var self = this;

            var onShotMissedHandler = function(pos) {
                $(self.gameStatusContainer).text("Ход противника");
                table.find('tr').eq(pos.y).find('td').eq(pos.x).addClass('fired_cell');
                self.botAttack();
            }

            var onShipDamagedHandler = function(pos) {
                self.markShipDamaged(table, pos);
            }

            var onShipDiedHandler = function(shipPositions) {
                self.markShipDied(table, shipPositions);
            }

            var onBotLostHandler = function() {
                $(self.gameStatusContainer).text('Игра окончена. Вы победили');
                alert("Вы победили. Игра начнется заново. ");
                location.reload();
            };

            this.botField = new SeaBattle.Field (
                onShotMissedHandler,
                onShipDamagedHandler,
                onShipDiedHandler,
                onBotLostHandler,
                this.fieldHeight,
                this.fieldWidth);

            table.on('click', 'td', function() {
                var xCoordinate = this.cellIndex;
                var yCoordinate = this.parentNode.rowIndex;
                self.botField.makeShot(new SeaBattle.Position(xCoordinate, yCoordinate));
            });
        },

        /**
         * Инициализация представления поля человека
         */
        initHumanField: function() {

            var table = this.createTable(this.humanContainer);

            var self = this;

            var onShotMissedHandler = function(pos) {
                $(self.gameStatusContainer).text("Ваш ход");
                table.find('tr').eq(pos.y).find('td').eq(pos.x).addClass('fired_cell');
            }

            var onShipDamagedHandler = function(pos) {
                self.markShipDamaged(table, pos);
                self.botAttack();
            }

            var onShipDiedHandler = function(shipPositions) {
                self.markShipDied(table, shipPositions);
                self.botAttack();
            }

            var onHumanLostHandler = function() {
                $(self.gameStatusContainer).text('Игра окончена. Вы проиграли.');
                alert("Вы проиграли. Игра начнется заново.");
                location.reload();
            };

            this.humanField = new SeaBattle.Field(
                onShotMissedHandler,
                onShipDamagedHandler,
                onShipDiedHandler,
                onHumanLostHandler,
                this.fieldHeight,
                this.fieldWidth);

            // отображаем все корабли человека
            for (var i = 0; i < this.humanField.ships.length; i++) {
                var shipPositions = this.humanField.ships[i].getPositions();
                for (var j = 0; j < shipPositions.length; j++) {
                    var pos = shipPositions[j];
                    table.find('tr').eq(pos.y).find('td').eq(pos.x).addClass('live_ship');
                }
            }
        },

        /**
         * Инициализирует визуальное представление поля игры
         * @param container родительский контейнер
         * @returns {*}
         */
        createTable: function(container) {
            var table = $('<table></table>').addClass('field');

            for(var i = 0; i < this.fieldWidth; i++) {
                var tr = $('<tr></tr>').appendTo(table);
                for (var j = 0; j < this.fieldHeight; j++) {
                    $('<td></td>').appendTo(tr);
                }
            }

           $(container).append(table);

           return table;
        },


        /**
         * Атака компьютера
         */
        botAttack: function() {
            var self = this;
            // делаем таймаут для эффекта обдумывания следующего хода компьютером
            setTimeout(function () {
                var pos = self.botShootingPositions.pop();
                self.humanField.makeShot(pos);
            }, 300);

        },

        /**
         * Закрашивает клетку раненого корабля
         * @param table
         * @param pos позиция клетки
         */
        markShipDamaged: function(table, pos) {
            table.find('tr').eq(pos.y).find('td').eq(pos.x).removeClass('fired_cell').addClass('damaged_ship');
        },

        /**
         * Закрашивает клетки потопленного корабля
         * @param table элемент таблицы
         * @param shipPositions позиции на которых был установлен корабль
         */
        markShipDied: function(table, shipPositions) {
            for (var i = 0; i < shipPositions.length; i++) {
                table.find('tr').eq(shipPositions[i].y).find('td').eq(shipPositions[i].x).removeClass('fired_cell').addClass('died_ship');
            }
        }
    }

    window.SeaBattle = SeaBattle; // делаем пространство имен доступным из вне

})(jQuery);
