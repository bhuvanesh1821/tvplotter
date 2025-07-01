import { ForecastPlottingService } from "./services/forecast-plotting.service";
import * as fs from "fs";
import * as path from "path";

const forecastPlottingService = new ForecastPlottingService();

function checkAvailableTimeAndSaveCSV() {
    const marketCalendar = {
        monday: [{ SH: 0, SM: 0, EH: 23, EM: 59 }],
        tuesday: [{ SH: 0, SM: 0, EH: 23, EM: 59 }],
        wednesday: [{ SH: 0, SM: 0, EH: 23, EM: 59 }],
        thursday: [{ SH: 0, SM: 0, EH: 23, EM: 59 }],
        friday: [{ SH: 0, SM: 0, EH: 23, EM: 59 }],
        saturday: [{ SH: 0, SM: 0, EH: 23, EM: 59 }],
        sunday: [{ SH: 0, SM: 0, EH: 23, EM: 59 }],
    };

    const timestamps = [
        Date.now(), // current timestamp
        Date.now() + 60 * 60 * 1000, // +1 hour
        Date.now() + 24 * 60 * 60 * 1000, // +1 day
    ];

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
    const outputPath = path.join(__dirname, "assets", "market_status.csv");

    // Ensure assets folder exists
    if (!fs.existsSync(path.dirname(outputPath))) {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    }

    // Write to file
    fs.writeFileSync(outputPath, csvContent);

    console.log(`CSV file saved at ${outputPath}`);
}

checkAvailableTimeAndSaveCSV();
