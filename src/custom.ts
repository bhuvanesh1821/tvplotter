export type MarketSession = {
    SH: number; // Start hour
    SM: number; // Start minute
    EH: number; // End hour
    EM: number; // End minute
};

export type MarketCalendar = {
    [key: string]: MarketSession[];
};

const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Intraday calculation.
 * Returns whether timestamp + addMinutes is plottable, else next plottable timestamp.
 */
function calcIntraday(
    timestamp: number,
    addMinutes: number,
    marketCalendar: MarketCalendar
): { isPlottable: boolean; nextPlottableTimestamp: number | null } {
    const addedDate = new Date(timestamp + addMinutes * 60 * 1000);
    const maxDaysToCheck = 7;

    for (let i = 0; i < maxDaysToCheck; i++) {
        const checkDate = new Date(addedDate);
        checkDate.setUTCDate(addedDate.getUTCDate() + i);

        const dayIndex = checkDate.getUTCDay();
        const dayName = dayNames[dayIndex];
        const sessions = marketCalendar[dayName];

        if (sessions && sessions.length > 0) {
            for (const session of sessions) {
                const sessionStartMinutes = session.SH * 60 + session.SM;
                const sessionEndMinutes = session.EH * 60 + session.EM;

                const checkTimeMinutes =
                    i === 0
                        ? checkDate.getUTCHours() * 60 + checkDate.getUTCMinutes()
                        : sessionStartMinutes;

                if (i === 0 && checkTimeMinutes >= sessionStartMinutes && checkTimeMinutes <= sessionEndMinutes) {
                    return {
                        isPlottable: true,
                        nextPlottableTimestamp: checkDate.getTime(),
                    };
                }

                if (i > 0) {
                    const nextOpenDate = new Date(checkDate);
                    nextOpenDate.setUTCHours(session.SH, session.SM, 0, 0);
                    return {
                        isPlottable: false,
                        nextPlottableTimestamp: nextOpenDate.getTime(),
                    };
                }
            }
        }
    }

    return {
        isPlottable: false,
        nextPlottableTimestamp: null,
    };
}

/**
 * Swing calculation.
 * Returns next available open timestamp from the given time onwards.
 */
function calcSwing(
    timestamp: number,
    marketCalendar: MarketCalendar
): { nextOpenTimestamp: number | null } {
    const baseDate = new Date(timestamp);
    const maxDaysToCheck = 14;

    for (let i = 0; i < maxDaysToCheck; i++) {
        const checkDate = new Date(baseDate);
        checkDate.setUTCDate(baseDate.getUTCDate() + i);

        const dayIndex = checkDate.getUTCDay();
        const dayName = dayNames[dayIndex];
        const sessions = marketCalendar[dayName];

        if (sessions && sessions.length > 0) {
            for (const session of sessions) {
                const sessionStartDate = new Date(checkDate);
                sessionStartDate.setUTCHours(session.SH, session.SM, 0, 0);

                if (sessionStartDate.getTime() >= timestamp) {
                    return {
                        nextOpenTimestamp: sessionStartDate.getTime(),
                    };
                }
            }
        }
    }

    return {
        nextOpenTimestamp: null,
    };
}

// ------------------ TESTING INTRADAY & SWING FUNCTION ------------------

const marketCalendar: MarketCalendar = {
    monday: [{ SH: 9, SM: 0, EH: 23, EM: 59 }],
    tuesday: [{ SH: 9, SM: 0, EH: 23, EM: 59 }],
    wednesday: [{ SH: 9, SM: 0, EH: 23, EM: 59 }],
    thursday: [{ SH: 9, SM: 0, EH: 23, EM: 59 }],
    friday: [{ SH: 9, SM: 0, EH: 23, EM: 59 }],
    saturday: [],
    sunday: [],
};

// Calculate start time at the beginning of the current hour
const now = new Date();
const startHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
const startTimestamp = startHour.getTime();
const endTimestamp = startTimestamp + 7 * 24 * 60 * 60 * 1000; // 1 week later
// Create an array of timestamps for every hour between start and end
const timestamps: number[] = [];
let currentTimestamp = startTimestamp;
while (currentTimestamp <= endTimestamp) {
    timestamps.push(currentTimestamp);
    // Add 1 hour (in milliseconds)
    currentTimestamp += 60 * 60 * 1000;
}

// ------------------ RUNNING TESTS ------------------

timestamps.forEach((timestamp) => {
    const addMinutes = 90; // Example: add 90 mins to test intraday

    const intraResult = calcIntraday(timestamp, addMinutes, marketCalendar);
    const swingResult = calcSwing(timestamp, marketCalendar);

    const givenDateIST = new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const nextIntraIST = intraResult.nextPlottableTimestamp
        ? new Date(intraResult.nextPlottableTimestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        : 'None';

    const nextSwingIST = swingResult.nextOpenTimestamp
        ? new Date(swingResult.nextOpenTimestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        : 'None';

    console.log('==============================');
    console.log('Timestamp (IST):', givenDateIST);
    console.log('Add minutes:', addMinutes);
    console.log('Intraday - isPlottable:', intraResult.isPlottable);
    console.log('Intraday - next plottable timestamp (IST):', nextIntraIST);
    console.log('Swing - next open timestamp (IST):', nextSwingIST);
});
