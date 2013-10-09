'use strict';
/**
 * Ячейка в поле
 * @param pos позиция ячейки
 * @param ship корабль, который установлен на ячейку
 * @constructor
 */
BattleShip.Cell = function(pos, ship) {
    this.pos = pos;
    this.ship = ship;

    /**
     * Был ли произведен выстрел по ячейке
     * @type {boolean}
     */
    this.isFired = false;
}