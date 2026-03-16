package com.example.PMS.Service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    private static final PDType1Font FONT_BOLD = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
    private static final PDType1Font FONT_NORMAL = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
    private static final float MARGIN_LEFT = 50f;
    private static final float PAGE_TOP = 780f;

    private final AnalyticsService analyticsService;

    public ReportService(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    public byte[] generateAnalyticsPdf() {
        Map<String, Object> data = analyticsService.getSummary();
        List<RowData> applicationsByJob = normalizeRows(data.get("applicationsByJob"));
        List<RowData> selectedByDepartment = normalizeRows(data.get("selectedByDepartment"));

        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {

            PDPage page = new PDPage();
            document.addPage(page);

            try (PDPageContentStream stream = new PDPageContentStream(document, page)) {
            float y = PAGE_TOP;

            y = drawHeading(stream, "Placement Management System", 12, y);
            y = drawHeading(stream, "Analytics Report", 18, y - 8);
            y = drawText(stream,
                "Generated: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                10,
                y - 14);

            y = drawDivider(stream, y - 10, page.getMediaBox().getWidth() - 100);

            y = drawSectionTitle(stream, "Summary", y - 18);
            y = drawSummaryGrid(stream, data, y - 6);

            y = drawSectionTitle(stream, "Applications by Job", y - 18);
            y = drawTable(stream, applicationsByJob, "Job Title", "Applications", y - 6, 12);

            y = drawSectionTitle(stream, "Selected by Department", y - 18);
            drawTable(stream, selectedByDepartment, "Department", "Selected", y - 6, 10);
            }

            document.save(output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new RuntimeException("Failed to generate report PDF", exception);
        }
    }

    private float drawHeading(PDPageContentStream stream, String text, int size, float y) throws IOException {
        stream.beginText();
        stream.setFont(FONT_BOLD, size);
        stream.newLineAtOffset(MARGIN_LEFT, y);
        stream.showText(text);
        stream.endText();
        return y - (size + 2);
    }

    private float drawText(PDPageContentStream stream, String text, int size, float y) throws IOException {
        stream.beginText();
        stream.setFont(FONT_NORMAL, size);
        stream.newLineAtOffset(MARGIN_LEFT, y);
        stream.showText(text);
        stream.endText();
        return y - (size + 2);
    }

    private float drawDivider(PDPageContentStream stream, float y, float width) throws IOException {
        stream.moveTo(MARGIN_LEFT, y);
        stream.lineTo(MARGIN_LEFT + width, y);
        stream.stroke();
        return y - 8;
    }

    private float drawSectionTitle(PDPageContentStream stream, String title, float y) throws IOException {
        stream.beginText();
        stream.setFont(FONT_BOLD, 12);
        stream.newLineAtOffset(MARGIN_LEFT, y);
        stream.showText(title);
        stream.endText();
        return y - 12;
    }

    private float drawSummaryGrid(PDPageContentStream stream, Map<String, Object> data, float y) throws IOException {
        List<String> lines = List.of(
                "Total Applications: " + valueOrZero(data.get("totalApplications")),
                "Selected: " + valueOrZero(data.get("selected")),
                "Rejected: " + valueOrZero(data.get("rejected")),
                "Offered: " + valueOrZero(data.get("offered")),
                "Selection Rate: " + String.format("%.2f", asDouble(data.get("selectionRate"))) + "%"
        );

        for (String line : lines) {
            y = drawText(stream, line, 10, y);
        }

        return y - 2;
    }

    private float drawTable(PDPageContentStream stream,
                            List<RowData> rows,
                            String firstHeader,
                            String secondHeader,
                            float y,
                            int maxRows) throws IOException {
        float tableWidth = 495f;
        float col1Width = 360f;
        float col2Width = tableWidth - col1Width;
        float rowHeight = 18f;
        float x = MARGIN_LEFT;

        drawCellText(stream, firstHeader, x + 4, y - 12, true);
        drawCellText(stream, secondHeader, x + col1Width + 4, y - 12, true);
        stream.moveTo(x, y - rowHeight);
        stream.lineTo(x + tableWidth, y - rowHeight);
        stream.stroke();

        float currentY = y - rowHeight;
        int limit = Math.min(rows.size(), maxRows);
        for (int i = 0; i < limit; i++) {
            RowData row = rows.get(i);
            drawCellText(stream, safeText(row.label), x + 4, currentY - 12, false);
            drawCellText(stream, String.valueOf(row.count), x + col1Width + 4, currentY - 12, false);
            stream.moveTo(x, currentY - rowHeight);
            stream.lineTo(x + tableWidth, currentY - rowHeight);
            stream.stroke();
            currentY -= rowHeight;
        }

        if (rows.size() > maxRows) {
            currentY = drawText(stream, "... " + (rows.size() - maxRows) + " more rows", 9, currentY - 4);
        }

        stream.moveTo(x + col1Width, y);
        stream.lineTo(x + col1Width, currentY);
        stream.stroke();

        return currentY - 4;
    }

    private void drawCellText(PDPageContentStream stream, String text, float x, float y, boolean bold) throws IOException {
        stream.beginText();
        stream.setFont(bold ? FONT_BOLD : FONT_NORMAL, 10);
        stream.newLineAtOffset(x, y);
        stream.showText(text);
        stream.endText();
    }

    private List<RowData> normalizeRows(Object raw) {
        List<RowData> rows = new ArrayList<>();
        if (!(raw instanceof List<?> rawList)) {
            return rows;
        }

        for (Object entry : rawList) {
            if (entry instanceof Object[] tuple && tuple.length >= 2) {
                rows.add(new RowData(safeText(tuple[0]), asLong(tuple[1])));
            } else if (entry instanceof List<?> tuple && tuple.size() >= 2) {
                rows.add(new RowData(safeText(tuple.get(0)), asLong(tuple.get(1))));
            }
        }
        return rows;
    }

    private String safeText(Object value) {
        String text = value == null ? "N/A" : String.valueOf(value);
        return text.replaceAll("\\s+", " ").trim();
    }

    private long asLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (Exception ignored) {
            return 0L;
        }
    }

    private double asDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (Exception ignored) {
            return 0d;
        }
    }

    private long valueOrZero(Object value) {
        return asLong(value);
    }

    private static final class RowData {
        private final String label;
        private final long count;

        private RowData(String label, long count) {
            this.label = label;
            this.count = count;
        }
    }
}
