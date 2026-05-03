import React, { useState, useEffect } from "react";
import { QRCode } from "react-qrcode-logo";

interface KHQRData {
  recipientId: string; // Your Bakong ID (e.g. 012345678@aba)
  recipientName: string;
  city: string;
  amount: string;
  currency: "116" | "840";
  accountType: "personal" | "merchant";
}

const KHQRGenerator: React.FC = () => {
  const [data, setData] = useState<KHQRData>({
    recipientId: "001188067", 
    recipientName: "Veasna KOEUN",
    city: "Phnom Penh",
    amount: "50000",
    currency: "116" as "116" | "840",
    accountType: "merchant", 
  });

  const [payload, setPayload] = useState<string>("");
  const [qrValue, setQrValue] = useState<string>("");

  // CRC16-CCITT (Required by KHQR standard - Must operate on UTF-8 bytes)
  const crc16 = (str: string): string => {
    let crc = 0xffff;
    const bytes = new TextEncoder().encode(str);
    for (let i = 0; i < bytes.length; i++) {
      crc ^= bytes[i] << 8;
      for (let j = 0; j < 8; j++) {
        crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
        crc &= 0xffff;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
  };

  const buildKHQR = () => {
    const encoder = new TextEncoder();
    // Helper to safely calculate byte lengths and pad them
    const buildTag = (id: string, value: string) => {
      if (!value) return "";
      const len = encoder.encode(value).length.toString().padStart(2, "0");
      return `${id}${len}${value}`;
    };

    let payloadStr = "";
    payloadStr += buildTag("00", "01"); // Payload Format Indicator
    
    const hasAmount = data.amount && parseFloat(data.amount) > 0;
    // ALWAYS use 11 (Static QR) to bypass ABA's strict Dynamic Session backend validation
    payloadStr += buildTag("01", "11"); // Initiation Method: 11 = Static

    // Account Info (Tag 29 = Personal, Tag 30 = Merchant)
    const accountTag = data.accountType === "merchant" ? "30" : "29";
    const bakongGuid = buildTag("00", "kh.com.nbc.bakong");
    
    // ABA & Bakong strictly require the '@bank' domain suffix
    let safeAccountId = data.recipientId.trim();
    if (safeAccountId && !safeAccountId.includes("@")) {
      safeAccountId += "@aba"; // Auto-append @aba if user just typed their account number
    }
    const accountId = buildTag("01", safeAccountId);
    payloadStr += buildTag(accountTag, bakongGuid + accountId);

    // Merchant Category Code (52) - KHQR strictly requires '0000' for Personal (Tag 29) and a real MCC like '5999' for Merchant (Tag 30).
    payloadStr += buildTag("52", data.accountType === "merchant" ? "5999" : "0000");
    
    // Currency (53)
    payloadStr += buildTag("53", data.currency);

    // Amount
    if (hasAmount) {
      let amtStr = data.amount.trim();
      if (data.currency === "840") {
        amtStr = parseFloat(amtStr).toFixed(2); // USD requires decimals
      } else {
        amtStr = parseInt(amtStr, 10).toString(); // KHR MUST NOT have decimals
      }
      payloadStr += buildTag("54", amtStr);
    }

    // Country Code (58)
    payloadStr += buildTag("58", "KH");

    // Recipient Name - EMVCo strict: Max 25 chars, Latin/ASCII only
    const nameStr = data.recipientName.replace(/[^\x20-\x7E]/g, "").trim().substring(0, 25).toUpperCase() || "UNKNOWN";
    payloadStr += buildTag("59", nameStr);

    // City - EMVCo strict: Max 15 chars, Latin/ASCII only
    const cityStr = data.city.replace(/[^\x20-\x7E]/g, "").trim().substring(0, 15).toUpperCase() || "PHNOM PENH";
    payloadStr += buildTag("60", cityStr);

    payloadStr += "6304"; // CRC Placeholder

    const crc = crc16(payloadStr);
    const finalPayload = payloadStr + crc;

    setPayload(finalPayload);
    setQrValue(finalPayload);
  };

  useEffect(() => {
    buildKHQR();
  }, [data]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const copyPayload = () => {
    navigator.clipboard.writeText(payload);
    alert("KHQR Payload copied to clipboard!");
  };

  const downloadQR = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `KHQR_${data.amount}KHR.png`;
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Customer Payment QR
          </h1>
          <p className="text-lg text-gray-600">
            Generate KHQR for customers to pay you directly
          </p>
          <p className="text-emerald-600 mt-2">
            Using {data.accountType === "merchant" ? "Merchant (Tag 30)" : "Personal (Tag 29)"} Bakong Account
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Form */}
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold mb-6">Payment Details</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Bakong ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="recipientId"
                  value={data.recipientId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-emerald-500"
                  placeholder="012345678@aba"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: PhoneNumber@Bank. Note: ABA Personal Bakong IDs are usually your registered phone number (e.g. 85512345678@aba)!
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>
                <select
                  name="accountType"
                  value={data.accountType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="personal">Personal Account (Tag 29)</option>
                  <option value="merchant">Merchant Account (Tag 30)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  name="recipientName"
                  value={data.recipientName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={data.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (KHR)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={data.amount}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl text-xl font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  name="currency"
                  value={data.currency}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl"
                >
                  <option value="116">KHR - Cambodian Riel</option>
                  <option value="840">USD - US Dollar</option>
                </select>
              </div>
            </div>

            {/* Payload */}
            <div className="mt-8 p-4 bg-gray-50 rounded-2xl border">
              <p className="text-xs text-gray-500 mb-1">KHQR Payload</p>
              <p className="font-mono text-sm break-all text-gray-800">
                {payload || "Generating..."}
              </p>
            </div>

            <button
              onClick={copyPayload}
              className="mt-4 w-full bg-gray-900 text-white py-3.5 rounded-2xl font-medium hover:bg-black transition"
            >
              Copy Payload
            </button>
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-3xl shadow-xl p-10 flex flex-col items-center justify-center">
            <div className="relative mb-8">
              <QRCode
                value={qrValue}
                size={320}
                bgColor="#ffffff"
                fgColor="#1f2937"
                eyeRadius={12}
                quietZone={15}
              />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white text-xs font-bold px-6 py-1 rounded-full border border-emerald-200 shadow-sm">
                KHQR • CAMBODIA
              </div>
            </div>

            <button
              onClick={downloadQR}
              className="px-10 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-medium transition"
            >
              Download QR Code (PNG)
            </button>

            <p className="text-center text-sm text-gray-500 mt-10">
              Customer can scan this QR using ABA, Acleda, Bakong or any
              supported app
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KHQRGenerator;
