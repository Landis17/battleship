'use strict';
/**
 * Cell constructor
 * @param pos
 * @param ship in this position
 * @constructor
 */
BattleShip.Cell = function(pos, ship) {
    this.pos = pos;
    this.ship = ship;

    /**
     * Is cell fired?
     * @type {boolean}
     */
    this.isFired = false;
}