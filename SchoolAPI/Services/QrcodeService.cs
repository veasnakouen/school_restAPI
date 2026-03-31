using QRCoder;

namespace SchoolAPI.Services
{
    public class QrcodeService
    {
        public byte[] GenerateQrCode(string text, int pixelsPerModule = 20)
        {
            using var qrGenerator = new QRCodeGenerator();
            using var qrData = qrGenerator.CreateQrCode(text, QRCodeGenerator.ECCLevel.H);
            using var qrCode = new PngByteQRCode(qrData);

            return qrCode.GetGraphic(pixelsPerModule);
        }
    }
}

