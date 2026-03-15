package com.example.PMS.Service;

import com.example.PMS.DTO.BulkInterviewScheduleRequest;
import com.example.PMS.DTO.ScheduleInterviewRequest;
import com.example.PMS.Entity.*;
import com.example.PMS.Repository.ApplicationRepository;
import com.example.PMS.Repository.InterviewRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final ApplicationRepository applicationRepository;

    public InterviewService(InterviewRepository interviewRepository,
                            ApplicationRepository applicationRepository) {
        this.interviewRepository = interviewRepository;
        this.applicationRepository = applicationRepository;
    }

    public Interview scheduleInterview(Long applicationId, ScheduleInterviewRequest request) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        application.setStatus(ApplicationStatus.INTERVIEW_SCHEDULED);
        applicationRepository.save(application);

        Interview interview = new Interview();
        interview.setApplication(application);
        interview.setScheduledAt(request.getScheduledAt());
        interview.setMode(request.getMode());
        interview.setMeetingLink(request.getMeetingLink());
        interview.setRemarks(request.getRemarks());
        interview.setStatus(InterviewStatus.SCHEDULED);

        return interviewRepository.save(interview);
    }

    public List<Interview> bulkSchedule(BulkInterviewScheduleRequest request) {
        List<Interview> created = new ArrayList<>();
        if (request.getApplicationIds() == null) {
            return created;
        }

        for (Long applicationId : request.getApplicationIds()) {
            ScheduleInterviewRequest item = new ScheduleInterviewRequest();
            item.setScheduledAt(request.getScheduledAt());
            item.setMode(request.getMode());
            item.setMeetingLink(request.getMeetingLink());
            item.setRemarks(request.getRemarks());
            created.add(scheduleInterview(applicationId, item));
        }

        return created;
    }

    public List<Interview> getAllInterviews() {
        return interviewRepository.findAll();
    }

    public List<Interview> getStudentInterviews(Long studentId) {
        return interviewRepository.findByApplicationStudentStudentIdOrderByScheduledAtAsc(studentId);
    }
}
