import * as DateFNS from 'date-fns';

export class ForecastPlottingService {
    constructor() {}

    getAvailableTimestampToPlot(inTime: number, addMinutes: number, marketCalendar: any): number {
        var calcCalendar: { [key: string]: any[] } = {};
        var holidayCalendar: { [key: string]: boolean } = {};
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        function calculateMinutesAndHoliday(calendarRow: any): any {
            let calcRow = { SMT: 0, EMT: 0, H: false };
            if (Object.keys(calendarRow).length !== 0) {
                calcRow.SMT = calendarRow.SH * 60 + calendarRow.SM;
                calcRow.EMT = calendarRow.EH * 60 + calendarRow.EM;
            }
            return calcRow;
        }

        function calculateIntradayTime(): number {
            let remainingMinutes = addMinutes;
            const weekDay = days[inDateTime.getUTCDay()];
            let index = days.findIndex(function (item, i) {
                return item === weekDay;
            });
            let counter: number = 0;
            let startMinutes = inMinutes;

            do {
                let calDayArray = calcCalendar[days[index]];
                if (!Array.isArray(calDayArray)) continue;
                for (const calendarRow of calDayArray) {
                    let minutesAdded = 0;
                    if (startMinutes < calendarRow.SMT) {
                        startMinutes = calendarRow.SMT;
                    }
                    if (startMinutes + remainingMinutes <= calendarRow.EMT) {
                        minutesAdded = remainingMinutes;
                        remainingMinutes = 0;
                    } else if (startMinutes <= calendarRow.EMT) {
                        minutesAdded = calendarRow.EMT - startMinutes;
                        remainingMinutes = remainingMinutes - minutesAdded;
                    } else {
                        //
                    }
                    if (remainingMinutes === 0) {
                        // Removing one excess minute added in some situations
                        let addMinutesToDay = startMinutes + minutesAdded;
                        let excessMinutes = addMinutesToDay % 15;
                        addMinutesToDay = addMinutesToDay - excessMinutes;
                        let outDateTime = DateFNS.add(inDate, { days: counter, minutes: addMinutesToDay });
                        return outDateTime.getTime() / 1000;
                    }
                }
                index = (index + 1) % days.length;
                counter++;
                startMinutes = 0; // New day starts at 0
            } while (counter < days.length);
            return inTime; // Should never reach here. If any error, we go with inTime as outTime
        }

        function calculateSwingTime(): number {
            let startDateTime = DateFNS.add(inDateTime, { minutes: addMinutes });
            let startMinutes = startDateTime.getUTCHours() * 60 + startDateTime.getUTCMinutes();
            const startDate = DateFNS.sub(startDateTime, { minutes: startMinutes });
            const inWeekDay = days[inDateTime.getUTCDay()];
            const startWeekDay = days[startDateTime.getUTCDay()];
            let inIndex = days.findIndex(function (item, i) {
                return item === inWeekDay;
            });
            let startIndex = days.findIndex(function (item, i) {
                return item === startWeekDay;
            });

            // Count the holidays between inDateTime & startDateTime
            let holidayCounter: number = 0;

            do {
                let isHoliday = holidayCalendar[days[inIndex]];
                if (isHoliday) {
                    startIndex = (startIndex + 1) % days.length;
                    holidayCounter++;
                }
                inIndex = (inIndex + 1) % days.length;
            } while (inIndex != startIndex);

            let counter: number = holidayCounter;

            // If the resulting date falls on a holiday or out of business hours calculate next day
            do {
                let calDayArray = calcCalendar[days[startIndex]];
                let isHoliday = holidayCalendar[days[startIndex]];
                for (const calendarRow of calDayArray) {
                    if (isHoliday) continue;
                    if (startMinutes < calendarRow.SMT) {
                        startMinutes = calendarRow.SMT;
                    }
                    if (startMinutes <= calendarRow.EMT) {
                        let outDateTime = DateFNS.add(startDate, { days: counter, minutes: startMinutes });
                        return outDateTime.getTime() / 1000;
                    } else {
                        startMinutes = 0;
                    }
                }
                startIndex = (startIndex + 1) % days.length;
                counter++;
            } while (counter < days.length);
            return inTime; // Should never reach here. If any error, we go with inTime as outTime
        }

        // Calculate calendar parameters
        for (let [dayOfWeek, calendarPerDay] of Object.entries(marketCalendar)) {
            let calcDayCalendar: any = [];
            let isHoliday = false;

            if (Array.isArray(calendarPerDay)) {
                let minutesInDay = 0;
                for (const calendarDayRow of calendarPerDay) {
                    let calculatedRow = calculateMinutesAndHoliday(calendarDayRow);
                    minutesInDay += calculatedRow.EMT - calculatedRow.SMT;
                    calcDayCalendar.push(calculatedRow);
                }
                // Assumption 1: If a day contains less than 4 working hours, it is a holiday
                if (minutesInDay < 240) {
                    isHoliday = true;
                }
            } else {
                let calculatedRow = calculateMinutesAndHoliday(calendarPerDay);
                let minutesInDay = calculatedRow.EMT - calculatedRow.SMT;
                if (minutesInDay < 240) {
                    isHoliday = true;
                }
                calcDayCalendar.push(calculatedRow);
            }
            calcCalendar[dayOfWeek] = calcDayCalendar;
            holidayCalendar[dayOfWeek] = isHoliday;
        }

        const inDateTime = new Date(inTime * 1000);
        const inMinutes = inDateTime.getUTCHours() * 60 + inDateTime.getUTCMinutes();
        const inDate = DateFNS.sub(inDateTime, { minutes: inMinutes });

        /* Assumption 2: If addMinutes is less 240 (4 hours), it is `intraday` else `swing`
         * For intraday, we only add business hours (minutes) to the starting time.
         * For swing, we add given minutes to starting time then do business hour check.
         */

        if (addMinutes <= 1000) {
            return calculateIntradayTime();
        } else {
            return calculateSwingTime();
        }
    }
}
