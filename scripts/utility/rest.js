import {armorModel} from '../macros/classFeatures/artificer/armorer/armorModel.js';
import {summonDrakeCompanion} from '../macros/classFeatures/ranger/drakeWarden/summonDrakeCompanion.js';
import {steelDefender} from '../macros/classFeatures/artificer/battleSmith/steelDefender.js';
import {arcaneWard} from '../macros/classFeatures/wizard/schoolOfAbjuration/arcaneWard.js';
export async function rest(actor, data) {
    await armorModel.longRest(actor, data);
    await summonDrakeCompanion.longRest(actor, data);
    await steelDefender.longRest(actor, data);
    await arcaneWard.longRest(actor, data);
}