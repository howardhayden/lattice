import { createRequire } from "node:module";
import { compileProfile } from "./profile.js";
import { deepFreeze } from "./util.js";

const require = createRequire(import.meta.url);
const profileDefinition = require("../profiles/relational-systems.profile.json");

/**
 * The declarative definition is exported for schema checks and exact JSON parity.
 * Compilation operates on a clone because profile compilation normalizes rules.
 */
export const relationalSystemsDefinition = deepFreeze(profileDefinition);

export const relationalSystemsProfile = compileProfile(structuredClone(relationalSystemsDefinition));

export default relationalSystemsProfile;
