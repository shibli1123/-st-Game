import { Mission } from '../types/game';

export const CAMPAIGN_MISSIONS: Mission[] = [
  {
    id: 'm1_first_sparks',
    number: 1,
    title: 'First Sparks in Gulshan',
    subtitle: 'Hatirjheel Sunset Run',
    description: 'Pick up Mia from the Gulshan-2 diplomatic safehouse, test the tuned Dominator GT across the illuminated Hatirjheel bridge, and reach Dhanmondi Lake for a romantic sunset cruise.',
    rewardCash: 250000, // ৳ 2,50,000 BDT
    rewardLove: 15,
    initialWanted: 0,
    startDialogue: [
      {
        id: 'd1_1',
        speaker: 'Mia',
        text: 'The car sounds incredible, Leo! Did you tune the twin turbos like I showed you in Gulshan?',
        duration: 3.5,
        color: '#f43f5e',
      },
      {
        id: 'd1_2',
        speaker: 'Leo',
        text: 'She roars just for you, Mia. Hop in, let us escape the Dhaka traffic for a while.',
        duration: 3.2,
        color: '#38bdf8',
      },
      {
        id: 'd1_3',
        speaker: 'Mia',
        text: 'Take the Hatirjheel Expressway bridge! Turn on Dhaka FM 90.4 on the radio!',
        duration: 3.2,
        color: '#f43f5e',
      },
    ],
    steps: [
      {
        id: 'step_1_drive',
        objectiveText: 'Cruise with Mia across the Hatirjheel Cable-Stayed Bridge',
        targetPos: { x: 0, z: 0, radius: 22 },
        targetDescription: 'Hatirjheel Central Bridge',
      },
      {
        id: 'step_2_pier',
        objectiveText: 'Reach the Dhanmondi Lake Waterfront Promenade to watch the sunset',
        targetPos: { x: -140, z: 70, radius: 18 },
        targetDescription: 'Dhanmondi Lake Overlook',
      },
    ],
    successDialogue: [
      {
        id: 'd1_s1',
        speaker: 'Mia',
        text: 'Look at the Dhaka skyline reflecting on the lake, Leo... It is like the whole city is burning in gold and pink.',
        duration: 4,
        color: '#f43f5e',
      },
      {
        id: 'd1_s2',
        speaker: 'Leo',
        text: 'Nothing burns brighter than you, Mia. Soon, all of Dhaka will be ours.',
        duration: 4,
        color: '#38bdf8',
      },
    ],
  },
  {
    id: 'm2_vangelico_diamonds',
    number: 2,
    title: 'The Motijheel Vault',
    subtitle: 'Bangladesh Bank Diamond Score',
    description: 'Pull off the high-stakes heist at Bangladesh Bank in the Motijheel financial district near Shapla Chattar. Grab the vault cache, secure ৳5,000,000, and evade the Dhaka Metropolitan Police (DMP) dragnet.',
    rewardCash: 5000000, // ৳ 50,00,000 BDT
    rewardLove: 20,
    initialWanted: 0,
    startDialogue: [
      {
        id: 'd2_1',
        speaker: 'Mia',
        text: 'Here we go, partner. Bangladesh Bank is right past the Shapla Chattar roundabout.',
        duration: 4,
        color: '#f43f5e',
      },
      {
        id: 'd2_2',
        speaker: 'Leo',
        text: 'Two minutes inside the vault, grab the diamonds and bearer bonds, back in the Dominator.',
        duration: 3.5,
        color: '#38bdf8',
      },
      {
        id: 'd2_3',
        speaker: 'Mia',
        text: 'If DMP cruisers block the avenue, I have got the SMG ready. We ride or die together.',
        duration: 3.5,
        color: '#f43f5e',
      },
    ],
    steps: [
      {
        id: 'step_2_heist',
        objectiveText: 'Drive to Bangladesh Bank in Motijheel Financial District',
        targetPos: { x: 35, z: -35, radius: 20 },
        targetDescription: 'Bangladesh Bank Vault Entrance',
      },
      {
        id: 'step_2_escape',
        objectiveText: 'Evade the 3-Star DMP Police Dragnet and bring Mia back to the Gulshan Safehouse',
        targetPos: { x: -35, z: 35, radius: 18 },
        targetDescription: 'Gulshan Safehouse Garage',
      },
    ],
    successDialogue: [
      {
        id: 'd2_s1',
        speaker: 'Mia',
        text: 'YES! Five million Taka in uncut gems! You swerved through that Dhaka gridlock like a legend!',
        duration: 4,
        color: '#f43f5e',
      },
      {
        id: 'd2_s2',
        speaker: 'Leo',
        text: 'I kept one eye on the mirror and one hand on you. In this city, we are untouchable.',
        duration: 4,
        color: '#38bdf8',
      },
    ],
  },
  {
    id: 'm3_highway_heaven',
    number: 3,
    title: 'Hatirjheel Expressway Chase',
    subtitle: '5-Star Full Throttle Pursuit',
    description: 'Special Branch & DMP task forces tracked the heist diamonds to your district. Punch through the Gulshan roadblock, hit the Hatirjheel Expressway at 200 km/h, and shake off the interceptors!',
    rewardCash: 2500000,
    rewardLove: 25,
    initialWanted: 4,
    startDialogue: [
      {
        id: 'd3_1',
        speaker: 'Dispatch',
        text: 'All DMP units, 10-99 code 3! Red suspect vehicle sighted heading toward Hatirjheel Link Road!',
        duration: 3.5,
        color: '#eab308',
      },
      {
        id: 'd3_2',
        speaker: 'Mia',
        text: 'Leo, they found us! Cruisers at both ends of the avenue! FLOOR IT!',
        duration: 3.5,
        color: '#f43f5e',
      },
      {
        id: 'd3_3',
        speaker: 'Leo',
        text: 'Hold on tight, baby! Hitting nitro past the CNGs!',
        duration: 3.2,
        color: '#38bdf8',
      },
    ],
    steps: [
      {
        id: 'step_3_freeway',
        objectiveText: 'Punch through the Roadblock and hit the Southern Elevated Expressway',
        targetPos: { x: 0, z: 220, radius: 25 },
        targetDescription: 'Southern Expressway Fast Lane',
      },
      {
        id: 'step_3_hills',
        objectiveText: 'Lose the Interceptors in the northern Lalbagh historic corridors',
        targetPos: { x: 0, z: -140, radius: 22 },
        targetDescription: 'North Historic Pass',
      },
    ],
    successDialogue: [
      {
        id: 'd3_s1',
        speaker: 'Mia',
        text: 'My heart is pounding through my chest... Leo, I have never felt this alive in Dhaka.',
        duration: 4,
        color: '#f43f5e',
      },
      {
        id: 'd3_s2',
        speaker: 'Leo',
        text: 'That is what happens when you conquer Dhaka with the girl of your dreams.',
        duration: 4,
        color: '#38bdf8',
      },
    ],
  },
  {
    id: 'm4_vinewood_sunset',
    number: 4,
    title: 'Sunset at Lalbagh Fort',
    subtitle: 'The Puran Dhaka Grand Finale',
    description: 'With the millions in diamonds secured and the police evaded, drive Mia up to the historic Lalbagh Fort overlooking Old Dhaka and the Buriganga River. The moment of truth has arrived.',
    rewardCash: 10000000, // ৳ 1,00,00,000 BDT
    rewardLove: 30,
    initialWanted: 0,
    startDialogue: [
      {
        id: 'd4_1',
        speaker: 'Mia',
        text: 'Where are we heading, Leo? Hazrat Shahjalal International Airport is to the north...',
        duration: 3.5,
        color: '#f43f5e',
      },
      {
        id: 'd4_2',
        speaker: 'Leo',
        text: 'One last stop first. The historic heights of Lalbagh Fort.',
        duration: 3.5,
        color: '#38bdf8',
      },
      {
        id: 'd4_3',
        speaker: 'Mia',
        text: 'Lalbagh Fort... Under the Mughal domes where we made our very first promise.',
        duration: 3.5,
        color: '#f43f5e',
      },
    ],
    steps: [
      {
        id: 'step_4_summit',
        objectiveText: 'Drive Mia up to the Lalbagh Fort Grand Ramparts',
        targetPos: { x: 0, z: -260, radius: 24 },
        targetDescription: 'Lalbagh Fort Ramparts Lookout',
      },
    ],
    successDialogue: [
      {
        id: 'd4_s1',
        speaker: 'Leo',
        text: 'Mia... Look at the lights of Dhaka down there. They tried to stop us, but we conquered this city.',
        duration: 4.5,
        color: '#38bdf8',
      },
      {
        id: 'd4_s2',
        speaker: 'Mia',
        text: 'Leo... Pulling off the biggest heist was easy. Falling for you was the real jackpot.',
        duration: 4.5,
        color: '#f43f5e',
      },
    ],
  },
];
