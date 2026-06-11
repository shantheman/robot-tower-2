/** Balance knobs — ported 1:1 from the Python original's config.py (v0.7.0).
 *
 * RULE (from docs/design/HANDOFF.md): the original app is the source of truth
 * for every value and behavior; the design mocks are visual-only. When values
 * here change, update docs/SPEC-game-mechanics.md in the same commit.
 */

export const WORLD_W = 960;
export const WORLD_H = 720;

// Tower
export const TOWER_SIZE = 48;
export const TOWER_MAX_HP = 100;
export const TOWER_HP_PER_LEVEL = 20;
export const TOWER_EARN_PER_LEVEL = 0.10;
export const TOWER_CASH_PER_LEVEL = 30;
export const TOWER_UPGRADE_BASE_COST = 50; // cores
export const TOWER_UPGRADE_GROWTH = 1.4;

// Player gun
export const BULLET_RADIUS = 5;
export const BULLET_SPEED = 600;
export const BULLET_DAMAGE = 20;
export const FIRE_COOLDOWN = 0.5;
export const TURRET_DAMAGE_PER_LEVEL = 4;
export const TURRET_COOLDOWN_FACTOR = 0.9;

// Enemies (base stats; speed_mult scales the wave speed)
export const ROBOT_SPEED = 70;
export const SPAWN_MARGIN = 30;
export interface EnemyType {
  key: string;
  sprite: string;
  radius: number;
  hp: number;
  speedMult: number;
  reward: number;        // coins
  contactDamage: number;
  levelScaled: boolean;  // does HP ramp with effective wave?
  healthbar: boolean;
  ranged?: { fireRange: number; fireCd: number; projDamage: number };
}
export const GRUNT: EnemyType = { key: "grunt", sprite: "enemy_0", radius: 14, hp: 20, speedMult: 1.0, reward: 5, contactDamage: 6, levelScaled: false, healthbar: false };
export const FAST: EnemyType = { key: "fast", sprite: "enemy_1", radius: 10, hp: 10, speedMult: 1.8, reward: 6, contactDamage: 4, levelScaled: false, healthbar: false };
export const TOUGH: EnemyType = { key: "tough", sprite: "enemy_3", radius: 15, hp: 70, speedMult: 0.9, reward: 14, contactDamage: 14, levelScaled: false, healthbar: false };
export const TANK: EnemyType = { key: "tank", sprite: "enemy_2", radius: 26, hp: 160, speedMult: 0.5, reward: 30, contactDamage: 34, levelScaled: true, healthbar: true };
export const BOMBER: EnemyType = { key: "bomber", sprite: "enemy_4", radius: 16, hp: 40, speedMult: 1.4, reward: 12, contactDamage: 26, levelScaled: true, healthbar: false };
export const BOSS: EnemyType = { key: "boss", sprite: "boss", radius: 40, hp: 400, speedMult: 0.35, reward: 150, contactDamage: 90, levelScaled: true, healthbar: true };
export const SHOOTER: EnemyType = { key: "shooter", sprite: "shooter", radius: 13, hp: 30, speedMult: 0.8, reward: 16, contactDamage: 8, levelScaled: true, healthbar: false, ranged: { fireRange: 260, fireCd: 1.6, projDamage: 8 } };
export const ENEMY_BULLET_SPEED = 240;
export const ENEMY_BULLET_RADIUS = 6;

// Waves / difficulty curve
export const WAVES_BY_LEVEL: Record<number, number> = { 1: 7, 2: 10, 3: 15, 4: 20 };
export const WAVES_LEVEL_EXTRA = 5;
export const WAVE_BASE_COUNT = 5;
export const WAVE_COUNT_PER_WAVE = 1;
export const WAVE_SPEED_PER_WAVE = 4.0;
export const DIFF_WAVE1 = 1.6;
export const DIFF_PER_WAVE = 0.7;
export const LEVEL_RAMP = 0.35;
export const HEAVY_HP_RAMP = 0.12;
export const SPAWN_INTERVAL_BASE = 1.1;
export const SPAWN_INTERVAL_STEP = 0.02;
export const SPAWN_INTERVAL_MIN = 0.45;
export const INTERMISSION_TIME = 3.0;

// Economy — coins (in-run) and Cores (permanent). Cores are earned by
// CLEARING WAVES, never by converting coins (v0.7.0 model).
export const MONEY_PER_KILL = 5; // (enemy rewards above are the real payouts)
export const COMBO_WINDOW = 2.0;
export const COMBO_BONUS_PER = 0.1;
export const COMBO_BONUS_MAX = 2.0;
export const WAVE_CLEAR_CORES = 1;   // x level, per cleared wave (instant)
export const LEVEL_CLEAR_CORES = 15; // x level, bonus for the boss wave

