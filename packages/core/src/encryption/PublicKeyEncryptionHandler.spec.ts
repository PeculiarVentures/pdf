import * as assert from "node:assert";
import * as fs from "node:fs";
import { X509Certificate } from "@peculiar/x509";
import { Crypto } from "@peculiar/webcrypto";
import * as pkijs from "pkijs";
import { Convert } from "pvtsutils";
import { PDFContentStream } from "../content";
import { CryptoFilterMethods, PageObjectDictionary, PDFDate, PDFDocument, PublicKeyPermissionFlags, TrailerDictionary, XrefStructure } from "../structure";
import { ViewWriter } from "../ViewWriter";
import { PublicKeyEncryptionHandler } from "./PublicKeyEncryptionHandler";
import { ViewReader } from "../ViewReader";
import { PDFCryptoEngine } from "../CryptoEngine";

context("PublicKeyEncryptionHandler", () => {
  const crypto = new Crypto();
  pkijs.setEngine("PDF", new PDFCryptoEngine({ name: "PDF", crypto }));

  const tests: {
    name: string;
    params: {
      file?: string;
      algorithm: CryptoFilterMethods;
      permission?: PublicKeyPermissionFlags;
      recipient: {
        cert: X509Certificate;
        key: {
          pkcs8: BufferSource;
          algorithm: Algorithm | RsaHashedImportParams | EcKeyImportParams;
          usages: KeyUsage[];
        };
      };
      useXRefTable?: boolean;
      disableString?: boolean;
      disableStream?: boolean;
    };
  }[] = [
      {
        name: "RSA 2048",
        params: {
          // file: "rsa_aes256",
          algorithm: CryptoFilterMethods.AES256,
          permission: PublicKeyPermissionFlags.fillForms, // | PublicKeyPermissionFlags.enableAll,
          recipient: {
            cert: new X509Certificate("MIIDYjCCAkqgAwIBAgIKfLPvDVZqwJmrrDANBgkqhkiG9w0BAQsFADBfMRcwFQYDVQQDEw5BY3JvYmF0IFJTQSBJRDEJMAcGA1UEChMAMQkwBwYDVQQLEwAxITAfBgkqhkiG9w0BCQEWEm1pY3Jvc2hpbmVAbWFpbC5ydTELMAkGA1UEBhMCVVMwHhcNMjMwMTI2MTIwMzA2WhcNMjgwMTI2MTIwMzA2WjBfMRcwFQYDVQQDEw5BY3JvYmF0IFJTQSBJRDEJMAcGA1UEChMAMQkwBwYDVQQLEwAxITAfBgkqhkiG9w0BCQEWEm1pY3Jvc2hpbmVAbWFpbC5ydTELMAkGA1UEBhMCVVMwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7WqzEg2jPbImxVV/tSJQbalHfywf4rzUOjVLY5w4Fs5CHEOPvj25vBymLywwP6Qrd6Tor14pon9hEiVG3pV2HBBduCfHVi2Sbe00/t6ENYbDrlHyxaHUttAcdH94hFawnhAy2ad4ZdsyShub5Vdd3jTE0/5gPar5RuMpH4JKCxzaj47nWKNRunLuBadybP4JEj2DZvrS9Ci8erlP3f7+fXM8Vt7rmlkFoKF74JDaw+hBDDzg2DX4abK0XCTFF0HhBlnjnCU+0mhOpa5hkbH3qhbYfbNoAtuDw5g0y3JcYZLzSnikaqC4j8Qq1Q1FQa7zbZeHh77GNG2wTVsvNouJZAgMBAAGjIDAeMA8GCSqGSIb3LwEBCgQCBQAwCwYDVR0PBAQDAgOYMA0GCSqGSIb3DQEBCwUAA4IBAQBsaEfb1dYL870/lfC2/4RMdcUVanytiUz3cQorDuKf/o538KtjpWsPv57pfeNM6rpiwwD5eOARvbHZCsNApxbAIZ1z2WOq6ws9i1e+o7bbgqkGAx8FJVxaZCbrW3OCmX6jxMynUislR+s8kxK7X81WNYa3IbaE7ZgKA3407hOD3Ensns738GkaLfpTQ95xckO/cE0bBkL/WWZHwoH0iYwEHdMSLeC21EGrnBNH1HO8iD+h+bBnNbzHpjaZqKKeK269GXJFr7C7tjQE+lCDB6+G3rygnUxSBghWfYVJQsmL6EIt2CHuOFnA6Li+b4CGDFuEJf5FQt2w70k2OL+gyIP3"),
            key: {
              algorithm: {
                name: "RSAES-PKCS1-v1_5",
                // name: "RSA-OAEP",
                // hash: "SHA-256",
              },
              pkcs8: Convert.FromBase64("MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7WqzEg2jPbImxVV/tSJQbalHfywf4rzUOjVLY5w4Fs5CHEOPvj25vBymLywwP6Qrd6Tor14pon9hEiVG3pV2HBBduCfHVi2Sbe00/t6ENYbDrlHyxaHUttAcdH94hFawnhAy2ad4ZdsyShub5Vdd3jTE0/5gPar5RuMpH4JKCxzaj47nWKNRunLuBadybP4JEj2DZvrS9Ci8erlP3f7+fXM8Vt7rmlkFoKF74JDaw+hBDDzg2DX4abK0XCTFF0HhBlnjnCU+0mhOpa5hkbH3qhbYfbNoAtuDw5g0y3JcYZLzSnikaqC4j8Qq1Q1FQa7zbZeHh77GNG2wTVsvNouJZAgMBAAECggEAM29JTwnklE1v38dYdoQeZQhjQdUzcwpmvn/95p5IMziAzRPN/86YutJ0jXRI83U/Dn0hAzhBP0fiz64DSS+U5aQx6nvAcKe8DxNiucNn64yOTZ6OPQY4ZTuvWEePa/XPNWoDM3ENEGCU+QUgFAOFC8UvZSVmUZU0eqsInYMBtfUR0MHq5hMDP2HaFRTWDh8fvSrasdA0WC6CqBMsUGJnHIW31p0cTnD+zf8cJ1qyzfi8SNVFPTIQjbdkkH8cSGH75JYGPZ5nuNhlNFdSdoJIFpc9I2ZqR2KNcqB0R+pE9Vvg2U0U9mxZ8QCh2sVscsEf09MZYQycJuLFz7yt8PiGoQKBgQDBLegF8oIlbPGOVtulYKIETOx7E7NW+rfR3n7vOnzQUgsa7+rLF/4CCprjUxr7xLrEX/ItwN+q5HNorqWL81SqHooiXA86/s1agKJMFhKaKA983vqdb/515yftptkkeuz32Y25WE02tjK/KYfQV3zofXMeM4CZNVtETIlFs0YSNwKBgQD4R9RhP/7hvWm0S7HpyJlst9sEU7gvFX1Z2yLsfCXF/2RPO+048rd5xhOn8h07tclztGvziwtA1Ka1jgOe11iSSJWTKVwf/WVlFir61feP2w7todUvu+gLHvHRHSpOw7PIUGZm1Km7BgJS5XCAg7loRgCw9FprC9emqNSdPlqn7wKBgEywTbj2seXrnuVz49R+TTNJ2mNtybdQ5uKA4oFUBbKpr1DtR5eCmcrzrNNr7X1fdwl4UWsKc4CjGpHHK18opUa3wvyq8TzpZFp2UHfGF3JtTuCyoGkZybnCn14/61oJFsO58QJQZK7Am9q5wPnbkXG2Q5oMthOcU/QEMkaiScH3AoGBAL4h49aFt58P+r8DqL+ryzKiqarqogYMou4JDvmjKRoztpGnBsexuCgdNDhNBW4QjLF63aCoPnnrX69xjfw6Va3QwBrudYpZ9ygujcOB0A/uZcQ9RpFDiTPbArxtZVTkMe2ZBJKDEWgT9fudkUYZmgbsdOMOfZ+0dfU/HXM9qRcpAoGASIYb2YG7Wk0Wb/RrnpZ5aPEOVfSigHSjlsR7PrhQon7mda2vnL2s4Qit7q6YMSOgBFUSYVEhTZIMKXWXbJx/nlvSxsRrPdVilooDnAsvMHOBuK/eeyIO0KHqklg22DXa2NdVTCKzfsiA2IJFLHhF1KxCznCQiAmdGOj3B4jBwXE="),
              usages: ["decrypt", "wrapKey"],
            },
          },
          // useXRefTable: true,
        },

      }
    ];

  for (const t of tests) {
    it(t.name, async () => {
      const doc = new PDFDocument;
      doc.version = 2.0;
      doc.options.xref = t.params.useXRefTable ? XrefStructure.Table : XrefStructure.Stream;
      doc.options.disableAscii85Encoding = true;
      doc.options.disableCompressedStreams = true;
      // doc.options.disableCompressedObjects = true;
      doc.update.addCatalog();

      doc.encryptHandler = await PublicKeyEncryptionHandler.create({
        document: doc,
        permission: t.params.permission,
        algorithm: t.params.algorithm,
        recipients: [t.params.recipient.cert],
        encryptMetadata: false,
        disableString: t.params.disableString,
        disableStream: t.params.disableStream,
      });

      // #region Add page
      const page = PageObjectDictionary.create(doc).makeIndirect(false);
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
      // await doc.createUpdate();

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
        assert.ok(doc2.encryptHandler instanceof PublicKeyEncryptionHandler);

        const keyParams = t.params.recipient.key;
        doc2.encryptHandler.onCertificate = async (_o) => {
          return {
            certificate: t.params.recipient.cert,
            key: await crypto.subtle.importKey("pkcs8", keyParams.pkcs8, keyParams.algorithm, false, keyParams.usages),
            crypto,
          };
        };

        await doc2.decrypt();
      }
    });
  }

});
