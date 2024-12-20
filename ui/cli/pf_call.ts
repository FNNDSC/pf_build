import { Command } from "commander";
import { call_process } from "./pf_util";

const program = new Command();

program
    .name("pf_call")
    .description("CLI for interacting with pf_build library")
    .option("--simulate", "Simulate the API call")
    .option("-X, --method <method>", "HTTP method to use", "POST")
    .option("-H, --header <header...>", "HTTP headers")
    .option("-d, --data <data>", "JSON payload as string")
    .option(
        "-u, --url <url>",
        "Full URL of the API including the 'step' query parameter",
        "http://localhost:8000/api/vi/bootstrap/?step=repoExists",
    )
    .action(async (options) => {
        try {
            const headers = options.header
                ? Object.fromEntries(
                      options.header.map((h: string) =>
                          h.split(":").map((s) => s.trim()),
                      ),
                  )
                : {};
            const data = options.data ? JSON.parse(options.data) : {};
            const response = await call_process(
                options.simulate || false,
                options.method,
                headers,
                data,
                options.url,
            );
            console.log(JSON.stringify(response, null, 2));
        } catch (error) {
            if (error instanceof Error) {
                console.error("Error:", error.message);
            } else {
                console.error("An unknown error occurred.");
            }
            process.exit(1);
        }
    });

program.parse(process.argv);
