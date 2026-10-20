export type GameScreen = 'title' | 'playing' | 'mission_passed' | 'wasted' | 'paused' | 'ending';

export type CameraMode = 'chase' | 'hood' | 'topdown' | 'cinematic';

export type WeatherType = 'clear' | 'overcast' | 'light_rain';

export interface DialogueItem {
  id: string;
  speaker: 'Leo' | 'Mia' | 'Dispatch' | 'Radio';
  text: string;
  duration: number; // in seconds
  color?: string;
}

export interface MissionStep {
  id: string;
  objectiveText: string;
  targetPos: { x: number; z: number; radius: number };
  targetDescription: string;
  requiredAction?: 'drive_to' | 'enter_car' | 'defeat_cops' | 'lose_wanted' | 'interact_mia' | 'survive';
  targetWantedLevel?: number;
}

export interface Mission {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  rewardCash: number;
  rewardLove: number;
  initialWanted: number;
  startDialogue: DialogueItem[];
  steps: MissionStep[];
  successDialogue: DialogueItem[];
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  cash: number;
  loveMeter: number; // 0 to 100
  loveTitle: string;
  specialAbility: number; // 0 to 100 (Franklin/Michael slow-mo)
  isSpecialActive: boolean;
  isInVehicle: boolean;
  currentVehicleName: string;
  vehicleHealth: number;
  vehicleSpeed: number; // in km/h
  nitro: number; // 0 to 100
  wantedLevel: number; // 0 to 5 stars
  wantedFlashing: boolean;
  currentWeapon: 'Pistol' | 'SMG' | 'Roses';
  ammo: number;
  weather: WeatherType;
}

export interface RadioStation {
  id: string;
  name: string;
  genre: string;
  freq: string;
  dj: string;
  trackName: string;
}

export interface PhoneMessage {
  id: string;
  sender: 'Mia' | 'Lester' | 'Bank';
  text: string;
  time: string;
  read: boolean;
  isLove?: boolean;
}
