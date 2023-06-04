import {armorModel} from '../macros/classFeatures/artificer/armorer/armorModel.js';
import {summonDrakeCompanion} from '../macros/classFeatures/ranger/drakeWarden/summonDrakeCompanion.js';
export async function rest(actor, data) {
    await armorModel.longRest(actor, data);
    await summonDrakeCompanion.longRest(actor, data);
}