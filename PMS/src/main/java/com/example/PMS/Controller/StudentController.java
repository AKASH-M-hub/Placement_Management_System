package com.example.PMS.Controller;

import com.example.PMS.DTO.*;
import com.example.PMS.Entity.Application;
import com.example.PMS.Entity.Interview;
import com.example.PMS.Entity.Offer;
import com.example.PMS.Entity.Student;
import com.example.PMS.Service.ApplicationService;
import com.example.PMS.Service.DocumentStorageService;
import com.example.PMS.Service.FeedbackService;
import com.example.PMS.Service.InterviewService;
import com.example.PMS.Service.OfferService;
import com.example.PMS.Service.StudentService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student")
@PreAuthorize("hasRole('STUDENT')")
public class StudentController {

    private final ApplicationService applicationService;
    private final StudentService studentService;
    private final DocumentStorageService documentStorageService;
    private final InterviewService interviewService;
    private final OfferService offerService;
    private final FeedbackService feedbackService;

    public StudentController(ApplicationService applicationService,
                             StudentService studentService,
                             DocumentStorageService documentStorageService,
                             InterviewService interviewService,
                             OfferService offerService,
                             FeedbackService feedbackService) {
        this.applicationService = applicationService;
        this.studentService = studentService;
        this.documentStorageService = documentStorageService;
        this.interviewService = interviewService;
        this.offerService = offerService;
        this.feedbackService = feedbackService;
    }

    @PostMapping("/apply/{jobId}")
    public Application applyToJob(
            @PathVariable Long jobId,
            @RequestBody ApplyJobRequest request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        Student student = studentService.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));
        return applicationService.apply(student.getStudentId(), jobId, request.getReviewOpinion());
    }

    @GetMapping("/applications")
    public List<Application> getStudentApplications(Authentication authentication) {
        Student student = getCurrentStudent(authentication);
        return applicationService.getApplicationsByStudent(student.getStudentId());
    }

    @GetMapping("/profile")
    public Map<String, Object> getProfile(Authentication authentication) {
        Student student = getCurrentStudent(authentication);
        Map<String, Object> response = new HashMap<>();
        response.put("student", student);
        response.put("completeness", studentService.calculateProfileCompleteness(student));
        return response;
    }

    @PutMapping("/profile")
    public Map<String, Object> updateProfile(@RequestBody UpdateStudentProfileRequest request,
                                             Authentication authentication) {
        Student student = getCurrentStudent(authentication);
        Student updated = studentService.updateProfile(
                student,
                request.getName(),
                request.getDept(),
                request.getCgpa(),
                request.getSkills(),
                request.getPortfolioUrl()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("student", updated);
        response.put("completeness", studentService.calculateProfileCompleteness(updated));
        return response;
    }

    @PostMapping("/documents/{type}")
    public Map<String, String> uploadDocument(@PathVariable String type,
                                              @RequestParam("file") MultipartFile file,
                                              Authentication authentication) {
        Student student = getCurrentStudent(authentication);
        String storedPath;

        if ("resume".equalsIgnoreCase(type)) {
            storedPath = documentStorageService.storeFile(file, "students/resume", String.valueOf(student.getStudentId()));
            student.setResumePath(storedPath);
        } else if ("certificates".equalsIgnoreCase(type)) {
            storedPath = documentStorageService.storeFile(file, "students/certificates", String.valueOf(student.getStudentId()));
            student.setCertificatesPath(storedPath);
        } else {
            throw new IllegalArgumentException("Unsupported document type");
        }

        studentService.updateProfile(student, student.getName(), student.getDept(), student.getCgpa(), student.getSkills(), student.getPortfolioUrl());
        return Map.of("message", "Uploaded successfully", "path", storedPath);
    }

    @GetMapping("/documents/{type}")
    public ResponseEntity<Resource> downloadOwnDocument(@PathVariable String type,
                                                        Authentication authentication) {
        Student student = getCurrentStudent(authentication);

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
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + type + "-" + student.getStudentId())
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    @GetMapping("/interviews")
    public List<Interview> getInterviews(Authentication authentication) {
        Student student = getCurrentStudent(authentication);
        return interviewService.getStudentInterviews(student.getStudentId());
    }

    @GetMapping("/offers")
    public List<Offer> getOffers(Authentication authentication) {
        Student student = getCurrentStudent(authentication);
        return offerService.getStudentOffers(student.getStudentId());
    }

    @PutMapping("/offers/{offerId}/respond")
    public Offer respondOffer(@PathVariable Long offerId,
                              @RequestBody OfferResponseRequest request) {
        return offerService.respondToOffer(offerId, request);
    }

    @PostMapping("/feedback")
    public Object submitFeedback(@RequestBody SubmitFeedbackRequest request,
                                 Authentication authentication) {
        Student student = getCurrentStudent(authentication);
        return feedbackService.submitFeedback("STUDENT", student.getEmail(), request);
    }

    @GetMapping("/feedback")
    public Object getStudentFeedback(Authentication authentication) {
        Student student = getCurrentStudent(authentication);
        return feedbackService.getStudentFeedback(student.getStudentId());
    }

    @GetMapping("/reminders")
    public List<Map<String, String>> getReminders(Authentication authentication) {
        Student student = getCurrentStudent(authentication);

        return applicationService.getApplicationsByStudent(student.getStudentId()).stream()
                .map(item -> Map.of(
                        "title", item.getJob().getTitle(),
                        "message", "Deadline on " + item.getJob().getDeadlineDate(),
                        "priority", item.getJob().getDeadlineDate() != null
                                && item.getJob().getDeadlineDate().isBefore(LocalDate.now().plusDays(3))
                                ? "URGENT" : "INFO"
                ))
                .toList();
    }

    private Student getCurrentStudent(Authentication authentication) {
        String email = authentication.getName();
        return studentService.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));
    }
}
