import * as x509 from "@peculiar/x509";
import * as pkijs from "pkijs";
import "./algorithms";
import { TimeStampToken } from "./TimeStampToken";

describe("TimeStampToken", () => {
  let timeStampRaw: Buffer;
  let data: Buffer;

  beforeAll(async () => {
    const timeStampEnc = [
      "MIIIKgYJKoZIhvcNAQcCoIIIGzCCCBcCAQMxDzANBglghkgBZQMEAgEFADCB9QYL",
      "KoZIhvcNAQkQAQSggeUEgeIwgd8CAQEGCSsGAQQBoDIBHzAxMA0GCWCGSAFlAwQC",
      "AQUABCDZEA3sgYUT8AIrwpoZYNzbcKJV4XXSSSoAr3y5zv2ZegIQCbcFZ18xKpGE",
      "zbeIqRfe8BgPMjAyMDEwMjExNTQwMjdaMAMCAQGgdKRyMHAxCzAJBgNVBAYTAkdC",
      "MQ8wDQYDVQQIDAZMb25kb24xDzANBgNVBAcMBkxvbmRvbjETMBEGA1UECgwKR2xv",
      "YmFsU2lnbjEqMCgGA1UEAwwhRFNTIE5vbi1QdWJsaWMgRGVtbyBUU0EgUmVzcG9u",
      "ZGVyoIIEZTCCBGEwggNJoAMCAQICEAGM6DC8ieRrjVh3zcTK4YMwDQYJKoZIhvcN",
      "AQELBQAwUjELMAkGA1UEBhMCQkUxGTAXBgNVBAoTEEdsb2JhbFNpZ24gbnYtc2Ex",
      "KDAmBgNVBAMTH0dsb2JhbFNpZ24gTm9uLVB1YmxpYyBIVkNBIERlbW8wHhcNMjAx",
      "MDIwMjI0NDIzWhcNMjAxMDIzMTA0NDIzWjBwMQswCQYDVQQGEwJHQjEPMA0GA1UE",
      "CAwGTG9uZG9uMQ8wDQYDVQQHDAZMb25kb24xEzARBgNVBAoMCkdsb2JhbFNpZ24x",
      "KjAoBgNVBAMMIURTUyBOb24tUHVibGljIERlbW8gVFNBIFJlc3BvbmRlcjCCASIw",
      "DQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAK9+VVhdPgtkikhPETfFmcD7fVPR",
      "I/Wk05OrcOEUemvNxG7q98e7pyaRpixStm6T1tgIGUBGRXZjo7NcYn7KyoUlaFx2",
      "HiRi3IowKYxIAv7q3BTgqLPRRw6XDcLX+5QDUhQU5YQ3SLcAhsWS72aIhGzlaweE",
      "57TiwJKoQssF9YV9VU674tvy6+TrwSpAyfiegx7kREx6HWMf6ZE6l1vVkjMP+Z/1",
      "3jtH5+peVDlRFUeDKpFOViPOY8geBVm+Q6YiL9WDxz+hyz9++A+wDzXfZ4CkKmSd",
      "gptlSyRj/CnxL0qzgirCP+pbHILtsFiMPPwJbcZNTFBniBARVEc5M/P5A3kCAwEA",
      "AaOCARMwggEPMA4GA1UdDwEB/wQEAwIHgDAWBgNVHSUBAf8EDDAKBggrBgEFBQcD",
      "CDAdBgNVHQ4EFgQURBHCg697K19xD0tB8kz6qvgUXV0wDAYDVR0TAQH/BAIwADCB",
      "lgYIKwYBBQUHAQEEgYkwgYYwPAYIKwYBBQUHMAGGMGh0dHA6Ly9vY3NwLmdsb2Jh",
      "bHNpZ24uY29tL2NhL2dzbnBodmNhZGVtb3NoYTJnMzBGBggrBgEFBQcwAoY6aHR0",
      "cDovL3NlY3VyZS5nbG9iYWxzaWduLmNvbS9jYWNlcnQvZ3NucGh2Y2FkZW1vc2hh",
      "MmczLmNydDAfBgNVHSMEGDAWgBRnSwfpCfHxezLMvYUcTicNzqHMbDANBgkqhkiG",
      "9w0BAQsFAAOCAQEAX/XbVkDwIeesuvWkqiPF1PPLNS2e6efgBnLRH61MR57GgfDo",
      "6cxTtqvsLKC2ONrnFyr3IHue0Myc60H9vwPK2eSaKyKme1FFZrf8DCF4Y8tkL18d",
      "+tQGz3sqcyG23SrmWv1juL+bxuJRHtQ6irfva2jUuGdL3Nfs6KvB32+N4oMQIILR",
      "cxAKNFIZhIkivpm7G/nQxNnnQHX7sFKd+DDQUxeCKUduM3MyUw+wg+TumWqUFRot",
      "zPChuNM7ytQQUb/fCJacnL9/fYaZ5oLdEMEL6Z8iYaJvsQYZKNezzuSeCfmtT2dY",
      "bQ0GrRc5x80jMOlRYtiB+zb1nHnzongn90/RYTGCAp4wggKaAgEBMGYwUjELMAkG",
      "A1UEBhMCQkUxGTAXBgNVBAoTEEdsb2JhbFNpZ24gbnYtc2ExKDAmBgNVBAMTH0ds",
      "b2JhbFNpZ24gTm9uLVB1YmxpYyBIVkNBIERlbW8CEAGM6DC8ieRrjVh3zcTK4YMw",
      "DQYJYIZIAWUDBAIBBQCgggEJMBoGCSqGSIb3DQEJAzENBgsqhkiG9w0BCRABBDAc",
      "BgkqhkiG9w0BCQUxDxcNMjAxMDIxMTU0MDI3WjAvBgkqhkiG9w0BCQQxIgQgHPJd",
      "pdhjNaCKPjs+Jlmh8e+EDfUYoSuLkt13X4DEsR0wgZsGCyqGSIb3DQEJEAIMMYGL",
      "MIGIMIGFMIGCBBRlpMLTFTbzJGvvZYlNqJRzpuVHOzBqMFakVDBSMQswCQYDVQQG",
      "EwJCRTEZMBcGA1UEChMQR2xvYmFsU2lnbiBudi1zYTEoMCYGA1UEAxMfR2xvYmFs",
      "U2lnbiBOb24tUHVibGljIEhWQ0EgRGVtbwIQAYzoMLyJ5GuNWHfNxMrhgzANBgkq",
      "hkiG9w0BAQsFAASCAQAstQ4U8sRXYOnspv2cVFtCKmhXiREaAul/mgfAk4IkQRsd",
      "0NSOdGdkIrYKZ9WkJZwenLipqED3S0E9C7USMKOwKzjR3NoiuAhSh1Txd9Iwfh5f",
      "2vZiCRhF9k3giOrbIXYQsiw/pcUyQHg8W9cB8RTf39ZqRDwWJk8RAlK7TOiR4wr8",
      "AzC4Zm+c0VxycfGrGVt8Lb1ZSsAEyxKgDsOwxNl1eUUtIEpDAFTuU2XPa2+mRqF1",
      "C/WLgr3NNizFNilc2AORRuWlmCb2KA1e4mkSkvoRemCsCBB6zu9vsvKWwvaFu3qM",
      "FMQXJFkR6s2slF3KeaKSr9B5ndvaMD8AYGgoThf5"
    ];
    timeStampRaw = Buffer.from(timeStampEnc.join(""), "base64");
    data = Buffer.from(
      "P9QieShJlXNZqeYARlYbx9uc499Jt3JqC+1YX4qqlJtnzzAPEmevY5j3Vpi1JhNbtvqupKNL1X7UymK+I8t/N3o7ZDuGKJ+Dylyvns6jmH3UXXQ3Hr/6wxUcOsaBr/YvfGANE6CWOAyK6MvWKuukWfFFlZsZT1x5RADdRmCiKqYDjsAjWBiAj2RbWBhbwYkrdnNR1HXY8gdcNYuI3Xz/VPPud094Jb796hTNHitjMwwbPiUd58Laxvr7dzLbdK/fYzQbu1xYRRqZc+m7Td67ebFPaIEQriBUWjvhjGzTkvk/Vl7J0aZEs4koiq3gohIwk6eAfL34sQ2RgC92EPilqw==",
      "base64"
    );

    // Set the engine for pkijs and x509
    pkijs.setEngine(
      "newEngine",
      new pkijs.CryptoEngine({ name: "nodejs", crypto })
    );
    x509.cryptoProvider.set(crypto);
  });

  it("should parse and verify TimeStampToken", async () => {
    const token = TimeStampToken.fromBER(timeStampRaw);
    expect(token.info).toBeDefined();

    const result = await token.verify(data);
    expect(result.signatureVerified).toBe(true);
    expect(result.info).toBeDefined();
    expect(result.signers.length).toBe(1);
  });
});
