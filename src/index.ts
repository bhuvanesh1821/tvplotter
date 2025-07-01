import { ForecastPlottingService } from "./services/forecast-plotting.service";
import * as fs from "fs";
import * as path from "path";

const forecastPlottingService = new ForecastPlottingService();

function checkAvailableTimeAndSaveCSV() {
    const marketCalendar = {
        monday: [{ SH: 9, SM: 0, EH: 23, EM: 59 }],
        tuesday: [{ SH: 9, SM: 0, EH: 23, EM: 59 }],
        wednesday: [{ SH: 9, SM: 0, EH: 23, EM: 59 }],
        thursday: [{ SH: 9, SM: 0, EH: 23, EM: 59 }],
        friday: [{ SH: 9, SM: 0, EH: 23, EM: 59 }],
        saturday: [{ SH: 0, SM: 0, EH: 0, EM: 0 }],
        sunday: [{ SH: 0, SM: 0, EH: 0, EM: 0 }],
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

    const results: any[] = [];

    timestamps.forEach((timestamp) => {
        const nextOpenTime = forecastPlottingService.getAvailableTimestampToPlot(timestamp / 1000, 0, marketCalendar) * 1000;
        const isMarketOpen = nextOpenTime === timestamp || nextOpenTime - timestamp <= 60000;

        results.push({
            given_open_time: new Date(timestamp).toISOString(),
            next_open_time: new Date(nextOpenTime).toISOString(),
            market_status: isMarketOpen ? "OPEN" : "CLOSED",
        });
    });

    // Convert results to CSV format
    const csvHeader = "given_open_time,next_open_time,market_status\n";
    const csvRows = results.map(row => `${row.given_open_time},${row.next_open_time},${row.market_status}`).join("\n");
    const csvContent = csvHeader + csvRows;

    // Define output path
    const timestampStr = Date.now().toString();
    const outputPath = path.join(__dirname, "assets", `market_status_${timestampStr}.csv`);

    // Ensure assets folder exists
    if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }

    // Write to file
    fs.writeFileSync(outputPath, csvContent);

    console.log(`CSV file saved at ${outputPath}`);
}

checkAvailableTimeAndSaveCSV();