// Turret sprite rig (from the design handoff — pivots took iteration!)
export const GUN_PIVOT = { x: 0.5, y: 0.79 };   // of turret_gun.png
export const BASE_SOCKET = { x: 0.5, y: 0.43 }; // of turret_base.png
// Visual sizes (world px), proportions per the mock: gun height = 0.69 x base.
export const TURRET_BASE_W = 96;
export const TURRET_GUN_H = 66;
export const ENEMY_SPRITE_SCALE = 3.0;          // sprite width = radius x this

// -- In-run upgrade costs (base x growth^level) -------------------------------
export const GEN_BASE_COST = 50;
export const GEN_COST_GROWTH = 1.6;
export const GEN_INCOME = 3.0;            // coins/sec per level
export const AUTO_BASE_COST = 50;
export const AUTO_COST_GROWTH = 1.6;
export const AUTO_BASE_COOLDOWN = 1.0;    // seconds per shot / level
export const AUTO_BULLET_DAMAGE = 18;
export const TURRET_BASE_COST = 60;
export const TURRET_COST_GROWTH = 1.6;
export const TURRET_CD_FACTOR = 0.9;
export const TURRET_SIZE_PER_LEVEL = 1;
export const MS_BASE_COST = 220;
export const MS_COST_GROWTH = 2.0;
export const MULTI_SPREAD_DEG = 16;
export const PIERCE_BASE_COST = 150;
export const PIERCE_COST_GROWTH = 1.8;
export const EXPLOSIVE_BASE_COST = 250;
export const EXPLOSIVE_COST_GROWTH = 1.8;
export const EXPLOSIVE_SPLASH_DMG = 12;
export const EXPLOSIVE_SPLASH_PER_LEVEL = 6;
export const EXPLOSIVE_RADIUS = 60;
export const GUIDED_COST = 350;
export const GUIDED_TURN = 120;           // deg/sec steering cap
export const GUIDED_RANGE = 240;

// Defense trio
export const REPAIR_BASE_COST = 60;
export const REPAIR_COST_GROWTH = 1.4;
export const REPAIR_HP = 30;
export const PLATING_BASE_COST = 90;
export const PLATING_COST_GROWTH = 1.5;
export const PLATING_HP = 25;
export const SHIELD_BASE_COST = 350;
export const SHIELD_COST_GROWTH = 1.7;
export const SHIELD_BASE_HITS = 2;        // layers at level 1 (+1 per level)
export const SHIELD_HIT_ABSORB = 30;      // dmg one layer soaks from a single hit
export const SHIELD_RING_BASE = 66;       // innermost ring radius (px)
export const SHIELD_RING_GAP = 7;         // +radius per extra layer

// Drone
export const DRONE_RADIUS = 11;
export const DRONE_SPEED = 300;
export const DRONE_DAMAGE = 18;
export const DRONE_DAMAGE_PER_LEVEL = 4;
export const DRONE_STANDOFF = 75;
export const DRONE_BASE_RANGE = 130;
export const DRONE_RANGE_PER_LEVEL = 55;
export const DRONE_BASE_CD = 1.6;
export const DRONE_CD_FACTOR = 0.8;
export const DRONE_COST = 100;
export const DRONE_ORBIT_RADIUS = 100;
export const DRONE_ORBIT_SPEED = 90;      // deg/sec idle orbit
export const DRONE_UPGRADE_BASE_COST = 80;
export const DRONE_UPGRADE_GROWTH = 1.6;

// Ultimates (own many, equip one; Space fires the equipped one)
export const LASER_COST = 1000;
export const LASER_COOLDOWN = 12;
export const LASER_DURATION = 2.5;
export const LASER_DPS = 240;
export const LASER_WIDTH = 44;
export const FREEZE_COST = 250;
export const FREEZE_DURATION = 3.0;
export const FREEZE_COOLDOWN = 14;
export const EMP_COST = 400;
export const EMP_DAMAGE = 60;
export const EMP_STUN = 0.8;              // a pulse, NOT a freeze
export const EMP_COOLDOWN = 10;
export const WARP_COST = 500;
export const WARP_FACTOR = 0.35;
export const WARP_DURATION = 8.0;
export const WARP_COOLDOWN = 16;
export type UltimateKey = "emp" | "freeze" | "warp" | "laser";
export const ULTIMATE_COSTS: Record<UltimateKey, number> = {
  emp: EMP_COST, freeze: FREEZE_COST, warp: WARP_COST, laser: LASER_COST,
};
export const ULTIMATE_NAMES: Record<UltimateKey, string> = {
  emp: "EMP Burst", freeze: "Freeze Bomb", warp: "Time Warp", laser: "Laser Beam",
};

// Instant kill bonuses (no pickups — granted on the kill itself)
export const DROP_CHANCE = 0.08;
export const DROP_WEIGHTS = { cash: 1, heal: 3, rapid: 1 }; // heal only rolls when hurt
export const DROP_CASH = 40;
export const DROP_HEAL = 25;
export const DROP_RAPID_TIME = 5.0;
export const RAPID_FIRE_CD_MULT = 0.4;

// Juice
export const FLASH_TIME = 0.06;
export const MAX_DT = 0.05;
export const SAVE_VERSION = 1;
