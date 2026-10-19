import { registerSW } from 'virtual:pwa-register';
import './game.js';

// keeps the installed app up to date: a new version is fetched in the background and used on the next launch
registerSW({ immediate: true });
