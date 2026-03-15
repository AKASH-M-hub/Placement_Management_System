package com.example.PMS.Service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Map;

@Service
public class ReportService {

    private final AnalyticsService analyticsService;

    public ReportService(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    public byte[] generateAnalyticsPdf() {
        Map<String, Object> data = analyticsService.getSummary();

        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {

            PDPage page = new PDPage();
            document.addPage(page);

            try (PDPageContentStream stream = new PDPageContentStream(document, page)) {
                stream.beginText();
                stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 14);
                stream.newLineAtOffset(50, 750);
                stream.showText("PMS Analytics Report");
                stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);

                stream.newLineAtOffset(0, -30);
                stream.showText("Total Applications: " + data.get("totalApplications"));
                stream.newLineAtOffset(0, -18);
                stream.showText("Selected: " + data.get("selected"));
                stream.newLineAtOffset(0, -18);
                stream.showText("Rejected: " + data.get("rejected"));
                stream.newLineAtOffset(0, -18);
                stream.showText("Offered: " + data.get("offered"));
                stream.newLineAtOffset(0, -18);
                stream.showText("Selection Rate: " + data.get("selectionRate") + "%");
                stream.endText();
            }

            document.save(output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new RuntimeException("Failed to generate report PDF", exception);
        }
    }
}
