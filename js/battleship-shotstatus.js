'use strict';
/**
 * Shot Status
 * @type {{DAMAGED: string, KILLED: string}}
 */
BattleShip.ShotStatus = {
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