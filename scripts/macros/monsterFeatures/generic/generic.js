import {grapple} from './grapple.js';
import {autoGrapple} from './autoGrapple.js';
import {regeneration} from './regeneration.js';
import {search} from './search.js';
import {shove} from './shove.js';
import {stealthCheck} from './stealth.js';
import {swarmDamage} from './swarm.js';
import {prone} from './prone.js';
import {fall} from './fall.js';
import {underwater} from './underwater.js';
import {nonLethal} from './nonLethal.js';
import {parry} from './parry.js';
export let generic = {
    'autoGrapple': autoGrapple,
    'swarmDamage': swarmDamage,
    'regeneration': regeneration,
    'stealthCheck': stealthCheck,
    'search': search,
    'grapple': grapple,
    'shove': shove,
    'prone': prone,
    'fall': fall,
    'underwater': underwater,
    'nonLethal': nonLethal,
    'parry': parry
}