package com.example.PMS.Controller;

import com.example.PMS.DTO.*;
import com.example.PMS.Entity.ApplicationStatus;
import com.example.PMS.Entity.Application;
import com.example.PMS.Entity.Job;
import com.example.PMS.Entity.Student;
import com.example.PMS.Repository.StudentRepository;
import com.example.PMS.Service.AnalyticsService;
import com.example.PMS.Service.ApplicationService;
import com.example.PMS.Service.DocumentStorageService;
import com.example.PMS.Service.FeedbackService;
import com.example.PMS.Service.InterviewService;
import com.example.PMS.Service.JobService;
import com.example.PMS.Service.OfferService;
import com.example.PMS.Service.ReportService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final JobService jobService;
    private final ApplicationService applicationService;
    private final InterviewService interviewService;
    private final OfferService offerService;
    private final FeedbackService feedbackService;
    private final AnalyticsService analyticsService;
    private final ReportService reportService;
    private final StudentRepository studentRepository;
    private final DocumentStorageService documentStorageService;

    public AdminController(JobService jobService,
                           ApplicationService applicationService,
                           InterviewService interviewService,
                           OfferService offerService,
                           FeedbackService feedbackService,
                           AnalyticsService analyticsService,
                           ReportService reportService,
                           StudentRepository studentRepository,
                           DocumentStorageService documentStorageService) {
        this.jobService = jobService;
        this.applicationService = applicationService;
        this.interviewService = interviewService;
        this.offerService = offerService;
        this.feedbackService = feedbackService;
        this.analyticsService = analyticsService;
        this.reportService = reportService;
        this.studentRepository = studentRepository;
        this.documentStorageService = documentStorageService;
    }

    @PostMapping("/job")
    public Job addJob(@RequestBody Job job) {
        return jobService.addJob(job);
    }

    @GetMapping("/applications")
    public List<Application> getAllApplications(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) Double minCgpa
    ) {
        if (status == null && department == null && skill == null && minCgpa == null) {
            return applicationService.getAllApplications();
        }
        return applicationService.filterApplications(status, department, skill, minCgpa);
    }

    @PutMapping("/applications/{applicationId}/status")
    public Application updateApplicationStatus(@PathVariable Long applicationId,
                                               @RequestBody UpdateApplicationStatusRequest request,
                                               Authentication authentication) {
        return applicationService.updateStatus(
                applicationId,
                request.getStatus(),
                request.getRemarks(),
                authentication.getName()
        );
    }

    @PutMapping("/applications/bulk-status")
    public List<Application> bulkUpdateStatus(@RequestBody BulkStatusUpdateRequest request,
                                              Authentication authentication) {
        return applicationService.bulkUpdateStatus(
                request.getApplicationIds(),
                request.getStatus(),
                request.getRemarks(),
                authentication.getName()
        );
    }

    @PostMapping("/applications/{applicationId}/interview")
    public Object scheduleInterview(@PathVariable Long applicationId,
                                    @RequestBody ScheduleInterviewRequest request,
                                    Authentication authentication) {
        applicationService.updateStatus(applicationId,
                ApplicationStatus.INTERVIEW_SCHEDULED,
                request.getRemarks(),
                authentication.getName());
        return interviewService.scheduleInterview(applicationId, request);
    }

    @PostMapping("/applications/bulk-interview")
    public Object bulkScheduleInterview(@RequestBody BulkInterviewScheduleRequest request) {
        return interviewService.bulkSchedule(request);
    }

    @GetMapping("/interviews")
    public Object getAllInterviews() {
        return interviewService.getAllInterviews();
    }

    @PostMapping("/applications/{applicationId}/offer")
    public Object issueOffer(@PathVariable Long applicationId,
                             @RequestBody IssueOfferRequest request,
                             Authentication authentication) {
        applicationService.updateStatus(applicationId,
                ApplicationStatus.OFFERED,
                request.getRemarks(),
                authentication.getName());
        return offerService.issueOffer(applicationId, request);
    }

    @GetMapping("/offers")
    public Object getOffers() {
        return offerService.getAllOffers();
    }

    @GetMapping("/feedback")
    public Object getFeedback() {
        return feedbackService.getAllFeedback();
    }

    @GetMapping("/analytics")
    public Map<String, Object> analytics() {
        return analyticsService.getSummary();
    }

    @GetMapping("/reports/analytics/pdf")
    public ResponseEntity<byte[]> downloadAnalyticsPdf() {
        byte[] data = reportService.generateAnalyticsPdf();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=analytics-report.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }

    @GetMapping("/students/{studentId}/documents/{type}")
    public ResponseEntity<Resource> downloadStudentDocument(@PathVariable Long studentId,
                                                            @PathVariable String type) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));

        String path;
        if ("resume".equalsIgnoreCase(type)) {
            path = student.getResumePath();
        } else if ("certificates".equalsIgnoreCase(type)) {
            path = student.getCertificatesPath();
        } else {
            throw new IllegalArgumentException("Unsupported document type");
        }

        if (path == null || path.isBlank()) {
            throw new IllegalArgumentException("Document not found");
        }

        Resource resource = documentStorageService.loadAsResource(path);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + type + "-" + studentId)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }
}
