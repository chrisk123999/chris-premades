import {macros} from './macros.js';
let automations = {
    acidArrow: {
        name: 'Acid Arrow',
        version: '0.12.0',
        midi: {
            item: [
                {
                    pass: 'postAttackRoll',
                    macro: macros.spells.acidArrow.attack,
                    priority: 50
                },
                {
                    pass: 'postDamageRoll',
                    macro: macros.spells.acidArrow.damage,
                    priority: 50
                }
            ]
        }
    },
    hex: {
        name: 'Hex',
        version: '0.12.0',
        midi: {
            item: [
                {
                    pass: 'RollComplete',
                    macro: macros.spells.hex.use,
                    priority: 50
                }
            ],
            actor: [
                {
                    pass: 'postDamageRollComplete',
                    macro: macros.spells.hex.damage
                }
            ]
        }
    },
    hexMove: {
        name: 'Hex - Move',
        version: '0.12.0',
        midi: {
            item: [
                {
                    pass: 'RollComplete',
                    macro: macros.spells.hex.move
                }
            ]
        }
    }
};