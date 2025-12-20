// // // In QrCodeService.cs
//  byte[] GenerateQrCodeWithLogo(string text, int size = 300, string? logoPath = null)
// {
//     using var qrGenerator = new QRCodeGenerator();
//     using var qrData = qrGenerator.CreateQrCode(text, QRCodeGenerator.ECCLevel.H); // High error correction
//     using var qrCode = new PngByteQRCode(qrData);

//     byte[] png;

//     if (!string.IsNullOrEmpty(logoPath) && File.Exists(logoPath))
//     {
//         var logo = System.Drawing.Image.FromFile(logoPath);
//         png = qrCode.GetGraphic(size, 
//             foregroundColor: System.Drawing.Color.Black,
//             backgroundColor: System.Drawing.Color.White,
//             icon: logo,
//             iconSizePercent: 20,
//             iconBorderWidth: 3,
//             clearAreaRadius: 15);
//     }
//     else
//     {
//         png = qrCode.GetGraphic(size);
//     }

//     return png;
// }

