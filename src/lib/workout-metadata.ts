import type { WorkoutMetadata, ScoreType } from "@/types";

/**
 * Workout metadata for CrossFit Open years.
 * This is critical for correct score parsing and percentile calculation.
 */

export const WORKOUT_METADATA: Record<number, WorkoutMetadata[]> = {
  2015: [
    {
      ordinal: 1,
      name: "15.1",
      scoreType: "reps",
      timeCapSeconds: 9 * 60, // 9 minutes
      sortDirection: "desc", // More reps is better
      repsPerRound: 30, // 15 T2B + 10 DL + 5 snatches
      description: "AMRAP 9min: 15 T2B, 10 deadlifts, 5 snatches (115/75 lb)",
      detailedDescription:
        "Complete as many rounds and reps as possible in 9 minutes of:\n15 toes-to-bars\n10 deadlifts (115/75 lb)\n5 snatches (115/75 lb)",
      scorecardPdf: "/scorecards/2015/15.1.pdf",
    },
    {
      ordinal: 2,
      name: "15.1a",
      scoreType: "load",
      timeCapSeconds: 6 * 60, // 6 minutes (9:00-15:00, immediately after 15.1)
      sortDirection: "desc", // Higher load is better
      description: "1RM clean & jerk (6 min, immediately after 15.1)",
      detailedDescription:
        "1-rep-max clean and jerk\n6-minute time cap\n\nNote: Begins immediately after 15.1 at the 9:00 mark. Same barbell must be used for both workouts.",
      scorecardPdf: "/scorecards/2015/15.1.pdf",
    },
    {
      ordinal: 3,
      name: "15.2",
      scoreType: "reps",
      sortDirection: "desc", // More reps is better
      description:
        "E3MOM: 2 rounds OHS + C2B pull-ups, starting at 10 reps, +2 each segment until failure",
      detailedDescription:
        "Every 3 minutes for as long as possible complete:\n\nFrom 0:00-3:00: 2 rounds of 10 overhead squats (95/65 lb) + 10 chest-to-bar pull-ups\nFrom 3:00-6:00: 2 rounds of 12 overhead squats + 12 chest-to-bar pull-ups\nFrom 6:00-9:00: 2 rounds of 14 overhead squats + 14 chest-to-bar pull-ups\n\nContinue adding 2 reps each segment until you fail to complete 2 rounds within the 3-minute window.",
      scorecardPdf: "/scorecards/2015/15.2.pdf",
    },
    {
      ordinal: 4,
      name: "15.3",
      scoreType: "reps",
      timeCapSeconds: 14 * 60, // 14 minutes
      sortDirection: "desc", // More reps is better
      repsPerRound: 157, // 7 MU + 50 WB + 100 DU
      tiebreak: {
        atReps: 157, // Time after each set of double-unders
        description: "Time after completing each set of double-unders",
      },
      description:
        "AMRAP 14min: 7 muscle-ups, 50 wall-ball shots, 100 double-unders",
      detailedDescription:
        "Complete as many rounds and reps as possible in 14 minutes of:\n7 muscle-ups\n50 wall-ball shots\n100 double-unders\n\nMen use 20-lb ball to 10-ft target\nWomen use 14-lb ball to 9-ft target",
      scorecardPdf: "/scorecards/2015/15.3.pdf",
    },
    {
      ordinal: 5,
      name: "15.4",
      scoreType: "reps",
      timeCapSeconds: 8 * 60, // 8 minutes
      sortDirection: "desc", // More reps is better
      tiebreak: {
        atReps: 27, // Time after every third set of cleans (27, 90, 189)
        description: "Time after every third set of cleans",
      },
      description:
        "AMRAP 8min: escalating HSPU (3-6-9-12...) + cleans (3-3-3-6-6-6-9...)",
      detailedDescription:
        "Complete as many reps as possible in 8 minutes of:\n3 handstand push-ups, 3 cleans\n6 handstand push-ups, 3 cleans\n9 handstand push-ups, 3 cleans\n12 handstand push-ups, 6 cleans\n15 handstand push-ups, 6 cleans\n18 handstand push-ups, 6 cleans\n21 handstand push-ups, 9 cleans\n...etc.\n\nAdd 3 reps to HSPU each round, add 3 reps to cleans every 3 rounds.\n\nMen clean 185 lb\nWomen clean 125 lb",
      scorecardPdf: "/scorecards/2015/15.4.pdf",
    },
    {
      ordinal: 6,
      name: "15.5",
      scoreType: "time", // For time, no cap
      totalReps: 144, // 72 cal row + 72 thrusters
      sortDirection: "asc", // Lower time is better
      description: "27-21-15-9: row (cal) + thrusters (95/65 lb)",
      detailedDescription:
        "27-21-15-9 reps for time of:\nRow (calories)\nThrusters\n\nMen use 95 lb\nWomen use 65 lb\n\nNo time cap. Score is time to complete all 144 reps.",
      scorecardPdf: "/scorecards/2015/15.5.pdf",
    },
  ],
  2016: [
    {
      ordinal: 1,
      name: "16.1",
      scoreType: "reps",
      timeCapSeconds: 20 * 60, // 20 minutes
      sortDirection: "desc", // More reps is better
      repsPerRound: 26, // 5 lunges + 8 burpees + 5 lunges + 8 C2B
      description:
        "AMRAP 20min: 25ft OH lunge, 8 burpees, 25ft OH lunge, 8 C2B pull-ups",
      detailedDescription:
        "Complete as many rounds and reps as possible in 20 minutes of:\n25-ft overhead walking lunge\n8 burpees\n25-ft overhead walking lunge\n8 chest-to-bar pull-ups\n\nMen lunge 95 lb\nWomen lunge 65 lb",
      scorecardPdf: "/scorecards/2016/16.1.pdf",
    },
    {
      ordinal: 2,
      name: "16.2",
      scoreType: "time", // Finishers get time
      cappedScoreType: "reps", // Capped athletes get reps
      timeCapSeconds: 20 * 60, // 20 minutes max (cascading 4→8→12→16→20)
      totalReps: 430, // 90+88+86+84+82 across 5 rounds
      sortDirection: "asc", // Lower time is better (finishers first)
      tiebreak: {
        atReps: 75, // Time after each set of double-unders (75, 163, 249, 333, 423 or 430)
        description: "Time after completing each set of double-unders",
      },
      description:
        "Cascading time cap: T2B, DU, squat cleans (increasing weight, 4→8→12→16→20 min)",
      detailedDescription:
        "Beginning on a 4-minute clock, complete as many reps as possible of:\n25 toes-to-bars\n50 double-unders\n15 squat cleans (135/85 lb)\n\nIf completed before 4 min, add 4 min to clock and proceed to:\n25 T2B, 50 DU, 13 squat cleans (185/115 lb)\n\nIf completed before 8 min, proceed to:\n25 T2B, 50 DU, 11 squat cleans (225/145 lb)\n\nIf completed before 12 min, proceed to:\n25 T2B, 50 DU, 9 squat cleans (275/175 lb)\n\nIf completed before 16 min, proceed to:\n25 T2B, 50 DU, 7 squat cleans (315/205 lb)\n\nStop at 20 minutes.",
      scorecardPdf: "/scorecards/2016/16.2.pdf",
    },
    {
      ordinal: 3,
      name: "16.3",
      scoreType: "reps",
      timeCapSeconds: 7 * 60, // 7 minutes
      sortDirection: "desc", // More reps is better
      repsPerRound: 13, // 10 power snatches + 3 bar MU
      tiebreak: {
        atReps: 13, // Time after completing each round
        description: "Time after completing each round",
      },
      description: "AMRAP 7min: 10 power snatches, 3 bar muscle-ups",
      detailedDescription:
        "Complete as many rounds and reps as possible in 7 minutes of:\n10 power snatches\n3 bar muscle-ups\n\nMen use 75 lb\nWomen use 55 lb\n\nTiebreak: Time at completion of each round.",
      scorecardPdf: "/scorecards/2016/16.3.pdf",
    },
    {
      ordinal: 4,
      name: "16.4",
      scoreType: "reps",
      timeCapSeconds: 13 * 60, // 13 minutes
      sortDirection: "desc", // More reps is better
      repsPerRound: 220, // 55+55+55+55
      tiebreak: {
        atReps: 165, // Time after completing 55-cal row
        description: "Time after completing 55-cal row",
      },
      description: "AMRAP 13min: 55 DL, 55 WB, 55-cal row, 55 HSPU",
      detailedDescription:
        "Complete as many rounds and reps as possible in 13 minutes of:\n55 deadlifts\n55 wall-ball shots\n55-calorie row\n55 handstand push-ups\n\nMen deadlift 225 lb and throw 20-lb ball to 10-ft target\nWomen deadlift 155 lb and throw 14-lb ball to 9-ft target\n\nTiebreak: Time at completion of 55-cal row.",
      scorecardPdf: "/scorecards/2016/16.4.pdf",
    },
    {
      ordinal: 5,
      name: "16.5",
      scoreType: "time", // For time, no cap
      totalReps: 168, // (21+18+15+12+9+6+3) × 2
      sortDirection: "asc", // Lower time is better
      description: "21-18-15-12-9-6-3: thrusters + bar-facing burpees",
      detailedDescription:
        "21-18-15-12-9-6-3 reps for time of:\nThrusters\nBar-facing burpees\n\nMen use 95 lb\nWomen use 65 lb\n\nNo time cap. Total of 168 reps.",
      scorecardPdf: "/scorecards/2016/16.5.pdf",
    },
  ],
  2017: [
    {
      ordinal: 1,
      name: "17.1",
      scoreType: "time", // Finishers get time
      cappedScoreType: "reps", // Capped athletes get reps
      timeCapSeconds: 20 * 60, // 20 minutes
      totalReps: 225, // 10+15+20+15+30+15+40+15+50+15
      sortDirection: "asc", // Lower time is better (finishers first)
      tiebreak: {
        atReps: 25, // Time after each set of burpee box jump-overs (25, 60, 105, 160, 225)
        description: "Time after completing each set of burpee box jump-overs",
      },
      description:
        "For time: 10-20-30-40-50 DB snatches + 15 burpee box jump-overs between sets",
      detailedDescription:
        "For time:\n10 dumbbell snatches\n15 burpee box jump-overs\n20 dumbbell snatches\n15 burpee box jump-overs\n30 dumbbell snatches\n15 burpee box jump-overs\n40 dumbbell snatches\n15 burpee box jump-overs\n50 dumbbell snatches\n15 burpee box jump-overs\n\nMen use 50-lb dumbbell and 24-in box\nWomen use 35-lb dumbbell and 20-in box\n\nTime cap: 20 minutes",
      scorecardPdf: "/scorecards/2017/17.1.pdf",
    },
    {
      ordinal: 2,
      name: "17.2",
      scoreType: "reps",
      timeCapSeconds: 12 * 60, // 12 minutes
      sortDirection: "desc", // More reps is better
      repsPerRound: 34, // 10 lunges + 16 T2B/BMU + 8 cleans
      tiebreak: {
        atReps: 34, // Time after completing each round
        description: "Time after completing each round",
      },
      description:
        "AMRAP 12min: 50ft weighted walking lunge, 16 T2B (or bar MU), 8 power cleans",
      detailedDescription:
        "Complete as many rounds and reps as possible in 12 minutes of:\n\n2 rounds of:\n  50-ft weighted walking lunge\n  16 toes-to-bars\n  8 dumbbell power cleans\n\nThen, 2 rounds of:\n  50-ft weighted walking lunge\n  16 bar muscle-ups\n  8 dumbbell power cleans\n\nEtc., alternating between toes-to-bars and bar muscle-ups every 2 rounds.\n\nMen use 50-lb dumbbells\nWomen use 35-lb dumbbells",
      scorecardPdf: "/scorecards/2017/17.2.pdf",
    },
    {
      ordinal: 3,
      name: "17.3",
      scoreType: "time", // Finishers get time
      cappedScoreType: "reps", // Capped athletes get reps
      timeCapSeconds: 24 * 60, // 24 minutes max (cascading 8→12→16→20→24)
      totalReps: 216, // 6 sections × 36 reps
      sortDirection: "asc", // Lower time is better (finishers first)
      tiebreak: {
        atReps: 36, // Time at end of each 3-round section (36, 72, 108, 144, 180, 216)
        description: "Time after completing each 3-round section",
      },
      description:
        "Cascading time cap: C2B pull-ups + squat snatches (increasing weight, 8→12→16→20→24 min)",
      detailedDescription:
        "Prior to 8:00, complete:\n3 rounds of: 6 chest-to-bar pull-ups, 6 squat snatches (95/65 lb)\nThen, 3 rounds of: 7 chest-to-bar pull-ups, 5 squat snatches (135/95 lb)\n\n*Prior to 12:00, complete 3 rounds of:\n8 chest-to-bar pull-ups, 4 squat snatches (185/135 lb)\n\n*Prior to 16:00, complete 3 rounds of:\n9 chest-to-bar pull-ups, 3 squat snatches (225/155 lb)\n\n*Prior to 20:00, complete 3 rounds of:\n10 chest-to-bar pull-ups, 2 squat snatches (245/175 lb)\n\nPrior to 24:00, complete 3 rounds of:\n11 chest-to-bar pull-ups, 1 squat snatch (265/185 lb)\n\n*If all reps are completed, time cap extends by 4 minutes.",
      scorecardPdf: "/scorecards/2017/17.3.pdf",
    },
    {
      ordinal: 4,
      name: "17.4",
      scoreType: "reps",
      timeCapSeconds: 13 * 60, // 13 minutes
      sortDirection: "desc", // More reps is better
      repsPerRound: 220, // 55+55+55+55
      tiebreak: {
        atReps: 55, // Time after completing each set of 55
        description:
          "Time after completing each set of 55 (deadlifts, wall-balls, row, HSPU)",
      },
      description: "AMRAP 13min: 55 DL, 55 WB, 55-cal row, 55 HSPU",
      detailedDescription:
        "Complete as many rounds and reps as possible in 13 minutes of:\n55 deadlifts\n55 wall-ball shots\n55-calorie row\n55 handstand push-ups\n\nMen deadlift 225 lb and throw 20-lb ball to 10-ft target\nWomen deadlift 155 lb and throw 14-lb ball to 9-ft target\n\nTiebreak: Time at completion of each set of 55.",
      scorecardPdf: "/scorecards/2017/17.4.pdf",
    },
    {
      ordinal: 5,
      name: "17.5",
      scoreType: "time", // Finishers get time
      cappedScoreType: "reps", // Capped athletes get reps
      timeCapSeconds: 40 * 60, // 40 minutes
      totalReps: 440, // 10 rounds × (9+35)
      sortDirection: "asc", // Lower time is better (finishers first)
      description: "10 rounds for time: 9 thrusters, 35 double-unders",
      detailedDescription:
        "10 rounds for time of:\n9 thrusters\n35 double-unders\n\nMen use 95 lb\nWomen use 65 lb\n\nTime cap: 40 minutes",
      scorecardPdf: "/scorecards/2017/17.5.pdf",
    },
  ],
  2018: [
    {
      ordinal: 1,
      name: "18.1",
      scoreType: "reps",
      timeCapSeconds: 20 * 60, // 20 minutes
      sortDirection: "desc", // More reps is better
      repsPerRound: 32, // 8 T2B + 10 DB hang C&J + 14 cal row (men); 30 for women
      description: "AMRAP 20min: 8 T2B, 10 DB hang clean & jerk, 14/12-cal row",
      detailedDescription:
        "Complete as many rounds as possible in 20 minutes of:\n8 toes-to-bars\n10 dumbbell hang clean and jerks (5 each arm)\n14/12-calorie row (men/women)\n\nMen use 50-lb dumbbell\nWomen use 35-lb dumbbell",
      scorecardPdf: "/scorecards/2018/18.1.pdf",
    },
    {
      ordinal: 2,
      name: "18.2",
      scoreType: "time", // Finishers get time
      cappedScoreType: "reps", // Capped athletes get reps
      timeCapSeconds: 12 * 60, // 12 minutes (for both 18.2 and 18.2a)
      totalReps: 110, // 1-10 squats + 1-10 burpees = 55+55
      sortDirection: "asc", // Lower time is better (finishers first)
      description: "1-2-3-4-5-6-7-8-9-10: DB squats + bar-facing burpees",
      detailedDescription:
        "1-2-3-4-5-6-7-8-9-10 reps for time of:\nDumbbell squats\nBar-facing burpees\n\nMen use 50-lb dumbbells\nWomen use 35-lb dumbbells\n\nTime cap: 12 minutes (to complete 18.2 and 18.2a)",
      scorecardPdf: "/scorecards/2018/18.2.pdf",
    },
    {
      ordinal: 3,
      name: "18.2a",
      scoreType: "load",
      timeCapSeconds: 12 * 60, // Remaining time after 18.2
      sortDirection: "desc", // Higher load is better
      description: "1RM clean (with remaining time after 18.2)",
      detailedDescription:
        "1-rep-max clean\n\nNote: Performed with remaining time after completing 18.2. If 18.2 is not completed in under 12 minutes, athletes will not have a score for 18.2a. Tiebreak: faster 18.2 time ranks higher.",
      scorecardPdf: "/scorecards/2018/18.2.pdf",
    },
    {
      ordinal: 4,
      name: "18.3",
      scoreType: "time", // Finishers get time
      cappedScoreType: "reps", // Capped athletes get reps
      timeCapSeconds: 14 * 60, // 14 minutes
      totalReps: 928, // 464 per round × 2
      sortDirection: "asc", // Lower time is better (finishers first)
      tiebreak: {
        atReps: 100, // Time after each set of 100 double-unders
        description: "Time after completing each set of 100 double-unders",
      },
      description:
        "2 rounds: 100 DU, 20 OHS, 100 DU, 12 ring MU, 100 DU, 20 DB snatch, 100 DU, 12 bar MU",
      detailedDescription:
        "2 rounds for time of:\n100 double-unders\n20 overhead squats\n100 double-unders\n12 ring muscle-ups\n100 double-unders\n20 dumbbell snatches\n100 double-unders\n12 bar muscle-ups\n\nMen perform 115-lb OHS, 50-lb DB snatches\nWomen perform 80-lb OHS, 35-lb DB snatches\n\nTime cap: 14 minutes",
      scorecardPdf: "/scorecards/2018/18.3.pdf",
    },
    {
      ordinal: 5,
      name: "18.4",
      scoreType: "time", // Finishers get time
      cappedScoreType: "reps", // Capped athletes get reps
      timeCapSeconds: 9 * 60, // 9 minutes
      totalReps: 165, // 90 (part 1) + 75 (part 2)
      sortDirection: "asc", // Lower time is better (finishers first)
      tiebreak: {
        atReps: 21, // Time after each set of deadlifts
        description: "Time after completing each set of deadlifts",
      },
      description:
        "For time: 21-15-9 DL + HSPU; then 21-15-9 DL (heavier) + 50ft HS walk",
      detailedDescription:
        "For time:\n21 deadlifts (225/155 lb)\n21 handstand push-ups\n15 deadlifts (225/155 lb)\n15 handstand push-ups\n9 deadlifts (225/155 lb)\n9 handstand push-ups\n21 deadlifts (315/205 lb)\n50-ft handstand walk\n15 deadlifts (315/205 lb)\n50-ft handstand walk\n9 deadlifts (315/205 lb)\n50-ft handstand walk\n\nTime cap: 9 minutes\n\nHandstand walk: each 5-ft section = 1 rep",
      scorecardPdf: "/scorecards/2018/18.4.pdf",
    },
    {
      ordinal: 6,
      name: "18.5",
      scoreType: "reps",
      timeCapSeconds: 7 * 60, // 7 minutes
      sortDirection: "desc", // More reps is better
      description: "AMRAP 7min: 3-6-9-12-15-18... thrusters + C2B pull-ups",
      detailedDescription:
        "Complete as many reps as possible in 7 minutes of:\n3 thrusters\n3 chest-to-bar pull-ups\n6 thrusters\n6 chest-to-bar pull-ups\n9 thrusters\n9 chest-to-bar pull-ups\n12 thrusters\n12 chest-to-bar pull-ups\n15 thrusters\n15 chest-to-bar pull-ups\n18 thrusters\n18 chest-to-bar pull-ups\nEtc.\n\nMen use 100 lb\nWomen use 65 lb\n\nTime cap: 7 minutes",
      scorecardPdf: "/scorecards/2018/18.5.pdf",
    },
  ],
  2019: [
    {
      ordinal: 1,
      name: "19.1",
      scoreType: "reps",
      timeCapSeconds: 15 * 60, // 15 minutes
      sortDirection: "desc", // More reps is better
      repsPerRound: 38, // 19 WB + 19 cal row
      description: "AMRAP 15min: 19 wall-ball shots, 19-cal row",
      detailedDescription:
        "Complete as many rounds as possible in 15 minutes of:\n19 wall-ball shots\n19-cal. row\n\nMen throw 20-lb ball to 10-ft target\nWomen throw 14-lb ball to 9-ft target\n\nTime cap: 15 minutes\n\nNo tiebreak for this workout.",
      scorecardPdf: "/scorecards/2019/19.1.pdf",
    },
    {
      ordinal: 2,
      name: "19.2",
      scoreType: "time", // Finishers get time
      cappedScoreType: "reps", // Capped athletes get reps
      timeCapSeconds: 20 * 60, // 20 minutes max (cascading 8→12→16→20)
      totalReps: 430, // 90+88+86+84+82 across 5 rounds
      sortDirection: "asc", // Lower time is better (finishers first)
      tiebreak: {
        atReps: 75, // Time after each set of double-unders
        description: "Time after completing each set of double-unders",
      },
      description:
        "Cascading time cap: T2B, DU, squat cleans (increasing weight, 8→12→16→20 min)",
      detailedDescription:
        "Beginning on an 8-minute clock, complete as many reps as possible of:\n25 toes-to-bars\n50 double-unders\n15 squat cleans (135/85 lb)\n25 toes-to-bars\n50 double-unders\n13 squat cleans (185/115 lb)\n\nIf completed before 8 minutes, add 4 minutes to the clock and proceed to:\n25 toes-to-bars\n50 double-unders\n11 squat cleans (225/145 lb)\n\nIf completed before 12 minutes, add 4 minutes to the clock and proceed to:\n25 toes-to-bars\n50 double-unders\n9 squat cleans (275/175 lb)\n\nIf completed before 16 minutes, add 4 minutes to the clock and proceed to:\n25 toes-to-bars\n50 double-unders\n7 squat cleans (315/205 lb)\n\nStop at 20 minutes.\n\nTiebreak: Time after completing each set of double-unders.",
      scorecardPdf: "/scorecards/2019/19.2.pdf",
    },
    {
      ordinal: 3,
      name: "19.3",
      scoreType: "time", // Finishers get time
      cappedScoreType: "reps", // Capped athletes get reps
      timeCapSeconds: 10 * 60, // 10 minutes
      totalReps: 180, // 40 lunges + 50 step-ups + 50 HSPU + 40 HS walk
      sortDirection: "asc", // Lower time is better (finishers first)
      tiebreak: {
        atReps: 90, // Time after box step-ups (90) or HSPU (140)
        description: "Time after completing box step-ups or handstand push-ups",
      },
      description:
        "For time: 200ft OH lunge, 50 DB box step-ups, 50 strict HSPU, 200ft HS walk",
      detailedDescription:
        "For time:\n200-ft dumbbell overhead lunge\n50 dumbbell box step-ups\n50 strict handstand push-ups\n200-ft handstand walk\n\nMen use 50-lb dumbbell, 24-in box\nWomen use 35-lb dumbbell, 20-in box\n\nTime cap: 10 minutes\n\nTiebreaks: After final box step-up and after final handstand push-up.\n\nEach 5-ft section = 1 rep for lunges and handstand walk.",
      scorecardPdf: "/scorecards/2019/19.3.pdf",
    },
    {
      ordinal: 4,
      name: "19.4",
      scoreType: "time", // Finishers get time
      cappedScoreType: "reps", // Capped athletes get reps
      timeCapSeconds: 12 * 60, // 12 minutes (including 3 min rest)
      totalReps: 132, // 66 + 66 (3 rounds each couplet)
      sortDirection: "asc", // Lower time is better (finishers first)
      tiebreak: {
        atReps: 66, // Time after first couplet (3 rounds of snatch + BFB)
        description: "Time after completing first couplet (66 reps)",
      },
      description:
        "For time: 3 rounds snatch + BFB; 3 min rest; 3 rounds bar MU + BFB",
      detailedDescription:
        "For total time:\n3 rounds of:\n10 snatches\n12 bar-facing burpees\n\nThen, rest 3 minutes before continuing with:\n\n3 rounds of:\n10 bar muscle-ups\n12 bar-facing burpees\n\nMen snatch 95 lb\nWomen snatch 65 lb\n\nTime cap: 12 minutes (including 3-minute rest period)\n\nTiebreak: Time after completing final bar-facing burpee in first couplet.",
      scorecardPdf: "/scorecards/2019/19.4.pdf",
    },
    {
      ordinal: 5,
      name: "19.5",
      scoreType: "time", // Finishers get time
      cappedScoreType: "reps", // Capped athletes get reps
      timeCapSeconds: 20 * 60, // 20 minutes
      totalReps: 210, // 33+33+27+27+21+21+15+15+9+9
      sortDirection: "asc", // Lower time is better (finishers first)
      description: "33-27-21-15-9: thrusters + C2B pull-ups",
      detailedDescription:
        "33-27-21-15-9 reps for time of:\nThrusters\nChest-to-bar pull-ups\n\nMen use 95 lb\nWomen use 65 lb\n\nTime cap: 20 minutes\n\nNo tiebreak for this workout.",
      scorecardPdf: "/scorecards/2019/19.5.pdf",
    },
  ],
  2020: [
    {
      ordinal: 1,
      name: "20.1",
      scoreType: "time", // Finishers get time
      cappedScoreType: "reps", // Capped athletes get reps
      timeCapSeconds: 15 * 60, // 15 minutes
      totalReps: 180, // 10 rounds × (8 G2OH + 10 BFB)
      sortDirection: "asc", // Lower time is better (finishers first)
      description:
        "10 rounds for time: 8 ground-to-overheads, 10 bar-facing burpees",
      detailedDescription:
        "10 rounds for time of:\n8 ground-to-overheads\n10 bar-facing burpees\n\nMen use 95 lb\nWomen use 65 lb\n\nTime cap: 15 minutes\n\nNo tiebreak for this workout.",
      scorecardPdf: "/scorecards/2020/20.1.pdf",
    },
    {
      ordinal: 2,
      name: "20.2",
      scoreType: "reps",
      timeCapSeconds: 20 * 60, // 20 minutes
      sortDirection: "desc", // More reps is better
      repsPerRound: 34, // 4 DB thrusters + 6 T2B + 24 DU
      description:
        "AMRAP 20min: 4 DB thrusters, 6 toes-to-bars, 24 double-unders",
      detailedDescription:
        "Complete as many rounds as possible in 20 minutes of:\n4 dumbbell thrusters\n6 toes-to-bars\n24 double-unders\n\nMen use 50-lb dumbbells\nWomen use 35-lb dumbbells\n\nNo tiebreak for this workout.",
      scorecardPdf: "/scorecards/2020/20.2.pdf",
    },
    {
      ordinal: 3,
      name: "20.3",
      scoreType: "time", // Finishers get time
      cappedScoreType: "reps", // Capped athletes get reps
      timeCapSeconds: 9 * 60, // 9 minutes
      totalReps: 165, // 21+21+15+15+9+9 (DL+HSPU) + 21+10+15+10+9+10 (DL+HS walk)
      sortDirection: "asc", // Lower time is better (finishers first)
      tiebreak: {
        atReps: 21, // Time after each set of deadlifts
        description: "Time after completing each set of deadlifts",
      },
      description:
        "For time: 21-15-9 DL (wt1) + HSPU; then 21-15-9 DL (wt2) + 50ft HS walk",
      detailedDescription:
        "For time:\n21 deadlifts (225/155 lb)\n21 handstand push-ups\n15 deadlifts (225/155 lb)\n15 handstand push-ups\n9 deadlifts (225/155 lb)\n9 handstand push-ups\n21 deadlifts (315/205 lb)\n50-ft handstand walk\n15 deadlifts (315/205 lb)\n50-ft handstand walk\n9 deadlifts (315/205 lb)\n50-ft handstand walk\n\nTime cap: 9 minutes\n\nEach 5-ft section of handstand walk = 1 rep.\n\nTiebreak: Time after completing each set of deadlifts.",
      scorecardPdf: "/scorecards/2020/20.3.pdf",
    },
    {
      ordinal: 4,
      name: "20.4",
      scoreType: "time", // Finishers get time
      cappedScoreType: "reps", // Capped athletes get reps
      timeCapSeconds: 20 * 60, // 20 minutes
      totalReps: 240, // 30+15+30+15+30+10+30+10+30+5+30+5
      sortDirection: "asc", // Lower time is better (finishers first)
      tiebreak: {
        atReps: 30, // Time after each set of box jumps or single-leg squats
        description:
          "Time after completing each set of box jumps or single-leg squats",
      },
      description:
        "For time: 3 rounds BJ + C&J (increasing weight); 3 rounds SLS + C&J (increasing weight)",
      detailedDescription:
        "For time:\n30 box jumps\n15 clean and jerks (95/65 lb)\n30 box jumps\n15 clean and jerks (135/85 lb)\n30 box jumps\n10 clean and jerks (185/115 lb)\n30 single-leg squats\n10 clean and jerks (225/145 lb)\n30 single-leg squats\n5 clean and jerks (275/175 lb)\n30 single-leg squats\n5 clean and jerks (315/205 lb)\n\nMen 24-in box\nWomen 20-in box\n\nTime cap: 20 minutes\n\nTiebreak: Time after each set of box jumps or single-leg squats.",
      scorecardPdf: "/scorecards/2020/20.4.pdf",
    },
    {
      ordinal: 5,
      name: "20.5",
      scoreType: "time", // Finishers get time
      cappedScoreType: "reps", // Capped athletes get reps
      timeCapSeconds: 20 * 60, // 20 minutes
      totalReps: 240, // 40 MU + 80 cal row + 120 WB
      sortDirection: "asc", // Lower time is better (finishers first)
      tiebreak: {
        atReps: 200, // Time when 80 cal row + 120 WB completed (any order)
        description:
          "Time when 80-cal row and 120 wall-ball shots are completed",
      },
      description:
        "For time, partitioned any way: 40 muscle-ups, 80-cal row, 120 wall-ball shots",
      detailedDescription:
        "For time, partitioned any way:\n40 muscle-ups\n80-cal. row\n120 wall-ball shots\n\nMen use 20-lb ball to 10-ft target\nWomen use 14-lb ball to 9-ft target\n\nTime cap: 20 minutes\n\nAthletes may perform movements in any order. Reps can be divided any way.\n\nTiebreak: Time when 80-cal row and 120 wall-ball shots are completed.",
      scorecardPdf: "/scorecards/2020/20.5.pdf",
    },
  ],
  2021: [
    {
      ordinal: 1,
      name: "21.1",
      scoreType: "time", // Finishers get time
      cappedScoreType: "reps", // Capped athletes get reps
      timeCapSeconds: 15 * 60, // 15 minutes
      totalReps: 605, // 1+10+3+30+6+60+9+90+15+150+21+210
      sortDirection: "asc", // Lower time is better (finishers first)
      tiebreak: {
        atReps: 11, // Time after each set of double-unders (11, 44, 110, 209, 374, 605)
        description: "Time after completing each set of double-unders",
      },
      description:
        "For time: 1 WW + 10 DU, 3 WW + 30 DU, 6 WW + 60 DU, 9 WW + 90 DU, 15 WW + 150 DU, 21 WW + 210 DU",
      detailedDescription:
        "For time:\n1 wall walk\n10 double-unders\n3 wall walks\n30 double-unders\n6 wall walks\n60 double-unders\n9 wall walks\n90 double-unders\n15 wall walks\n150 double-unders\n21 wall walks\n210 double-unders\n\nTime cap: 15 minutes\n\nTiebreak: Record time at end of each set of double-unders.",
      scorecardPdf: "/scorecards/2021/21.1.pdf",
    },
    {
      ordinal: 2,
      name: "21.2",
      scoreType: "time", // Finishers get time
      cappedScoreType: "reps", // Capped athletes get reps
      timeCapSeconds: 20 * 60, // 20 minutes
      totalReps: 225, // 10+15+20+15+30+15+40+15+50+15
      sortDirection: "asc", // Lower time is better (finishers first)
      tiebreak: {
        atReps: 25, // Time after each set of burpee box jump-overs (25, 60, 105, 160, 225)
        description: "Time after completing each set of burpee box jump-overs",
      },
      description:
        "17.1 repeat - For time: 10-20-30-40-50 DB snatches + 15 burpee box jump-overs between sets",
      detailedDescription:
        "Repeat of 17.1\n\nFor time:\n10 dumbbell snatches\n15 burpee box jump-overs\n20 dumbbell snatches\n15 burpee box jump-overs\n30 dumbbell snatches\n15 burpee box jump-overs\n40 dumbbell snatches\n15 burpee box jump-overs\n50 dumbbell snatches\n15 burpee box jump-overs\n\nMen use 50-lb dumbbell, 24-in box\nWomen use 35-lb dumbbell, 20-in box\n\nTime cap: 20 minutes\n\nTiebreak: Record time at end of each set of burpee box jump-overs.",
      scorecardPdf: "/scorecards/2021/21.2.pdf",
    },
    {
      ordinal: 3,
      name: "21.3",
      scoreType: "time", // Finishers get time
      cappedScoreType: "reps", // Capped athletes get reps
      timeCapSeconds: 15 * 60, // 15 minutes (includes 2 min rest)
      totalReps: 180, // 3 rounds of (15+30+15)
      sortDirection: "asc", // Lower time is better (finishers first)
      tiebreak: {
        atReps: 60, // Time after each set of thrusters (60, 120, 180)
        description: "Time after completing each set of thrusters",
      },
      description:
        "For time: 3 rounds of 15 FS, 30 pull variations, 15 thrusters (T2B→C2B→bar MU) with 1 min rest between",
      detailedDescription:
        "For total time:\n15 front squats\n30 toes-to-bars\n15 thrusters\nRest 1 min.\n15 front squats\n30 chest-to-bar pull-ups\n15 thrusters\nRest 1 min.\n15 front squats\n30 bar muscle-ups\n15 thrusters\n\n21.4 begins immediately upon completing or reaching the time cap for 21.3.\n\nMen use 95 lb\nWomen use 65 lb\n\nTime cap: 15 minutes\n\nTiebreak: Record time at end of each set of thrusters.",
      scorecardPdf: "/scorecards/2021/21.3.pdf",
    },
    {
      ordinal: 4,
      name: "21.4",
      scoreType: "load",
      timeCapSeconds: 7 * 60, // 7 minutes (starts immediately after 21.3)
      sortDirection: "desc", // Higher load is better
      description: "Max load complex: 1 deadlift, 1 clean, 1 hang clean, 1 jerk",
      detailedDescription:
        "Complete the following complex for max load:\n1 deadlift\n1 clean\n1 hang clean\n1 jerk\n\nTime begins immediately following the completion of 21.3.\n\nTime cap: 7 minutes\n\nMovements must be completed in one continuous sequence without rest or interruption. Unlimited attempts allowed within 7 minutes.\n\nScore is the heaviest weight successfully lifted (in pounds).\n\nTiebreak: In the event of a tie, 21.3 results will be used to break the tie.",
      scorecardPdf: "/scorecards/2021/21.3.pdf", // Same PDF as 21.3
    },
  ],
  2022: [
    {
      ordinal: 1,
      name: "22.1",
      scoreType: "reps",
      timeCapSeconds: 15 * 60, // 15 minutes
      sortDirection: "desc", // More reps is better
      repsPerRound: 30, // 3 wall walks + 12 DB snatches + 15 box jump-overs
      description:
        "AMRAP 15min: 3 wall walks, 12 alt DB snatches, 15 box jump-overs",
      detailedDescription:
        "Complete as many rounds as possible in 15 minutes of:\n3 wall walks\n12 dumbbell snatches (alternating)\n15 box jump-overs\n\nMen use 50-lb dumbbell, 24-in box\nWomen use 35-lb dumbbell, 20-in box\n\nTime cap: 15 minutes\n\nAthletes must step down from box (no rebounding).\n\nNo tiebreak for this workout.",
      scorecardPdf: "/scorecards/2022/22.1.pdf",
    },
    {
      ordinal: 2,
      name: "22.2",
      scoreType: "time", // Finishers get time
      cappedScoreType: "reps", // Capped athletes get reps
      timeCapSeconds: 10 * 60, // 10 minutes
      totalReps: 200, // 50+50+50+50
      sortDirection: "asc", // Lower time is better (finishers first)
      description:
        "For time: 1-2-3-4-5-6-7-8-9-10-9-8-7-6-5-4-3-2-1 deadlifts + bar-facing burpees",
      detailedDescription:
        "1-2-3-4-5-6-7-8-9-10-9-8-7-6-5-4-3-2-1 reps for time of:\nDeadlifts\nBar-facing burpees\n\nMen use 225 lb\nWomen use 155 lb\n\nTime cap: 10 minutes\n\nPyramid up from 1 to 10 reps, then back down to 1 rep.\n\nNo tiebreak for this workout.",
      scorecardPdf: "/scorecards/2022/22.2.pdf",
    },
    {
      ordinal: 3,
      name: "22.3",
      scoreType: "time", // Finishers get time
      cappedScoreType: "reps", // Capped athletes get reps
      timeCapSeconds: 12 * 60, // 12 minutes
      totalReps: 216, // 21+42+21+18+36+18+15+30+15
      sortDirection: "asc", // Lower time is better (finishers first)
      tiebreak: {
        atReps: 84, // Time after completing 21 thrusters (84 reps)
        description:
          "Time after completing 21 thrusters (84 reps) or 18 thrusters (156 reps)",
      },
      description:
        "For time: 21 PU, 42 DU, 21 thrusters; 18 C2B, 36 DU, 18 thrusters; 15 bar MU, 30 DU, 15 thrusters",
      detailedDescription:
        "For time:\n21 pull-ups\n42 double-unders\n21 thrusters (weight 1)\n18 chest-to-bar pull-ups\n36 double-unders\n18 thrusters (weight 2)\n15 bar muscle-ups\n30 double-unders\n15 thrusters (weight 3)\n\nMen use 95 lb, then 115 lb, then 135 lb\nWomen use 65 lb, then 75 lb, then 85 lb\n\nTime cap: 12 minutes\n\nTiebreak: Record time at end of 21 thrusters (84 reps) and 18 thrusters (156 reps).",
      scorecardPdf: "/scorecards/2022/22.3.pdf",
    },
  ],
  2023: [
    {
      ordinal: 1,
      name: "23.1",
      scoreType: "reps",
      timeCapSeconds: 14 * 60, // 14 minutes
      sortDirection: "desc", // More reps is better
      repsPerRound: 200, // 60+50+40+30+20
      tiebreak: {
        atReps: 180, // Time after completing cleans
        description: "Time after completing each set of cleans",
      },
      description:
        "14.4 repeat - AMRAP 14min: 60cal row, 50 T2B, 40 wall balls, 30 cleans, 20 muscle-ups",
      detailedDescription:
        "14.4 Repeat\n\nComplete as many reps as possible in 14 minutes of:\n60-calorie row\n50 toes-to-bars\n40 wall-ball shots\n30 cleans\n20 muscle-ups\n\nMen use 20-lb ball to 10-ft target, 135-lb cleans\nWomen use 14-lb ball to 9-ft target, 95-lb cleans\n\nTiebreak: Record time after completing each set of cleans.",
      scorecardPdf: "/scorecards/2023/23.1.pdf",
    },
    {
      ordinal: 2,
      name: "23.2A",
      scoreType: "reps",
      timeCapSeconds: 15 * 60, // 15 minutes
      sortDirection: "desc", // More reps is better
      description:
        "AMRAP 15min: 5 burpee pull-ups, 10 shuttle runs (+5 burpee PU each round)",
      detailedDescription:
        "Complete as many reps as possible in 15 minutes of:\n5 burpee pull-ups\n10 shuttle runs (1 rep = 50 ft)\n\n*Add 5 burpee pull-ups after each round.\n\nRound 1: 5 burpee pull-ups + 10 shuttle runs\nRound 2: 10 burpee pull-ups + 10 shuttle runs\nRound 3: 15 burpee pull-ups + 10 shuttle runs\nEtc.\n\nTime cap: 15 minutes\n\n23.2B begins immediately after.\n\nNo tiebreak for 23.2A.",
      scorecardPdf: "/scorecards/2023/23.2.pdf",
    },
    {
      ordinal: 3,
      name: "23.2B",
      scoreType: "load",
      timeCapSeconds: 5 * 60, // 5 minutes (immediately after 23.2A)
      sortDirection: "desc", // Higher load is better
      description: "1-rep max thruster from the floor",
      detailedDescription:
        "Immediately following 23.2A, athletes will have 5 minutes to establish:\n1-rep-max thruster (from the floor)\n\nTime cap: 5 minutes\n\nAthletes may make as many attempts as they'd like. Assistance loading the barbell between attempts is allowed.\n\nTiebreak: If athletes tie on weight lifted, 23.2A score will be used as tiebreak.",
      scorecardPdf: "/scorecards/2023/23.2.pdf",
    },
    {
      ordinal: 4,
      name: "23.3",
      scoreType: "time", // Finishers get time
      cappedScoreType: "reps", // Capped athletes get reps
      timeCapSeconds: 12 * 60, // 12 minutes max (starts at 6, extends to 9, then 12)
      totalReps: 292, // 5+50+15+5+50+12+20+50+9+20+50+6
      sortDirection: "asc", // Lower time is better (finishers first)
      tiebreak: {
        atReps: 70, // Time after completing each set of snatches (70, 137, 216, 292)
        description: "Time after completing each set of snatches",
      },
      description:
        "Cascading time cap: wall walks, DU, snatches, strict HSPU (6min→9min→12min)",
      detailedDescription:
        "Starting with a 6-minute time cap, complete as many reps as possible of:\n5 wall walks\n50 double-unders\n15 snatches (weight 1)\n5 wall walks\n50 double-unders\n12 snatches (weight 2)\n\n*If completed before the 6-minute time cap, add 3 minutes to the time cap and complete:\n20 strict handstand push-ups\n50 double-unders\n9 snatches (weight 3)\n\n*If completed before the 9-minute time cap, add 3 minutes to the time cap and complete:\n20 strict handstand push-ups\n50 double-unders\n6 snatches (weight 4)\n\nMen: 95 lb, 135 lb, 185 lb, 225 lb\nWomen: 65 lb, 95 lb, 125 lb, 155 lb\n\nTiebreak: Time after completing each set of snatches.",
      scorecardPdf: "/scorecards/2023/23.3.pdf",
    },
  ],
  2024: [
    {
      ordinal: 1,
      name: "24.1",
      scoreType: "time", // Finishers get time
      cappedScoreType: "reps", // Capped athletes get reps
      timeCapSeconds: 15 * 60, // 15 minutes
      totalReps: 180, // 21+21+21+21 + 15+15+15+15 + 9+9+9+9
      sortDirection: "asc", // Lower time is better (finishers first)
      tiebreak: {
        atReps: 84, // Time after completing first 21-21-21-21 (84 reps)
        description: "Time after completing 84 reps (or 144 reps)",
      },
      description: "21-15-9: DB snatches (alt arms) + lateral burpees over DB",
      detailedDescription:
        "For time:\n21 dumbbell snatches, arm 1\n21 lateral burpees over dumbbell\n21 dumbbell snatches, arm 2\n21 lateral burpees over dumbbell\n15 dumbbell snatches, arm 1\n15 lateral burpees over dumbbell\n15 dumbbell snatches, arm 2\n15 lateral burpees over dumbbell\n9 dumbbell snatches, arm 1\n9 lateral burpees over dumbbell\n9 dumbbell snatches, arm 2\n9 lateral burpees over dumbbell\n\nMen use 50-lb dumbbell\nWomen use 35-lb dumbbell\n\nTime cap: 15 minutes\n\nYou may start the rounds of 15 and 9 snatches with either arm. You may NOT switch arms in the middle of a set.\n\nTiebreak: Time after completing 84 reps (first four movements) or 144 reps (first eight movements).",
      scorecardPdf: "/scorecards/2024/24.1.pdf",
    },
    {
      ordinal: 2,
      name: "24.2",
      scoreType: "reps",
      timeCapSeconds: 20 * 60, // 20 minutes
      sortDirection: "desc", // More reps is better
      repsPerRound: 90, // 30 (row) + 10 (DL) + 50 (DU)
      description:
        "20-min AMRAP: 300m row, 10 deadlifts (185/125 lb), 50 double-unders",
      detailedDescription:
        "As many rounds and reps as possible in 20 minutes of:\n300-meter row\n10 deadlifts\n50 double-unders\n\nMen use 185 lb\nWomen use 125 lb\n\nDuring the row, 10 meters = 1 rep, rounded down.\n\nNo tiebreak for this workout.",
      scorecardPdf: "/scorecards/2024/24.2.pdf",
    },
    {
      ordinal: 3,
      name: "24.3",
      scoreType: "time", // Finishers get time
      cappedScoreType: "reps", // Capped athletes get reps
      timeCapSeconds: 15 * 60, // 15 minutes
      totalReps: 170, // Part 1: 5×(10+10)=100, Part 2: 5×(7+7)=70
      sortDirection: "asc", // Lower time is better (finishers first)
      tiebreak: {
        atReps: 100, // Time after completing Part 1 (5 rounds of thrusters + C2B)
        description: "Time after completing 100 reps (5 rounds of Part 1)",
      },
      description:
        "5 rounds: 10 thrusters + 10 C2B; rest 1 min; 5 rounds: 7 thrusters + 7 bar MU",
      detailedDescription:
        "All for time:\n5 rounds of:\n10 thrusters (weight 1)\n10 chest-to-bar pull-ups\n\nRest 1 minute, then:\n\n5 rounds of:\n7 thrusters (weight 2)\n7 bar muscle-ups\n\nMen: 95 lb, 135 lb\nWomen: 65 lb, 95 lb\n\nTime cap: 15 minutes\n\nThe timer DOES NOT STOP during the 1-minute rest. Athletes may have assistance changing the barbell load or two bars may be used.\n\nTiebreak: Time after completing 100 reps (5 rounds of thrusters and chest-to-bar pull-ups).",
      scorecardPdf: "/scorecards/2024/24.3.pdf",
    },
  ],
  2025: [
    {
      ordinal: 1,
      name: "25.1",
      scoreType: "reps",
      timeCapSeconds: 15 * 60, // 15 minutes
      sortDirection: "desc", // More reps is better
      description:
        "AMRAP 15min: 3-3-2 lateral burpees over DB, DB hang clean-to-OH, 30ft walking lunge (+3 reps each round)",
      detailedDescription:
        "As many rounds and reps as possible in 15 minutes of:\n3 lateral burpees over the dumbbell\n3 dumbbell hang clean-to-overheads\n30-foot walking lunge (2 x 15 feet)\n\n*After completing each round, add 3 reps to the burpees and hang clean-to-overheads.\n\nRound 1: 3-3-2\nRound 2: 6-6-2\nRound 3: 9-9-2\nEtc.\n\nMen use 50-lb dumbbell\nWomen use 35-lb dumbbell\n\nDuring the lunge, each 15-foot section is considered 1 rep.\n\nNo tiebreak for this workout.",
      scorecardPdf: "/scorecards/2025/25.1.pdf",
    },
    {
      ordinal: 2,
      name: "25.2",
      scoreType: "time", // Finishers get time
      cappedScoreType: "reps", // Capped athletes get reps
      timeCapSeconds: 12 * 60, // 12 minutes
      totalReps: 216, // 21+42+21+18+36+18+15+30+15
      sortDirection: "asc", // Lower time is better (finishers first)
      tiebreak: {
        atReps: 84, // Time after completing 21 thrusters (weight 1)
        description:
          "Time after completing 21 thrusters (84 reps) or 18 thrusters (156 reps)",
      },
      description:
        "For time (22.3 repeat): 21 PU, 42 DU, 21 thrusters; 18 C2B, 36 DU, 18 thrusters; 15 bar MU, 30 DU, 15 thrusters",
      detailedDescription:
        "22.3 Repeat\n\nFor time:\n21 pull-ups\n42 double-unders\n21 thrusters (weight 1)\n18 chest-to-bar pull-ups\n36 double-unders\n18 thrusters (weight 2)\n15 bar muscle-ups\n30 double-unders\n15 thrusters (weight 3)\n\nMen: 95 lb, 115 lb, 135 lb\nWomen: 65 lb, 75 lb, 85 lb\n\nTime cap: 12 minutes\n\nTiebreak: Time after completing 21 thrusters (84 reps) or 18 thrusters (156 reps).",
      scorecardPdf: "/scorecards/2025/25.2.pdf",
    },
    {
      ordinal: 3,
      name: "25.3",
      scoreType: "time", // Finishers get time
      cappedScoreType: "reps", // Capped athletes get reps
      timeCapSeconds: 20 * 60, // 20 minutes
      totalReps: 200, // 5+50+5+25+5+25+5+25+5+50
      sortDirection: "asc", // Lower time is better (finishers first)
      tiebreak: {
        atReps: 5, // Time after each set of wall walks (5, 60, 90, 120, 150)
        description: "Time after completing each set of 5 wall walks",
      },
      description:
        "For time: 5 wall walks, 50cal row, 5 WW, 25 DL, 5 WW, 25 cleans, 5 WW, 25 snatches, 5 WW, 50cal row",
      detailedDescription:
        "For time:\n5 wall walks\n50-calorie row\n5 wall walks\n25 deadlifts\n5 wall walks\n25 cleans\n5 wall walks\n25 snatches\n5 wall walks\n50-calorie row\n\nMen: 225-lb deadlift, 135-lb clean, 95-lb snatch\nWomen: 155-lb deadlift, 85-lb clean, 65-lb snatch\n\nTime cap: 20 minutes\n\nTiebreak: Time after completing each set of 5 wall walks.",
      scorecardPdf: "/scorecards/2025/25.3.pdf",
    },
  ],
};

