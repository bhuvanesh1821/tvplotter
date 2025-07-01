type MarketSession = {
    SH: number; // Start hour
    SM: number; // Start minute
    EH: number; // End hour
    EM: number; // End minute
};

type MarketCalendar = {
    [key: string]: MarketSession[];
};

/**
 * Returns whether the given timestamp + addMinutes is plottable,
 * and if not, returns the next plottable timestamp based on the market calendar.
 *
 * @param timestamp - Input timestamp in ms
 * @param addMinutes - Minutes to add to the timestamp
 * @param marketCalendar - Market calendar defining sessions per day
 * @returns Object with isPlottable and nextPlottableTimestamp (in ms)
 */
function getNextPlottableTimestamp(
    timestamp: number,
    addMinutes: number,
    marketCalendar: MarketCalendar
): { isPlottable: boolean; nextPlottableTimestamp: number | null } {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    // Calculate new date after adding minutes
    const date = new Date(timestamp + addMinutes * 60 * 1000);
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();

    const maxDaysToCheck = 7; // Prevent infinite loops in edge cases

    // Check today and next 6 days
    for (let i = 0; i < maxDaysToCheck; i++) {
        const currentCheckDate = new Date(date);
        currentCheckDate.setUTCDate(date.getUTCDate() + i);

        const currentDayIndex = currentCheckDate.getUTCDay();
        const dayName = dayNames[currentDayIndex];
        const sessions = marketCalendar[dayName];

        // If sessions exist for the day
        if (sessions && sessions.length > 0) {
            for (const session of sessions) {
                const sessionStart = session.SH * 60 + session.SM;
                const sessionEnd = session.EH * 60 + session.EM;

                if (i === 0) {
                    // Check current time only for the first day
                    const currentTime = hour * 60 + minute;

                    if (currentTime >= sessionStart && currentTime <= sessionEnd) {
                        // Current time is within session
                        return {
                            isPlottable: true,
                            nextPlottableTimestamp: currentCheckDate.getTime(),
                        };
                    }
                }

                if (i > 0) {
                    // For future days, return first session start time
                    currentCheckDate.setUTCHours(session.SH, session.SM, 0, 0);
                    return {
                        isPlottable: false,
                        nextPlottableTimestamp: currentCheckDate.getTime(),
                    };
                }
            }
        }
    }

    // If no plottable time found within a week
    return {
        isPlottable: false,
        nextPlottableTimestamp: null,
    };
}

// ------------------ TESTING MULTIPLE TIMESTAMPS ------------------

const marketCalendar: MarketCalendar = {
    monday: [{ SH: 9, SM: 0, EH: 23, EM: 59 }],
    tuesday: [{ SH: 9, SM: 0, EH: 23, EM: 59 }],
    wednesday: [{ SH: 9, SM: 0, EH: 23, EM: 59 }],
    thursday: [{ SH: 9, SM: 0, EH: 23, EM: 59 }],
    friday: [{ SH: 9, SM: 0, EH: 23, EM: 59 }],
    saturday: [{ SH: 0, SM: 0, EH: 0, EM: 0 }],
    sunday: [{ SH: 0, SM: 0, EH: 0, EM: 0 }],
};

const timestampsWithAddMinutes = [
    {
        timestamp: new Date(Date.UTC(2025, 6, 5, 22, 0)).getTime(), // Saturday 3:30 AM IST
        addMinutes: 300, // +5 hours
    },
    {
        timestamp: new Date(Date.UTC(2025, 6, 6, 23, 0)).getTime(), // Sunday 4:30 AM IST
        addMinutes: 120, // +2 hours
    },
    {
        timestamp: new Date(Date.UTC(2025, 6, 6, 8, 30)).getTime(), // Sunday 2:00 PM IST
        addMinutes: 90, // +1.5 hours
    },
];

// Loop over each test case and print results
timestampsWithAddMinutes.forEach(({ timestamp, addMinutes }) => {
    const result = getNextPlottableTimestamp(timestamp, addMinutes, marketCalendar);

    const givenDateIST = new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const nextDateIST = result.nextPlottableTimestamp
        ? new Date(result.nextPlottableTimestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        : 'None';

    console.log('-----------------------------');
    console.log('Given timestamp (IST):', givenDateIST);
    console.log('Add minutes:', addMinutes);
    console.log('Is plottable:', result.isPlottable);
    console.log('Next plottable timestamp (IST):', nextDateIST);
});
