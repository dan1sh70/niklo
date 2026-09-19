import PDFDocument = require('pdfkit');

export class PdfUtil {
  static async generateVoucherPdf(booking: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: any[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      doc.fontSize(20).text('Booking Voucher', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Booking ID: ${booking.id}`);
      doc.text(`Partner ID: ${booking.partner_id}`);
      doc.text(`User ID: ${booking.user_id}`);
      doc.text(`Status: ${booking.status}`);
      doc.text(`Total Amount: ${booking.gross_amount} INR`);
      if (booking.start_date) {
        doc.text(`Travel Date: ${booking.start_date}`);
      }
      
      doc.end();
    });
  }

  static async generateInvoicePdf(settlement: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: any[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      doc.fontSize(20).text('GST Tax Invoice', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Settlement Ref: ${settlement.settlement_ref}`);
      doc.text(`Partner ID: ${settlement.partner_id}`);
      doc.text(`Gross Amount: ${settlement.gross_amount} INR`);
      doc.text(`Platform Fee: ${settlement.platform_fee} INR`);
      doc.text(`TDS Deducted: ${settlement.tds_amount} INR`);
      doc.text(`Net Amount: ${settlement.net_amount} INR`);
      
      doc.moveDown();
      doc.text('This is a computer generated invoice and does not require a physical signature.', { align: 'center' });

      doc.end();
    });
  }
}
