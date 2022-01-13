import * as commands from "./commands";

import { Command } from "commander";

const program = new Command("pdf");

program.addCommand(commands.info);

program.parse();
