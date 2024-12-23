import { Crypto } from "@peculiar/webcrypto";
import * as core from "@peculiarventures/pdf-core";
import { Command } from "commander";
import * as pkijs from "pkijs";

import * as commands from "./commands";

const program = new Command("pdf");

pkijs.setEngine(
  "pdf",
  new core.PDFCryptoEngine({
    name: "pdf",
    crypto: new Crypto()
  })
);
program.addCommand(commands.info);

program.parse();
