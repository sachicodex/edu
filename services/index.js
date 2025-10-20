// Central aggregator (broadly compatible exports)
import * as db from './db/index.js';
import * as upload from './upload/index.js';
import * as saved from './saved/index.js';
import * as search from './search/index.js';
export { toast as TOAST } from './ui/toast.js';

export const DB = db;
export const UPLOAD = upload;
export const SAVED = saved;
export const SEARCH = search;