/**
 * Get workout metadata for a specific year and ordinal
 */
export function getWorkoutMetadata(
  year: number,
  ordinal: number
): WorkoutMetadata | undefined {
  const yearWorkouts = WORKOUT_METADATA[year];
  if (!yearWorkouts) return undefined;
  return yearWorkouts.find((w) => w.ordinal === ordinal);
}

/**
 * Get all workouts for a year
 */
export function getWorkoutsForYear(year: number): WorkoutMetadata[] {
  return WORKOUT_METADATA[year] || [];
}

/**
 * Get available years
 */
export function getAvailableYears(): number[] {
  return Object.keys(WORKOUT_METADATA)
    .map(Number)
    .sort((a, b) => b - a);
}

/**
 * Infer score type from scoreDisplay string (heuristic)
 */
export function inferScoreType(scoreDisplay: string): ScoreType {
  const normalized = scoreDisplay.toLowerCase().trim();

  // Time format: contains colon (e.g., "10:29")
  if (/^\d+:\d{2}$/.test(normalized)) {
    return "time";
  }

  // Reps format: ends with "reps" (e.g., "459 reps")
  if (/\d+\s*reps?$/.test(normalized)) {
    return "reps";
  }

  // Rounds+Reps format: contains "+" (e.g., "14+8")
  if (/\d+\s*\+\s*\d+/.test(normalized)) {
    return "rounds_reps";
  }

  // Load format: ends with "lb" or "lbs" (e.g., "185 lbs")
  if (/\d+\s*(?:lbs?|kg)$/.test(normalized)) {
    return "load";
  }

  // Default to reps
  return "reps";
}
