import {grapple} from '../../actions/grapple.js';
import {autoGrapple} from './autoGrapple.js';
import {regeneration} from './regeneration.js';
import {search} from '../../actions/search.js';
import {shove} from '../../actions/shove.js';
import {stealthCheck} from '../../actions/stealth.js';
import {swarmDamage} from './swarm.js';
import {prone} from './prone.js';
import {fall} from '../../actions/fall.js';
import {underwater} from '../../actions/underwater.js';
import {nonLethal} from '../../actions/nonLethal.js';
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