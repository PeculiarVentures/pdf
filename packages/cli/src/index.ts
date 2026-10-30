#!/usr/bin/env node
// @peculiar/x509 3 needs a Reflect polyfill before it loads.
import "reflect-metadata";
import { Crypto } from "@peculiar/webcrypto";
import * as core from "@peculiar/pdf-core";
import { Command } from "commander";
import * as pkijs from "pkijs";

import * as commands from "./commands";

const program = new Command("pdf");

pkijs.setEngine(
  "pdf",
  new core.PDFCryptoEngine({
    name: "pdf",
    crypto: new Crypto(),
  }),
);
program.addCommand(commands.info);

program.parse();
