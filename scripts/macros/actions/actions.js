import {checkCover} from './checkCover.js';
import {fall} from './fall.js';
import {grapple} from './grapple.js';
import {help} from './help.js';
import {nonLethal} from './nonLethal.js';
import {search} from './search.js';
import {shove} from './shove.js';
import {stealthCheck} from './stealth.js';
import {underwater} from './underwater.js';
export let actions = {
    'checkCover': checkCover,
    'fall': fall,
    'grapple': grapple,
    'nonLethal': nonLethal,
    'search': search,
    'shove': shove,
    'stealth': stealthCheck,
    'underwater': underwater,
    'help': help
}