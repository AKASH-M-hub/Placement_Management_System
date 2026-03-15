package com.example.PMS.Service;

import com.example.PMS.Entity.*;
import com.example.PMS.Repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class ApplicationService {

    private final ApplicationRepository appRepo;
    private final StudentRepository studentRepo;
    private final JobRepository jobRepo;
    private final AuditService auditService;

    public ApplicationService(ApplicationRepository appRepo,
                              StudentRepository studentRepo,
                              JobRepository jobRepo,
                              AuditService auditService) {
        this.appRepo = appRepo;
        this.studentRepo = studentRepo;
        this.jobRepo = jobRepo;
        this.auditService = auditService;
    }

    public Application apply(Long studentId, Long jobId, String reviewOpinion) {
        String normalizedOpinion = reviewOpinion == null ? "" : reviewOpinion.trim();
        if (normalizedOpinion.isEmpty()) {
            throw new IllegalArgumentException("Review opinion is required");
        }

        if (appRepo.existsByStudentStudentIdAndJobJobId(studentId, jobId)) {
            throw new IllegalArgumentException("Already applied for this job");
        }

        Student student = studentRepo.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Job job = jobRepo.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        Application application = new Application();
        application.setStudent(student);
        application.setJob(job);
        application.setStatus(ApplicationStatus.APPLIED);
        application.setAppliedDate(LocalDate.now());
        application.setReviewOpinion(normalizedOpinion);
        application.setStatusUpdatedAt(LocalDateTime.now());
        application.setStatusRemarks("Application submitted");

        Application saved = appRepo.save(application);
        auditService.log(student.getEmail(), "APPLY_JOB", "Application", String.valueOf(saved.getApplicationId()),
            "Applied for jobId=" + jobId);
        return saved;
    }

    public List<Application> getAllApplications() {
        return appRepo.findAll();
    }

        public List<Application> getApplicationsByStudent(Long studentId) {
        return appRepo.findByStudentStudentIdOrderByAppliedDateDesc(studentId);
        }

        public List<Application> filterApplications(String status, String department, String skillKeyword, Double minCgpa) {
        return appRepo.findAll().stream()
            .filter(item -> status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)
                || item.getStatus().name().equalsIgnoreCase(status))
            .filter(item -> department == null || department.isBlank()
                || (item.getStudent() != null
                && item.getStudent().getDept() != null
                && item.getStudent().getDept().equalsIgnoreCase(department)))
            .filter(item -> minCgpa == null
                || (item.getStudent() != null && item.getStudent().getCgpa() >= minCgpa))
            .filter(item -> skillKeyword == null || skillKeyword.isBlank()
                || (item.getStudent() != null
                && item.getStudent().getSkills() != null
                && item.getStudent().getSkills().toLowerCase(Locale.ROOT).contains(skillKeyword.toLowerCase(Locale.ROOT))))
            .collect(Collectors.toList());
        }

        public Application updateStatus(Long applicationId, ApplicationStatus status, String remarks, String actorEmail) {
        Application application = appRepo.findById(applicationId)
            .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        application.setStatus(status);
        application.setStatusRemarks(remarks);
        application.setStatusUpdatedAt(LocalDateTime.now());
        Application saved = appRepo.save(application);

        auditService.log(actorEmail, "UPDATE_APPLICATION_STATUS", "Application", String.valueOf(applicationId),
            "Updated to " + status);
        return saved;
        }

        public List<Application> bulkUpdateStatus(List<Long> applicationIds,
                              ApplicationStatus status,
                              String remarks,
                              String actorEmail) {
        if (applicationIds == null || applicationIds.isEmpty()) {
            return List.of();
        }

        return applicationIds.stream()
            .map(id -> updateStatus(id, status, remarks, actorEmail))
            .collect(Collectors.toList());
        }
}
