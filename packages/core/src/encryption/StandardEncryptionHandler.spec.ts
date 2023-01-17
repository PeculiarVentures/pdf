import * as assert from "node:assert";
import * as fs from "node:fs";
import { BufferSourceConverter, Convert } from "pvtsutils";
import * as pkijs from "pkijs";
import { Crypto } from "@peculiar/webcrypto";
import { CrossReferenceStream, CrossReferenceTable, CryptoFilterMethods, CryptoFilterDictionary, InformationDictionary, PageObjectDictionary, PDFDate, PDFDocument, StandardEncryptDictionary, TrailerDictionary, UserAccessPermissionFlags, XrefStructure } from "../structure";
import { PasswordReason, StandardEncryptionHandler } from "./StandardEncryptionHandler";
import { PDFCryptoEngine } from "../CryptoEngine";
import { ViewWriter } from "../ViewWriter";
import { PDFContentStream } from "../content";
import { ViewReader } from "../ViewReader";
import { PDFStream } from "../objects";

context("StandardEncryptionHandler", () => {

  context("padPassword", () => {

    const tests: {
      name: string;
      args?: BufferSource;
      want: ArrayBuffer;
    }[] = [
        {
          name: "password is undefined",
          want: Convert.FromHex("28bf4e5e4e758a4164004e56fffa01082e2e00b6d0683e802f0ca9fe6453697a"),
        },
        {
          name: "password is shorter than 32-bytes",
          args: new Uint8Array([1, 2, 3, 4, 5]),
          want: Convert.FromHex("010203040528bf4e5e4e758a4164004e56fffa01082e2e00b6d0683e802f0ca9"),
        },
        {
          name: "password is 32-bytes",
          args: Convert.FromHex("0102030405010203040501020304050102030405010203040501020304050102"),
          want: Convert.FromHex("0102030405010203040501020304050102030405010203040501020304050102"),
        },
        {
          name: "password is longer than 32-bytes",
          args: Convert.FromHex("0102030405010203040501020304050102030405010203040501020304050102030405"),
          want: Convert.FromHex("0102030405010203040501020304050102030405010203040501020304050102"),
        },
      ];
    for (const t of tests) {
      it(t.name, () => {
        const v = StandardEncryptionHandler.padPassword(t.args);
        assert.ok(BufferSourceConverter.isEqual(v, t.want), "StandardEncryptionHandler.mixedPassword returns incorrect padded password");
      });
    }

  });

  it("checkUserPassword", async () => {
    pkijs.setEngine("PDF", new PDFCryptoEngine({ name: "PDF", crypto: new Crypto() }));

    const doc = new PDFDocument();
    doc.update.addCatalog();
    doc.update.xref!.set("ID", doc.createArray(
      doc.createHexString(Convert.FromHex("2A33917C273E9BF438317F9D9B920F75")),
      doc.createHexString(Convert.FromHex("6ED90B2C9CF31E40801AE26260FEC5E7")),
    ));
    const encrypt = StandardEncryptDictionary.create(doc).makeIndirect();
    const filter = CryptoFilterDictionary.create(doc);
    filter.AuthEvent = "DocOpen";
    filter.CFM = CryptoFilterMethods.AES128;
    encrypt.CF.get().setFilter("StdCF", filter);

    encrypt.set("Filter", doc.createName("Standard"));
    encrypt.set("Length", doc.createNumber(128));
    encrypt.set("O", doc.createString(Convert.ToBinary(Convert.FromBase64("r0B2wtxC+oRIIBfzWQCQmsXSKNtrOhHoOh7lhGJ8qF4="))));
    encrypt.set("P", doc.createNumber(-1084));
    encrypt.set("R", doc.createNumber(4));
    encrypt.set("StmF", doc.createName("StdCF"));
    encrypt.set("StrF", doc.createName("StdCF"));
    encrypt.set("U", doc.createString(Convert.ToBinary(Convert.FromBase64("tvoThLGlPWljQ/JUCtORWgAAAAAAAAAAAAAAAAAAAAA="))));
    encrypt.set("V", doc.createNumber(4));

    doc.update.xref!.Encrypt = encrypt;

    assert.ok(doc.encryptHandler instanceof StandardEncryptionHandler);

    const ok = await doc.encryptHandler.checkUserPassword();
    assert.ok(ok, "Incorrect password");
  });

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

  it("create encrypted PDF with revision 4 and AESV2", async () => {
    pkijs.setEngine("PDF", new PDFCryptoEngine({ name: "PDF", crypto: new Crypto() }));

    const doc = new PDFDocument;
    doc.version = 1.5;
    // doc.options.disableAscii85Encoding = true;
    // doc.options.disableCompressedStreams = true;
    // doc.options.disableCompressedObjects = true;
    // doc.options.xref = XrefStructure.Table;
    doc.update.addCatalog();

    doc.encryptHandler = await StandardEncryptionHandler.create({
      document: doc,
      permission: UserAccessPermissionFlags.copy,
      algorithm: CryptoFilterMethods.AES128,
      // encryptMetadata: false,
      userPassword: "12345",
      disableString: true,
      disableStream: true,
    });

    // #region Add page
    const page = PageObjectDictionary.create(doc);
    page.mediaBox = page.createMediaBox(40, 40);
    const stm = PDFContentStream.create(doc);
    page.contents = stm;
    stm.content
      .setColor(0)
      .drawRectangle(10, 10, 20, 20)
      .fill();


    const xref = doc.update.xref as unknown as TrailerDictionary;
    const info = xref.Info.get(false, false);
    info.CreationDate = PDFDate.createDate(doc);
    xref.Root.Pages.addPage(page);
    // #endregion

    await doc.createUpdate();

    const test = doc.createDictionary(
      ["Boolean", doc.createBoolean(true)],
      ["Number", doc.createNumber(1)],
      ["Literal", doc.createString("привет")],
      ["Hex", doc.createHexString(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]))],
      ["Array", doc.createArray(doc.createNumber(2), doc.createArray(doc.createString("hello")),)],
      ["Dict", doc.createDictionary(
        ["Key", doc.createNumber(-1.2345).makeIndirect()]
      )],
    ).makeIndirect();
    xref.Root.set("Test", test);

    const writer = new ViewWriter();
    await doc.writePDF(writer);

    // Save the document
    const pdf = writer.toUint8Array();
    fs.writeFileSync(`${__dirname}/../../../../tmp.pdf`, pdf, { flag: "w+" });

    // Parse the saved document
    const doc2 = new PDFDocument();
    await doc2.fromPDF(new ViewReader(pdf));
    if (doc2.encryptHandler) {
      assert.ok(doc2.encryptHandler instanceof StandardEncryptionHandler);
      doc2.encryptHandler.onUserPassword = async (reason) => {
        if (reason === PasswordReason.incorrect) {
          throw new Error("Incorrect password");
        }

        return "12345";
      };

      await doc2.decrypt();
    }

    doc2.getObject(1).value;

    const r5 = doc2.getObject(5).value;
    assert.ok(r5 instanceof PDFStream);
    const textStream = Convert.ToBinary(r5.stream);
    console.log(Convert.ToBinary(r5.stream));
  });

});
