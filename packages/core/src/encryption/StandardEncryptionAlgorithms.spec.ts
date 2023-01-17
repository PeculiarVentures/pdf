import * as assert from "node:assert";
import { Crypto } from "@peculiar/webcrypto";
import { StandardAlgorithm2Params, StandardAlgorithm5Params, StandardEncryptionAlgorithm } from "./StandardEncryptionAlgorithms";
import { PDFCryptoEngine } from "../CryptoEngine";
import { Convert } from "pvtsutils";

context("StandardEncryptionAlgorithm", () => {

  const crypto = new PDFCryptoEngine({ name: "pdf", crypto: new Crypto() });
  // O: ddbc87d3b71d554bb67a4b42c2fe9212a5c2bd37caf1127469340e8425cd2fa0
  // U: 48f1437c96950abc924b8e019980370400000000000000000000000000000000

  context("algorithm2", () => {
    const tests: {
      name: string;
      params: StandardAlgorithm2Params;
      want: string;
    }[] = [
        {
          name: "default password",
          params: {
            id: Convert.FromHex("8D966A6EA9AE43E68A5B5E262C0AFEB5"),
            length: 128,
            ownerValue: Convert.FromHex("DDBC87D3B71D554BB67A4B42C2FE9212A5C2BD37CAF1127469340E8425CD2FA0"),
            permissions: -3392,
            password: "",
            encryptMetadata: true,
            revision: 4,
            crypto,
          },
          want: "B64B049FB37F12FBA16F8C8E840AC68B"
        },
        {
          name: "default password",
          params: {
            id: Convert.FromHex("A204AB6AF65984019767B91004A5BE10"),
            length: 128,
            ownerValue: Convert.FromHex("36451BD39D753B7C1D10922C28E6665AA4F3353FB0348B536893E3B1DB5C579B"),
            permissions: -4076,
            password: "",
            encryptMetadata: false,
            revision: 4,
            crypto,
          },
          want: "A268385041E5038D17C5E7F1027B950E"
        },
      ];

    for (const t of tests) {
      it(`${t.name}, revision: ${t.params.revision}, encryptMetadata: ${t.params.encryptMetadata}, length: ${t.params.length}`, async () => {
        const v = await StandardEncryptionAlgorithm.algorithm2(t.params);
        assert.equal(Convert.ToHex(v), t.want.toLocaleLowerCase());
      });
    }
  });

  context("algorithm4", () => {
    const tests: {
      name: string;
      params: StandardAlgorithm5Params;
      want: {
        result: string;
        length: number;
      };
    }[] = [
        {
          name: "default password",
          params: {
            encryptionKey: Convert.FromHex("B64B049FB37F12FBA16F8C8E840AC68B"),
            revision: 4,
            id: Convert.FromHex("8D966A6EA9AE43E68A5B5E262C0AFEB5"),
            crypto,
          },
          want: {
            result: "48f1437c96950abc924b8e0199803704",
            length: 16,
          }
        },
      ];

    for (const t of tests) {
      it(`${t.name}, revision: ${t.params.revision}`, async () => {
        const v = await StandardEncryptionAlgorithm.algorithm5(t.params);
        const result = Convert.FromHex(t.want.result).slice(0, t.want.length);
        assert.equal(Convert.ToHex(v.slice(0, t.want.length)), Convert.ToHex(result));
      });
    }
  });

});
