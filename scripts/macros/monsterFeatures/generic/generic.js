import {maneuvers} from '../../classFeatures/fighter/battleMaster/maneuvers.js';
import {autoGrapple} from './grapple.js';
import {regeneration} from './regeneration.js';
import {search} from './search.js';
import {shove} from './shove.js';
import {stealthCheck} from './stealth.js';
import {swarmDamage} from './swarm.js';
export let generic = {
    'autoGrapple': autoGrapple,
    'swarmDamage': swarmDamage,
    'regeneration': regeneration,
    'stealthCheck': stealthCheck,
    'search': search,
    'grapple': maneuvers.grapplingStrike,
    'shove': shove
}