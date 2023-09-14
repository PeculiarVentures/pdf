import * as assert from "node:assert";
import * as fs from "node:fs";
import { Convert } from "pvtsutils";
import * as pkijs from "pkijs";
import { Crypto } from "@peculiar/webcrypto";
import { CryptoFilterMethods, PageObjectDictionary, PDFDate, PDFDocument, StandardEncryptDictionary, TrailerDictionary, UserAccessPermissionFlags, XrefStructure } from "../structure";
import { PasswordReason, StandardEncryptionHandler } from "./StandardEncryptionHandler";
import { PDFCryptoEngine } from "../CryptoEngine";
import { ViewWriter } from "../ViewWriter";
import { PDFContentStream } from "../content";
import { ViewReader } from "../ViewReader";
import { Password } from "./StandardEncryptionAlgorithms";

context("StandardEncryptionHandler", () => {

  it("test checkUserPassword", async () => {
    pkijs.setEngine("PDF", new PDFCryptoEngine({ name: "PDF", crypto: new Crypto() }));

    const doc = new PDFDocument;
    doc.update.addCatalog();
    doc.update.xref!.set("ID", doc.createArray(
      doc.createHexString(Convert.FromHex("EC0E03CF3746664B64CEF434F0E42A42")),
      doc.createHexString(Convert.FromHex("4DEFBFFF5B8678AD9931BBEE19F0E421")),
    ));
    const encrypt = StandardEncryptDictionary.create(doc).makeIndirect();
    encrypt.CF.get().set("StdCF", doc.createDictionary(
      ["AuthEvent", doc.createName("DocOpen")],
      ["CFM", doc.createName("AESV2")],
      ["Length", doc.createNumber(16)],
    ));

    encrypt.set("Filter", doc.createName("Standard"));
    encrypt.set("Length", doc.createNumber(128));
    encrypt.set("P", doc.createNumber(-4));
    encrypt.set("R", doc.createNumber(4));
    encrypt.set("StmF", doc.createName("StdCF"));
    encrypt.set("StrF", doc.createName("StdCF"));
    encrypt.set("O", doc.createHexString(Convert.FromHex("173764629E9066BEB26F0DEBC7D0A71E40D386243BC28435CC9835F7BF552943")));
    encrypt.set("U", doc.createHexString(Convert.FromHex("0D39108DA835B45179CC1B1C4B187EBA28BF4E5E4E758A4164004E56FFFA0108")));
    encrypt.set("V", doc.createNumber(4));

    doc.update.xref!.Encrypt = encrypt;

    assert.ok(doc.encryptHandler instanceof StandardEncryptionHandler);

    const ok = await doc.encryptHandler.checkUserPassword("12345");
    assert.ok(ok, "Incorrect password");
  });

  it("test Adobe", async () => {
    pkijs.setEngine("PDF", new PDFCryptoEngine({ name: "PDF", crypto: new Crypto() }));

    const doc = new PDFDocument;
    doc.update.addCatalog();
    doc.update.xref!.set("ID", doc.createArray(
      doc.createHexString(Convert.FromHex("8D966A6EA9AE43E68A5B5E262C0AFEB5")),
      doc.createHexString(Convert.FromHex("BB04B91CB5FD48D8BB4FE7AFE3A56128")),
    ));
    const encrypt = StandardEncryptDictionary.create(doc).makeIndirect();
    encrypt.CF.get().set("StdCF", doc.createDictionary(
      ["AuthEvent", doc.createName("DocOpen")],
      ["CFM", doc.createName("AESV2")],
      ["Length", doc.createNumber(16)],
    ));

    encrypt.set("Filter", doc.createName("Standard"));
    encrypt.set("Length", doc.createNumber(128));
    encrypt.set("P", doc.createNumber(-2368));
    encrypt.set("R", doc.createNumber(4));
    encrypt.set("StmF", doc.createName("StdCF"));
    encrypt.set("StrF", doc.createName("StdCF"));
    encrypt.set("O", doc.createHexString(Convert.FromHex("0eba1908e5cd53b188213637794ea65838027c93e38494b55544f4375b294c90")));
    encrypt.set("U", doc.createHexString(Convert.FromHex("c827c9f262c92199c2208ef11b54294900000000000000000000000000000000")));
    encrypt.set("V", doc.createNumber(4));

    doc.update.xref!.Encrypt = encrypt;

    assert.ok(doc.encryptHandler instanceof StandardEncryptionHandler);
    doc.encryptHandler.onUserPassword = async () => "";

    assert.ok(await doc.encryptHandler.checkUserPassword(""), "Incorrect User password");
    // assert.ok(await doc.encryptHandler.checkOwnerPassword("12345"), "Incorrect Owner password");
  });

  context("create and encrypt document", () => {
    pkijs.setEngine("PDF", new PDFCryptoEngine({ name: "PDF", crypto: new Crypto() }));

    const tests: {
      name: string;
      params: {
        file?: string;
        algorithm: CryptoFilterMethods;
        userPassword?: Password;
        ownerPassword?: Password;
        useXRefTable?: boolean;
        disableString?: boolean;
        disableStream?: boolean;
      },
    }[] = [
        {
          name: "RC4 U:<empty>",
          params: {
            file: "rc4_u",
            algorithm: CryptoFilterMethods.RC4,
          },
        },
        {
          name: "RC4 U:12345 O:54321",
          params: {
            file: "rc4_u12345_o54321",
            algorithm: CryptoFilterMethods.RC4,
            userPassword: "12345",
            ownerPassword: "54321",
          },
        },
        {
          name: "AES128 U:<empty>",
          params: {
            file: "aes128_u",
            algorithm: CryptoFilterMethods.AES128,
          },
        },
        {
          name: "AES128 U:12345 O:54321",
          params: {
            file: "aes128_u12345_o54321",
            algorithm: CryptoFilterMethods.AES128,
            userPassword: "12345",
            ownerPassword: "54321",
          },
        },
        {
          name: "AES256 U:<empty>",
          params: {
            file: "aes256_u",
            algorithm: CryptoFilterMethods.AES256,
          },
        },
        {
          name: "AES256 U:12345",
          params: {
            file: "aes256_u12345",
            algorithm: CryptoFilterMethods.AES256,
            userPassword: "12345",
            useXRefTable: true,
          },
        },
        {
          name: "AES256 U:12345, O:54321",
          params: {
            file: "aes256_u12345_o54321",
            algorithm: CryptoFilterMethods.AES256,
            userPassword: "12345",
            ownerPassword: "54321",
          },
        },
      ];

    for (const t of tests) {
      it(t.name, async () => {
        const doc = new PDFDocument;
        doc.version = 2.0;
        doc.options.disableAscii85Encoding = true;
        doc.options.disableCompressedStreams = true;
        doc.options.xref = t.params.useXRefTable ? XrefStructure.Table : XrefStructure.Stream;
        doc.update.addCatalog();

        doc.encryptHandler = await StandardEncryptionHandler.create({
          document: doc,
          permission: UserAccessPermissionFlags.copy,
          algorithm: t.params.algorithm,
          // encryptMetadata: false,
          ownerPassword: t.params.ownerPassword,
          userPassword: t.params.userPassword,
          disableString: t.params.disableString,
          disableStream: t.params.disableStream,
        });

        // #region Add page
        const page = PageObjectDictionary.create(doc);
        page.MediaBox = page.createMediaBox(40, 40);
        const stm = PDFContentStream.create(doc);
        page.contents = stm;

        // Draw the Black square in the center of the page
        stm.content
          .setColor(0)
          .drawRectangle(10, 10, 20, 20)
          .fill();


        let xref = doc.update.xref as unknown as TrailerDictionary;
        xref.Root.Pages.addPage(page);
        // #endregion

        // Create update section to test that encryption works correctly with updates
        await doc.createUpdate();

        // Create the Info dictionary with Date
        xref = doc.update.xref as unknown as TrailerDictionary;
        const info = xref.Info.get(false, false);
        info.CreationDate = PDFDate.createDate(doc);

        // Save document
        const writer = new ViewWriter();
        await doc.writePDF(writer);

        // Save the document
        const pdf = writer.toUint8Array();
        if (t.params.file) {
          fs.writeFileSync(`${__dirname}/../../../../${t.params.file}.pdf`, pdf, { flag: "w+" }); // TODO move to test helpers
        }


        // Parse the saved document
        const doc2 = new PDFDocument();
        await doc2.fromPDF(new ViewReader(pdf));
        if (doc2.encryptHandler) {
          assert.ok(doc2.encryptHandler instanceof StandardEncryptionHandler);

          // check the User password
          const ok = await doc2.encryptHandler.checkUserPassword(t.params.userPassword);
          assert.ok(ok, "User password is incorrect");

          doc2.encryptHandler.onUserPassword = async (reason) => {
            if (reason === PasswordReason.incorrect) {
              throw new Error("Incorrect password");
            }

            return t.params.userPassword || "";
          };

          await doc2.decrypt();

          if (t.params.ownerPassword) {
            // TODO not implemented
            // const ok = await doc2.encryptHandler.checkOwnerPassword(t.params.ownerPassword);
            // assert.ok(ok, "Owner password is incorrect");
          }
        }
      });
    }

  });

});
